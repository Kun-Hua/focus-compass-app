"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { listSessions, TimelapseSession, getFrames, TimelapseFrame, deleteSession } from '@/utils/localTimelapseStorage'
import { supabase } from '@/lib/supabaseClient'

function msToReadable(ms: number) {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const p = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="w-full h-2 bg-gray-200 rounded">
      <div className="h-2 bg-green-600 rounded" style={{ width: `${p}%` }} />
    </div>
  )
}

function Player({ frames, fps = 6 }: { frames: TimelapseFrame[]; fps?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const idxRef = useRef(0)
  const imagesRef = useRef<HTMLImageElement[] | null>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function preload() {
      if (!frames.length) return
      const imgs: HTMLImageElement[] = []
      for (const f of frames) {
        await new Promise<void>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve()
          img.onerror = () => resolve() // 容錯：即便某張失敗也繼續
          img.src = f.dataUrl
          imgs.push(img)
        })
        if (cancelled) return
      }
      imagesRef.current = imgs
      setReady(true)
      // 初始化畫布尺寸
      const first = imgs[0]
      const canvas = canvasRef.current
      if (canvas && first) {
        canvas.width = first.naturalWidth
        canvas.height = first.naturalHeight
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.drawImage(first, 0, 0)
      }
    }
    preload()
    return () => { cancelled = true }
  }, [frames])

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const step = (t: number) => {
    if (!imagesRef.current?.length) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    if (startRef.current == null) startRef.current = t
    const elapsed = t - startRef.current
    const frameDur = 1000 / (fps || 6)
    const nextIndex = Math.floor(elapsed / frameDur) % imagesRef.current.length
    if (nextIndex !== idxRef.current) {
      idxRef.current = nextIndex
      const img = imagesRef.current[nextIndex]
      if (img) ctx.drawImage(img, 0, 0)
    }
    rafRef.current = requestAnimationFrame(step)
  }

  const toggle = () => {
    if (!ready) return
    if (playing) {
      setPlaying(false)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      startRef.current = null
    } else {
      setPlaying(true)
      startRef.current = null
      rafRef.current = requestAnimationFrame(step)
    }
  }

  return (
    <div className="border rounded p-2 space-y-2">
      <canvas ref={canvasRef} className="rounded max-w-full" />
      <div className="flex items-center gap-2">
        <button onClick={toggle} disabled={!ready} className="rounded border px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50">
          {playing ? '暫停' : '播放'}
        </button>
        {!ready && <span className="text-xs text-gray-500">預載入中...</span>}
      </div>
    </div>
  )
}

async function exportFramesToWebM(frames: TimelapseFrame[], fps = 6): Promise<Blob> {
  if (!frames.length) throw new Error('No frames')
  const targetFps = Math.max(1, fps || 6)
  const frameDur = 1000 / targetFps

  // 預載所有影像，避免邊輸出邊解碼造成卡頓
  const images: HTMLImageElement[] = []
  for (const f of frames) {
    const img = await new Promise<HTMLImageElement>((resolve) => {
      const im = new Image()
      im.onload = () => resolve(im)
      im.onerror = () => resolve(im)
      im.src = f.dataUrl
    })
    images.push(img)
  }

  const first = images[0]
  const w = first.naturalWidth || 640
  const h = first.naturalHeight || 360
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(first, 0, 0)

  const stream = (canvas as HTMLCanvasElement).captureStream(targetFps)
  const chunks: BlobPart[] = []
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 })
  const done = new Promise<Blob>((resolve) => {
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data) }
    rec.onstop = () => resolve(new Blob(chunks, { type: mime }))
  })

  rec.start()
  // recorder 啟動 warm-up，避免開頭黑畫面/卡住
  await new Promise(r => setTimeout(r, 120))

  let idx = 0
  let last = performance.now()
  let acc = 0
  let stopped = false

  await new Promise<void>((resolve) => {
    const loop = (now: number) => {
      if (stopped) return
      acc += now - last
      last = now
      while (acc >= frameDur) {
        const img = images[idx]
        if (img) ctx.drawImage(img, 0, 0)
        idx += 1
        acc -= frameDur
        if (idx >= images.length) {
          stopped = true
          break
        }
      }
      if (!stopped) requestAnimationFrame(loop)
      else resolve()
    }
    requestAnimationFrame((n) => { last = n; requestAnimationFrame(loop) })
  })

  rec.stop()
  const blob = await done
  return blob
}

