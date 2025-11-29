import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// PM 規格中，每日 HQC 檢查的 Postgres RPC 函數名稱
const RPC_FUNCTION_NAME = 'check_l10_hqc_status'; 

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!supabaseUrl || !serviceKey) {
      // 缺少高權限金鑰的錯誤處理
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } } // 修正 2: 加入 Content-Type
      )
    }

    // 確保高權限客戶端初始化 (修正 3: 加入 auth: { persistSession: false })
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

    // 呼叫 Postgres 每日檢查 RPC (修正 1: 使用標準化的函數名稱)
    const { error } = await supabase.rpc(RPC_FUNCTION_NAME) 

    if (error) {
      console.error(`RPC Error (${RPC_FUNCTION_NAME}):`, error.message)
      return new Response(
        JSON.stringify({ ok: false, error: error.message }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } } // 修正 2: 加入 Content-Type
      )
    }

    // 成功回覆
    return new Response(
      JSON.stringify({ ok: true }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } } // 修正 2: 加入 Content-Type
    )
  } catch (err) {
    console.error('General Edge Function Error:', err.message)
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } } // 修正 2: 加入 Content-Type
    )
  }
})
