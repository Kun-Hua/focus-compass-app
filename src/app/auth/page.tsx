"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = React.useState<"signin" | "signup">("signin")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [remember, setRemember] = React.useState<boolean>(false)
  const [showNicknameModal, setShowNicknameModal] = React.useState(false)
  const [nickname, setNickname] = React.useState("")
  const [nicknameError, setNicknameError] = React.useState<string | null>(null)
  const [nicknameSaving, setNicknameSaving] = React.useState(false)

  // 預填記住的 email 與記住狀態
  React.useEffect(() => {
    try {
      const savedRemember = localStorage.getItem("remember_me") === "true"
      const savedEmail = localStorage.getItem("remembered_email") || ""
      setRemember(savedRemember)
      if (savedRemember && savedEmail) setEmail(savedEmail)
    } catch {}
  }, [])

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        // 顯示暱稱設定視窗
        setShowNicknameModal(true)
        setLoading(false)
        return
      }
      // 記住設定
      try {
        if (remember) {
          localStorage.setItem("remember_me", "true")
          localStorage.setItem("remembered_email", email)
        } else {
          localStorage.removeItem("remember_me")
          localStorage.removeItem("remembered_email")
        }
      } catch {}
      router.push("/dashboard")
    } catch (err: any) {
      setError(err?.message ?? "發生未知錯誤，請稍後再試")
    } finally {
      if (mode === "signin") setLoading(false)
    }
  }

  const handleGoogleOAuth = async () => {
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined,
        },
      })
      if (error) throw error
      // 記住設定（第三方登入一樣可記住 email 以利預填；此處僅保留 remember flag）
      try {
        if (remember) {
          localStorage.setItem("remember_me", "true")
          if (email) localStorage.setItem("remembered_email", email)
        } else {
          localStorage.removeItem("remember_me")
          // 不移除 email，避免使用者剛剛輸入被清除；留給 email 流程決定
        }
      } catch {}
      // 導向將由 Supabase 完成（透過 redirectTo），此處不再手動 push
    } catch (err: any) {
      setError(err?.message ?? "第三方登入發生錯誤")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-white">
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-6">
          <div className="text-sm text-gray-500 mb-1">產品名稱</div>
          <h1 className="text-2xl font-bold text-gray-900">複利指南針 (Compound Compass)</h1>
        </div>
        <Card className="shadow-md border border-gray-100">
          <CardHeader>
            <CardTitle className="text-center text-lg text-gray-800">高價值投入中心。科學執行教練。</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">電子郵件</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">密碼</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <label htmlFor="remember" className="text-sm text-gray-600 select-none">記住我（下次自動登入）</label>
              </div>
              {error ? (
                <div className="text-red-600 text-sm">{error}</div>
              ) : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "處理中..." : mode === "signin" ? "登入" : "註冊"}
              </Button>
            </form>

            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="px-3 text-xs text-gray-400">或</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={loading}
                onClick={handleGoogleOAuth}
              >
                使用 Google 登入
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600 mt-4">
              {mode === "signin" ? (
                <button
                  className="underline hover:text-gray-800"
                  onClick={() => setMode("signup")}
                >
                  還沒有帳號？建立新帳號
                </button>
              ) : (
                <button
                  className="underline hover:text-gray-800"
                  onClick={() => setMode("signin")}
                >
                  已有帳號？前往登入
                </button>
              )}
            </div>
          </CardContent>
        </Card>
        {showNicknameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white shadow-lg border p-5">
              <div className="text-lg font-semibold mb-2">設定你的匿名</div>
              <div className="text-xs text-gray-500 mb-3">此匿名將用於問責夥伴與專注聯賽。</div>
              <div className="space-y-2">
                <label className="block text-sm text-gray-600">匿名（3-20 字，英數與底線）</label>
                <Input
                  value={nickname}
                  onChange={(e) => { setNickname(e.target.value); setNicknameError(null); }}
                  placeholder="your_name"
                />
                {nicknameError && <div className="text-xs text-red-600">{nicknameError}</div>}
              </div>
              <div className="flex items-center justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => { setShowNicknameModal(false); router.push('/dashboard'); }}
                >之後再設定</Button>
                <Button
                  disabled={nicknameSaving}
                  onClick={async () => {
                    // 前端格式檢查
                    const re = /^[A-Za-z0-9_]{3,20}$/
                    if (!re.test(nickname)) {
                      setNicknameError('請輸入 3-20 字，僅限英數與底線')
                      return
                    }
                    setNicknameSaving(true)
                    setNicknameError(null)
                    try {
                      // 取得使用者 id
                      const { data: userData, error: uErr } = await supabase.auth.getUser()
                      if (uErr) throw uErr
                      const uid = userData.user?.id
                      if (!uid) throw new Error('尚未登入，請重新嘗試')

                      // 直接寫入/更新 profiles，交由 DB 唯一索引把關
                      const { error: iErr } = await supabase
                        .from('profiles')
                        .upsert({ user_id: uid, nickname: nickname.trim() })
                      if (iErr) {
                        // 若為唯一性衝突（23505），顯示友善訊息
                        const code = (iErr as any)?.code || (iErr as any)?.details || ''
                        const msg = String((iErr as any)?.message || '')
                        if (code === '23505' || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
                          setNicknameError('此匿名已被使用，請換一個')
                        } else {
                          throw iErr
                        }
                        setNicknameSaving(false)
                        return
                      }

                      setShowNicknameModal(false)
                      router.push('/dashboard')
                    } catch (e: any) {
                      setNicknameError(e?.message || '設定失敗，稍後再試')
                    } finally {
                      setNicknameSaving(false)
                    }
                  }}
                >{nicknameSaving ? '儲存中…' : '儲存'}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