export default function HonestyZonePage() {
  const [sessions, setSessions] = useState<TimelapseSession[]>([])
  const [frames, setFrames] = useState<Record<string, TimelapseFrame[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState<Record<string, boolean>>({})
  const [downloads, setDownloads] = useState<Record<string, string>>({})

  const [honestMinutes, setHonestMinutes] = useState<number>(0)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const s = await listSessions('desc')
        setSessions(s)
      } catch (e: any) {
        setError(e?.message || '讀取失敗')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('FocusSessionLog')
          .select('duration_minutes, honesty_mode')
          .eq('honesty_mode', true)
        if (error) throw error
        const total = (data || []).reduce((acc: number, row: any) => acc + (row?.duration_minutes || 0), 0)
        setHonestMinutes(total)
      } catch (e) {
        // 靜默失敗：未登入或表不存在時不阻斷頁面
      }
    })()
  }, [])

  const badge = useMemo(() => {
    const tiers = [0, 60, 300, 900, 1800, 3600] // 累積誠實分鐘數：1h,5h,15h,30h,60h
    let level = 0
    for (let i = 0; i < tiers.length; i++) if (honestMinutes >= tiers[i]) level = i
    const next = tiers[Math.min(level + 1, tiers.length - 1)]
    const progress = Math.min(honestMinutes, next)
    return { level, next, progress }
  }, [honestMinutes])

  async function loadFrames(sessionId: string) {
    if (frames[sessionId]) return
    const f = await getFrames(sessionId)
    setFrames(prev => ({ ...prev, [sessionId]: f }))
  }

  async function removeSession(sessionId: string) {
    await deleteSession(sessionId)
    setSessions(prev => prev.filter(s => s.sessionId !== sessionId))
    setFrames(prev => {
      const n = { ...prev }
      delete n[sessionId]
      return n
    })
    if (downloads[sessionId]) {
      URL.revokeObjectURL(downloads[sessionId])
      setDownloads(prev => { const c = { ...prev }; delete c[sessionId]; return c })
    }
  }

  async function handleExport(sessionId: string) {
    const f = frames[sessionId] || []
    if (!f.length) return
    setExporting(prev => ({ ...prev, [sessionId]: true }))
    try {
      const blob = await exportFramesToWebM(f, 6)
      const url = URL.createObjectURL(blob)
      setDownloads(prev => ({ ...prev, [sessionId]: url }))
    } finally {
      setExporting(prev => ({ ...prev, [sessionId]: false }))
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">自我問責區</h1>

      <div className="p-4 border rounded bg-gray-50 space-y-2">
        <div className="text-sm">數位問責勳章 (R6)</div>
        <div className="text-sm">累積高誠實度時長：{honestMinutes} 分鐘</div>
        <ProgressBar value={badge.progress} max={badge.next || 1} />
        <div className="text-xs text-gray-600">等級 L{badge.level}，下一級門檻：{badge.next} 分鐘</div>
      </div>

      {loading && <div>讀取中...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sessions.map(s => (
            <div key={s.sessionId} className="border rounded p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{msToReadable(s.startedAt)}{s.endedAt ? '' : '（錄製中）'}</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadFrames(s.sessionId)}
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-100"
                  >載入</button>
                  <button
                    onClick={() => removeSession(s.sessionId)}
                    className="rounded border px-2 py-1 text-xs hover:bg-red-50 text-red-600"
                  >刪除</button>
                </div>
              </div>
              <div className="text-xs text-gray-500">影格數：{s.frameCount}</div>
              {s.thumbnailDataUrl && (
                <img src={s.thumbnailDataUrl} alt="thumbnail" className="rounded max-w-full" />
              )}
              {frames[s.sessionId] && (
                <Player frames={frames[s.sessionId]} />
              )}
              <div className="flex items-center gap-2">
                {frames[s.sessionId] && (
                  <button
                    onClick={() => handleExport(s.sessionId)}
                    disabled={!!exporting[s.sessionId]}
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-50"
                  >{exporting[s.sessionId] ? '匯出中...' : '匯出 WebM'}</button>
                )}
                {downloads[s.sessionId] && (
                  <a
                    href={downloads[s.sessionId]}
                    download={`timelapse-${s.sessionId}.webm`}
                    className="rounded border px-2 py-1 text-xs hover:bg-gray-100"
                  >下載影片</a>
                )}
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-sm text-gray-600">尚無縮時錄影資料。請至承諾頁面開始縮時錄影。</div>
          )}
        </div>
      )}
    </div>
  )
}
