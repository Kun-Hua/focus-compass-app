// 這是 focus-league 函式的程式碼。
// 該函式用於計算每週的聯盟積分，並將下一週的起始日期返回。
import { serve } from 'https://deno.land/std@0.178.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * RPC FUNCTION NAME: PostgreSQL RPC 函式名稱，對應資料庫中的 public.recompute_focus_league
 */
const RPC_FUNCTION_NAME = "recompute_focus_league";

// 建立一個包含 CORS headers 的物件，以便在所有回應中重複使用
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // 允許 POST 和 OPTIONS 方法
};

serve(async (req) => {
  // 關鍵修正：處理瀏覽器發送的 CORS 預檢請求 (preflight request)
  if (req.method === 'OPTIONS') {
    console.log("[focus-league] Handling OPTIONS preflight request.");
    return new Response('ok', { headers: corsHeaders });
  }

  console.log(`[focus-league] Execution Start for ${req.method} request.`);
  try {
    // 1. 從環境變數獲取 Supabase 連線資訊
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // 2. 檢查連線變數是否存在
    if (!supabaseUrl || !serviceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required environment keys." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // *** 追蹤點: 確認 Supabase URL/KEY 已載入 ***
    console.log(`[focus-league] Env: Supabase URL loaded: ${!!supabaseUrl}`);
    console.log(`[focus-league] Env: Service Key loaded: ${!!serviceKey}`);


    // 3. 強制建立新的資料庫客戶端 (不保留連線快取)
    const supabase = createClient(
      supabaseUrl, 
      serviceKey, 
      {
        auth: {
          persistSession: false, // 禁用連線快取
        },
      }
    );

    // 4. 計算下一週的起始日期
    const weekStart = weekStartTaipei();
    
    // 追蹤點 2: 輸出輸入參數 (下一週的起始日期)
    console.log(`[focus-league] RPC Call: Preparing to call ${RPC_FUNCTION_NAME}.`);

    // *** 關鍵修正：根據「參數不匹配」的錯誤，我們假設函式不接受任何參數，因此傳遞一個空物件。 ***
    const rpcParams = {};
    
    // *** 關鍵日誌點：在呼叫前，精確地印出將要傳遞的參數 ***
    console.log('[focus-league] [LOG-RPC-Params] Final parameters to be passed (rpcParams):', JSON.stringify(rpcParams));


    // 5. 呼叫 PostgreSQL RPC 函式 (不傳遞任何參數)
    const { error, data } = await supabase.rpc(RPC_FUNCTION_NAME, rpcParams);

    if (error) {
      // 追蹤點 3: 輸出 API 錯誤回傳
      console.error(`[focus-league] RPC Call FAILED.`);
      console.error(`[focus-league] RPC Error:`, JSON.stringify(error, null, 2));

      // 返回 500 錯誤，並包含資料庫錯誤訊息
      return new Response(
        JSON.stringify({ ok: false, error: `RPC_ERROR: [${error.code}] ${error.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // 追蹤點 4: 輸出 API 成功回傳資料
    console.log("[focus-league] RPC Call SUCCEEDED.");
    console.log("[focus-league] RPC Success data:", JSON.stringify(data, null, 2));

    // 6. 成功返回結果
    return new Response(
      JSON.stringify({ ok: true, week_start: weekStart, rpc_data: data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    // 7. 捕獲一般 Edge Function 錯誤
    // 追蹤點 5: 輸出一般執行時錯誤
    console.error("[focus-league] GENERAL INSTANCE ERROR:", error);
    return new Response(
      JSON.stringify({ 
        ok: false, 
        error: `INSTANCE_ERROR: ${error.message}`,
        stack: error.stack,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } finally {
    console.log("[focus-league] Execution End.");
  }
});

/**
 * 核心業務邏輯：計算下一週的起始日期 (星期一)
 * @returns {string} - 下一週的起始日期，格式為 YYYY-MM-DD
 */
function weekStartTaipei() {
  const tstnow = new Date();
  
  // 1. 設定時區為 Taipei
  const tsOptions = { timeZone: "Asia/Taipei" };
  const tsTaipeitime = new Date(tstnow.toLocaleString("en-US", tsOptions));
  
  console.log(`[focus-league] weekStartTaipei: Current time in Taipei (Date Object): ${tsTaipeitime.toISOString()}`);


  // 2. 獲取今天是星期幾 (0=Sun, 1=Mon, ..., 6=Sat)
  const day = tsTaipeitime.getDay();

  console.log(`[focus-league] weekStartTaipei: Today is Day Index: ${day} (0=Sun, 1=Mon)`);


  // 3. 計算距離下一個星期一 (day=1) 還有幾天
  let diffDays = 0;
  if (day === 0) { // 星期天
    diffDays = 1; // 推進 1 天到星期一
  } else { // 星期一到星期六
    diffDays = 7 - day + 1;
  }
  
  console.log(`[focus-league] weekStartTaipei: Days to advance to next Monday: ${diffDays} days`);


  // 4. 將日期推進到下一週的星期一
  const nextWeekStart = new Date(tsTaipeitime.getTime());
  nextWeekStart.setDate(tsTaipeitime.getDate() + diffDays);
  
  // 5. 將時間設為午夜 (00:00:00)
  nextWeekStart.setHours(0, 0, 0, 0);
  
  // 6. 格式化為 YYYY-MM-DD 字符串 (供資料庫 RPC 使用)
  const year = nextWeekStart.getFullYear();
  const month = String(nextWeekStart.getMonth() + 1).padStart(2, '0');
  const date = String(nextWeekStart.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${date}`;
}
