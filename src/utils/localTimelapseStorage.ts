export type TimelapseSession = {
  sessionId: string
  startedAt: number
  endedAt?: number
  frameCount: number
  thumbnailDataUrl?: string
}

export type TimelapseFrame = {
  sessionId: string
  ts: number
  dataUrl: string
}

const DB_NAME = 'honesty-timelapse'
const DB_VERSION = 1
const STORE_SESSIONS = 'sessions'
const STORE_FRAMES = 'frames'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB not supported'))
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const s = db.createObjectStore(STORE_SESSIONS, { keyPath: 'sessionId' })
        s.createIndex('startedAt', 'startedAt')
      }
      if (!db.objectStoreNames.contains(STORE_FRAMES)) {
        const f = db.createObjectStore(STORE_FRAMES, { keyPath: ['sessionId', 'ts'] })
        f.createIndex('by_session', 'sessionId', { unique: false })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function createSession(): Promise<TimelapseSession> {
  const db = await openDB()
  const session: TimelapseSession = {
    sessionId: crypto.randomUUID(),
    startedAt: Date.now(),
    frameCount: 0,
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS], 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.objectStore(STORE_SESSIONS).add(session)
  })
  db.close()
  return session
}

export async function appendFrame(sessionId: string, dataUrl: string): Promise<void> {
  const db = await openDB()
  const ts = Date.now()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS, STORE_FRAMES], 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)

    const frames = tx.objectStore(STORE_FRAMES)
    frames.put({ sessionId, ts, dataUrl } as TimelapseFrame)

    const sessions = tx.objectStore(STORE_SESSIONS)
    const getReq = sessions.get(sessionId)
    getReq.onsuccess = () => {
      const s = getReq.result as TimelapseSession | undefined
      if (s) {
        s.frameCount = (s.frameCount || 0) + 1
        sessions.put(s)
      }
    }
  })
  db.close()
}

export async function finalizeSession(sessionId: string, thumbnailDataUrl?: string): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS], 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    const store = tx.objectStore(STORE_SESSIONS)
    const getReq = store.get(sessionId)
    getReq.onsuccess = () => {
      const s = getReq.result as TimelapseSession | undefined
      if (!s) return
      s.endedAt = Date.now()
      if (thumbnailDataUrl) s.thumbnailDataUrl = thumbnailDataUrl
      store.put(s)
    }
  })
  db.close()
}

export async function listSessions(order: 'desc' | 'asc' = 'desc'): Promise<TimelapseSession[]> {
  const db = await openDB()
  const res: TimelapseSession[] = []
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS], 'readonly')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    const store = tx.objectStore(STORE_SESSIONS)
    const idx = store.index('startedAt')
    const direction = order === 'desc' ? 'prev' : 'next'
    const cursorReq = idx.openCursor(null, direction as IDBCursorDirection)
    cursorReq.onsuccess = () => {
      const cur = cursorReq.result
      if (cur) {
        res.push(cur.value as TimelapseSession)
        cur.continue()
      }
    }
  })
  db.close()
  return res
}

export async function getFrames(sessionId: string): Promise<TimelapseFrame[]> {
  const db = await openDB()
  const res: TimelapseFrame[] = []
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_FRAMES], 'readonly')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    const idx = tx.objectStore(STORE_FRAMES).index('by_session')
    const req = idx.openCursor(IDBKeyRange.only(sessionId), 'next')
    req.onsuccess = () => {
      const cur = req.result
      if (cur) {
        res.push(cur.value as TimelapseFrame)
        cur.continue()
      }
    }
  })
  db.close()
  return res
}

export async function deleteSession(sessionId: string): Promise<void> {
  const db = await openDB()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction([STORE_SESSIONS, STORE_FRAMES], 'readwrite')
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)

    const frames = tx.objectStore(STORE_FRAMES)
    const idx = frames.index('by_session')
    const req = idx.openCursor(IDBKeyRange.only(sessionId))
    req.onsuccess = () => {
      const cur = req.result
      if (cur) {
        frames.delete(cur.primaryKey as IDBValidKey)
        cur.continue()
      }
    }

    tx.objectStore(STORE_SESSIONS).delete(sessionId)
  })
  db.close()
}
