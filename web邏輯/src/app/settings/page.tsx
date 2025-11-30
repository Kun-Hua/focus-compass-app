"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [userEmail, setUserEmail] = React.useState<string | null>(null)
  const [userId, setUserId] = React.useState<string | null>(null)
  const [remember, setRemember] = React.useState<boolean>(false)
  const [nickname, setNickname] = React.useState<string>("")
  const [nicknameOriginal, setNicknameOriginal] = React.useState<string>("")
  const [nicknameChangeCount, setNicknameChangeCount] = React.useState<number>(0)
  const [nickSaving, setNickSaving] = React.useState(false)
  const [nickMsg, setNickMsg] = React.useState<string | null>(null)
  const [nickErr, setNickErr] = React.useState<string | null>(null)

  React.useEffect(() => {
    const init = async () => {
      try {
        // 讀取目前 Session 與使用者資料
        const { data } = await supabase.auth.getUser()
        const u = data?.user || null
        setUserEmail(u?.email ?? null)
        setUserId(u?.id ?? null)
        if (u?.id) {
          // 讀取 profiles 暱稱與已更名次數
          const { data: prof, error: pErr } = await supabase
            .from('profiles')
            .select('nickname, nickname_change_count')
            .eq('user_id', u.id)
            .single()
          if (!pErr && prof) {
            setNickname(prof.nickname || '')
            setNicknameOriginal(prof.nickname || '')
            setNicknameChangeCount(prof.nickname_change_count ?? 0)
          }
        }
      } finally {
        // 讀取本地『記住我』
        try {
          setRemember(localStorage.getItem("remember_me") === "true")
        } catch {}
        setLoading(false)
      }
    }
    init()
  }, [])

  const handleRememberChange = (checked: boolean) => {
    setRemember(checked)
    try {
      if (checked) {
        localStorage.setItem("remember_me", "true")
        // 若當前已登入且有 email，一併記住 email 以利預填
        if (userEmail) localStorage.setItem("remembered_email", userEmail)
      } else {
        localStorage.removeItem("remember_me")
        localStorage.removeItem("remembered_email")
      }
    } catch {}
  }

  const gotoAuth = () => router.push("/auth")

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
      // 登出後依產品策略：清除 remember
      try {
        localStorage.removeItem("remember_me")
        // email 可選擇保留或清除；這裡一起清除，避免共用裝置殘留
        localStorage.removeItem("remembered_email")
      } catch {}
      router.replace("/auth")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">設定 (Settings)</h1>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>帳戶資訊與登入</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-500">載入中...</p>
          ) : userEmail ? (
            <div className="space-y-2">
              <div className="text-sm text-gray-600">目前登入帳號</div>
              <div className="text-lg font-medium">{userEmail}</div>
              <div className="flex items-center gap-2 mt-3">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={remember}
                  onChange={(e) => handleRememberChange(e.target.checked)}
                />
                <label htmlFor="remember" className="text-sm text-gray-700 select-none">記住我（下次自動登入）</label>
              </div>
              <div className="flex gap-3 mt-4">
                <Button variant="outline" onClick={() => router.push("/dashboard")}>前往儀表板</Button>
                <Button variant="destructive" onClick={handleSignOut} disabled={loading}>登出</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-700">目前尚未登入。</p>
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={remember}
                  onChange={(e) => handleRememberChange(e.target.checked)}
                />
                <label htmlFor="remember" className="text-sm text-gray-700 select-none">記住我（下次自動登入）</label>
              </div>
              <Button onClick={gotoAuth}>前往登入/註冊</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle>匿名（Nickname）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-500">載入中...</p>
          ) : userId ? (
            <div className="space-y-3">
              <div className="text-sm text-gray-600">此名稱將用於問責夥伴與專注聯賽。</div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">目前匿名</label>
                <div className="text-lg font-medium">{nicknameOriginal || '-'}</div>
                <div className="text-xs text-gray-400">已更名次數：{nicknameChangeCount}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">新匿名（3-20 字，英數與底線）</label>
                <Input
                  value={nickname}
                  onChange={(e) => { setNickname(e.target.value); setNickErr(null); setNickMsg(null); }}
                  placeholder="your_name"
                />
              </div>
              {nickErr && <div className="text-sm text-red-600">{nickErr}</div>}
              {nickMsg && <div className="text-sm text-green-700">{nickMsg}</div>}
              <div className="flex gap-3">
                <Button
                  disabled={nickSaving}
                  onClick={async () => {
                    setNickErr(null); setNickMsg(null)
                    const re = /^[A-Za-z0-9_]{3,20}$/
                    if (!re.test(nickname)) { setNickErr('請輸入 3-20 字，僅限英數與底線'); return }
                    if (nickname === nicknameOriginal) { setNickErr('新匿名不可與目前相同'); return }
                    setNickSaving(true)
                    try {
                      const { error: upErr } = await supabase
                        .from('profiles')
                        .upsert({ user_id: userId!, nickname: nickname.trim() })
                      if (upErr) throw upErr
                      setNickMsg('已更新匿名')
                      // 自 DB 讀回最終暱稱與更名次數，避免畫面與實際不同步
                      const { data: prof, error: pErr } = await supabase
                        .from('profiles')
                        .select('nickname, nickname_change_count')
                        .eq('user_id', userId!)
                        .single()
                      if (!pErr && prof) {
                        setNickname(prof.nickname || '')
                        setNicknameOriginal(prof.nickname || '')
                        setNicknameChangeCount(prof.nickname_change_count ?? nicknameChangeCount)
                      }
                    } catch (e: any) {
                      const code = (e as any)?.code || (e as any)?.details || ''
                      const msg = String((e as any)?.message || e)
                      if (code === '23505' || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
                        setNickErr('此匿名已被使用，請換一個')
                        // 還原輸入，避免讓使用者以為成功
                        setNickname(nicknameOriginal)
                      } else {
                        setNickErr(msg)
                      }
                    } finally {
                      setNickSaving(false)
                    }
                  }}
                >{nickSaving ? '儲存中…' : '更新匿名'}</Button>
                <Button variant="outline" onClick={() => { setNickname(nicknameOriginal); setNickErr(null); setNickMsg(null); }}>還原</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-700">請先登入以管理匿名。</p>
              <Button onClick={() => router.push('/auth')}>前往登入</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 你原本散落在各頁的常用設定可以逐步移到這裡下方的群組卡片 */}
      {/* 例如：通知偏好、介面語言、時區、資料匯出等 */}
    </div>
  )
}
