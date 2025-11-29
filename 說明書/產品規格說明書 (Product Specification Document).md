# Focus Compass（複利指南針）產品規格說明書 (Product Specification Document)

---

## 1. 產品願景與定位 (Vision & Positioning)

### 1.1 一句話描述

Focus Compass 是知識型工作者的 **「高價值時間投入指揮中心」** 與 **「程式化執行教練」**。
透過可驗證的計時資料、問責機制與社群競賽，把有限時間轉換為可預期的長期複利成果。

### 1.2 目標用戶

針對需長期自我管理、重視深度專注與可追蹤成長軌跡的使用者：

- 創作者（寫作者、YouTuber、Podcaster…）
- 顧問與自由工作者
- 早期創業者
- 進階效率愛好者（習慣已有基礎，希望「調優」而非「入門」）

### 1.3 核心痛點與對應方案

| 痛點 | 說明 | 對應機制 / 功能 |
| :--- | :--- | :--- |
| 精力分散 | 任務太多、目標不聚焦，所有事情都「有點重要」。 | Vision 分頁導入巴菲特 5/25 法則與 MIT 機制，強制只維持最多 5 個核心目標，其餘收納於「避免清單」。 |
| 執行無感 | 傳統計時器容易作弊或忘記紀錄，難以形成真實數據。 | Honesty Mode、縮時錄影 (Timelapse Recorder)、中斷原因與次數強制回填，產生高誠實度的 `FocusSessionLog`。 |
| 缺乏意義鏈接 | 每天完成很多小事，但與長期目標的關聯感薄弱。 | 以終為始問卷、年/季/月/週目標階梯拆解、週承諾時數與 Dashboard KPI，讓「每一段專注」對齊人生與年度願景。 |

---

## 2. 核心哲學基石與競爭優勢 (Philosophical Foundation & USP)

### 2.1 巴菲特 5/25 法則 — 強制聚焦

- **核心觀點**：真正重要的目標通常不會超過 5 個，其餘應視為「主動避免」的干擾。
- **產品機制**：
  - Vision 願景頁以拖放操作管理所有目標。
  - 使用者只能將最多 5 個目標標記為 Core，其餘自動歸為 Avoid 清單。
- **競爭優勢（USP 1）**：
  - Core Top5 會即時同步至 Execute、Dashboard 等頁面，其它目標在主要運行流程中被弱化或隱藏，形成真正的防干擾機制。

### 2.2 以終為始 & 原子習慣 — 意義與可持續性

- **核心觀點**：行動必須錨定在更長遠的角色與人生畫面上，短期才能持續。
- **產品機制**：
  - Step 1 以終為始問卷（可略過）：80 歲回顧、想留下什麼、理想的一天、三大價值觀等開放式問題。
  - 目標階梯：年／季／月／週目標與週承諾時數，搭配承諾月曆使長期目標具體化。
  - MIT 卡片：每天只選一個最重要任務，建立「今日行動 ←→ 長期使命」的正向回饋。
- **競爭優勢（USP 2）**：
  - 週承諾 × 52 計算年度時間複利預估值，以具體數字呈現長期投資報酬，提升承諾黏著度。

### 2.3 高誠實度問責 (High-Integrity Accountability)

- **核心觀點**：沒有誠實度的數據，只會製造錯誤自信；問責需要可驗證的紀錄。
- **產品機制**：
  - Honesty Mode + Timelapse：標記「高誠實度時長」，可視覺驗證投入情況。
  - 計時後強制紀錄中斷原因與次數，形成可計算的中斷模式。
  - 問責夥伴與 Focus League 透過 Supabase Realtime 分享與比較數據。
- **競爭優勢（USP 3）**：
  - 個人、夥伴、小聯賽三層問責皆建立在統一的 `FocusSessionLog` 上，避免「排行榜很好看但實際不可信」的問題。

---

## 3. 功能架構與內容藍圖 (Functional Specification)

### 3.1 模組總覽

| 分頁/模組 | 核心任務 | 關聯哲學 | 關鍵功能重點 |
| :--- | :--- | :--- | :--- |
| Vision | 目標定義、5/25 聚焦、目標拆解 | 強制聚焦、以終為始 | 以終為始問卷、5/25 拖放分類、核心目標階梯拆解、承諾月曆與任務排程、MIT 指派。 |
| Execute | 專注計時與中斷問責 | 高誠實度、時間複利 | Honesty Mode、碼表／番茄鐘／縮時錄影、強制中斷紀錄、寫入 `FocusSessionLog`。 |
| Dashboard | 每日決策、進度回饋 | 意義錨定、時間複利 | MIT 卡片、週連勝、角色圓餅、熱力圖、目標統計、程式化診斷、週承諾達標檢核。 |
| Focus League | 即時聯賽、徽章與歷史 | 誠實度社群化 | Realtime 排行榜、段位卡、徽章牆、歷史紀錄。 |
| Partner | 一對一問責 | 高誠實度、防禦性 | 日／週／月比較表、邀請與可見性設定、指標排序。 |
| Settings | 全域設定與帳號 | 防禦性、可擴充 | 語系、登入狀態、未來帳號與付費設定入口。 |

---

### 3.2 Vision 分頁 — 目標設定與承諾引擎

**主要任務**：完成以終為始思考、套用 5/25 篩選，並將核心目標拆解為可追蹤的週承諾與日曆任務。

**使用情境與流程**：

1. **Step 1：以終為始問卷（可略過）**
   - 題目：80 歲回顧、想留下什麼、理想的一天、三大價值觀等。
   - 提供多行輸入與字詞提示。
   - 若勾選「我已清楚目標，暫時跳過」，會隱藏問卷區塊並寫入 `localStorage.vision.skipStep1`。

2. **巴菲特 5/25 目標清單與拖放分類**
   - 新增目標輸入框，預設加入「避免清單」，錯誤訊息顯示在欄位下方。
   - 透過 Dnd-kit 在 Core / Avoid 兩欄拖移，呼叫 `updateGoalCategory` 更新 Supabase `Goal.goal_category`。
   - Core 欄僅顯示前 5 個目標，避免視覺噪音；多餘 Core 資料仍保留於資料庫但不顯示。

3. **核心目標與 Subgoal 管理**
   - 每個 Core 目標擁有一組小目標清單，可新增、重新命名、刪除與上下移動排序。
   - 排序由 `reorderSubgoals` 將新順序陣列寫回 Supabase。
   - 若未主動選取核心目標，預設選第一個 Core 確保管理器有依附對象。

4. **目標階梯拆解與週承諾**
   - 對應 Top5 Core，每個目標提供年／季／月／週目標文字與週承諾時數欄位。
   - 任一欄位更新時，同步更新 GoalsProvider state 並寫入 `commitment_goal_plans_v3`。
   - 週承諾時數支援小數，供 Dashboard 換算分鐘後做達標檢查。
   - 若 Core Top5 調整，會重新對齊既有拆解資料並盡量保留文字草稿。

5. **承諾月曆與任務指派**
   - 42 格月曆涵蓋整月，支援新增、勾選完成與刪除任務。
   - 新增任務時建立 UUID，寫入 `commitment_calendar_tasks_v3`，並彈出 Assign Dialog 要求綁定 Core 目標；若尚未設定核心目標，提示先完成 5/25。
   - 任務卡顯示對應目標標籤；點擊任務文字可直接切換完成狀態並同步 localStorage。
   - 當任務被選為 MIT 時，透過 URL query (`mitDate`, `mitId`) 反向定位 Vision 月曆高亮，確保 Vision／Execute／Dashboard 三者互通。

---

### 3.3 Execute 分頁 — 專注計時中心

**主要任務**：在選定的目標／小目標下，紀錄具誠實度標記的專注時段與中斷模式。

**操作流程與功能細節**：

1. **專注目標與小目標選擇**
   - 頁面載入時讀取 GoalsProvider 的 `goalPlans`。
   - 若 URL 帶有 `?goalId=<uuid>`，預選對應目標。
   - 切換大目標時，自動清空 Subgoal 選擇避免誤記。
   - 畫面同步顯示該目標在 Vision 階梯設定中的週承諾與說明。

2. **Honesty Mode 誠實問責開關**
   - Toggle 切換時，即刻更新視覺狀態與提示文字。
   - 啟用時，FocusTimer 會在 console 顯示高誠實度提示，並在寫入 `FocusSessionLog` 時加註 `honesty_mode = TRUE`。

3. **多計時器 Tab**
   - **碼表 (Stopwatch)**：使用共用 `FocusTimer` 元件；啟動前必須先選目標；暫存狀態記錄於 `localStorage.focus_timer_active_v1` 以支援頁面重整恢復。
   - **番茄鐘 (Pomodoro)**：預設 25 分鐘（可調整），結束後走共用 `handleSessionComplete` 流程。
   - **縮時錄影 (Timelapse Recorder)**：長駐元件，切換 Tab 不中斷錄影，完成後回傳實測分鐘數。
   - `proEnabled` 旗標目前預設 true 方便測試，正式版可為付費牆。

4. **中斷紀錄與問責彈窗**
   - 任一計時器停止後必出現 Modal，要求選擇中斷原因（預設 8 種標籤）與次數。
   - 若完全無中斷，可按「完全專注」快速略過。
   - Modal 開啟期間禁用背景互動，確保紀錄不被略過；提交後呼叫 GoalsProvider 的 `addFocusSession`。

5. **專注紀錄寫入與回饋**
   - `addFocusSession` 將紀錄（包含 `honesty_mode`, `subgoal_id`, `interruption_reason`, `interruption_count`, `duration_minutes`, `start_time`）寫入 Supabase `FocusSessionLog`。
   - 寫入失敗顯示錯誤 Toast；成功則顯示成功提示並重置 Modal。
   - 若左側有對應 Vision 月曆任務，可直接勾選為完成，形成 Vision ↔ Execute 的閉環。

---

### 3.4 Dashboard 分頁 — 每日決策中心

**主要任務**：幫助使用者在每天／每週快速回答：「接下來最該做什麼？」並看見承諾達成與時間複利進展。

**資料視覺化與決策輔助**：

1. **MIT (Most Important Task) 卡片**
   - 從 Vision 月曆讀取「今日」任務清單，供使用者選擇 MIT。
   - 選擇結果存於 `localStorage.dashboard_mit_<date>`，跨裝置以 localStorage 為準。
   - 若 MIT 綁定 goalId，按下「啟動專注」會導向 `/execute?goalId=<uuid>`。

2. **核心 KPI 卡片**
   - 顯示：本週承諾總時數（由 Vision 週承諾 × 60 換算分鐘）、實際淨投入分鐘、高誠實度比率。
   - 透過 `useWeeklyStreak` Hook 管理 loading / error 狀態與 refresh 函式。

3. **時間範圍切換與明細表格**
   - 支援 All / Month / Week / Day 範圍切換。
   - 每次切換重新查詢 Supabase `FocusSessionLog`，計算各目標的專注分鐘與 session 次數。
   - 表格顯示 Honest / Non-honest 分鐘數與排序（依總分鐘數降冪）。

4. **角色平衡與效率熱力圖**
   - 角色圓餅圖：依 `Goal.linked_role` 匯總高誠實度分鐘；未標記角色歸為「未分類」。
   - 熱力圖：以過去 7 日 × 24 小時矩陣呈現專注分鐘，用於辨識高效時段。

5. **程式化診斷與建議**
   - `DiagnosisSummary` 讀取 `topNInterruptionReasons` 結果，顯示前三大中斷原因。
   - 每個原因對應一張 `ProgrammaticAdviceCard`，內容來自預先定義的 IF/THEN 規則。
   - 若近一週尚無資料，顯示空狀態並引導前往 Execute 累積紀錄。

6. **週承諾達標檢核**
   - 對每個 Core 目標計算「實際投入分鐘（honest + non-honest） vs 週承諾分鐘」。
   - 若所有設有承諾的目標皆達標，顯示綠色成功徽章。
   - 承諾為 0 的目標不列入檢核。

---

### 3.5 Focus League 分頁 — 即時聯賽與群體激勵

**主要任務**：透過段位、排行榜與徽章，提供長期的外部刺激與社群認同感。

1. **段位卡 (LeagueCard)**
   - 呼叫 RPC `getLeagues` 取得段位設定。
   - `getMyLeagueMapping` 回傳使用者目前所在聯賽、升降級門檻與與同級人數。
   - 顯示本週排名、距離升級還差幾分鐘、是否觸發降級條件等狀態。

2. **Supabase Realtime 排行榜**
   - 訂閱 `supabase.channel('focus_league_user_stats')`，收到變更即更新排序。
   - 以顏色區分前半部與後半部名次，避免單一列表過長。
   - 顯示暱稱、週誠實時數、排名變動箭頭；延遲時顯示 loading skeleton。

3. **徽章牆與歷史紀錄**
   - `getMyBadges`：取得目前徽章並依獲得日期排序，尚未獲得的顯示為灰階或「未解鎖」。
   - `getMyLeagueHistory`：呈現過去各週段位與排名，協助使用者回顧成長趨勢。

---

### 3.6 Partner 分頁 — 問責夥伴中心

**主要任務**：與少數高信任夥伴互相比較，維持有溫度的一對一問責。

1. **統計範圍與排序控制**
   - 支援日／週／月切換；切換時重新呼叫 `computeWeeklyMetricsLocal` 計算自己的統計。
   - 排序支援「專注時長」與「承諾達成率」，預設依淨承諾時長降冪。
   - 顯示統計起訖日期，方便雙方核對。

2. **夥伴邀請與查詢**
   - 依暱稱 (nickname) 匿名查詢 `profiles`，以避免暴露 email。
   - 選擇後建立 `AccountabilityPartner` 記錄，帶入 visibility 設定。
   - 若 pending + active 夥伴數 ≥ 5，阻擋新邀請並顯示錯誤。

3. **邀請處理流程**
   - 被邀請者可在列表中接受或拒絕。
   - 接受時，必要時建立反向關係，並同步啟用雙方資料可視設定。
   - 拒絕則標記邀請狀態為 `revoked`。

4. **雙向可視與隱私控管**
   - 夥伴卡顯示：淨承諾分鐘、總投入、誠實度、平均中斷頻率、承諾達成率等五項指標。
   - 若對方關閉某指標的可見性， UI 以 `—` 顯示。
   - 每位夥伴可展開查看最近趨勢（目前以文字描述，保留圖表擴充空間）。

---

### 3.7 全域導航與設定

- `Header` 固定在頂部，連結 Vision / Execute / Dashboard / League / Partner / Settings，並顯示登入狀態。
- `RootLayout`：
  - 設定預設語系 `zh-TW`。
  - 載入 Inter 字型。
  - 包裹 `GoalsProvider`，提供跨頁共用目標與承諾資料。
- Settings 分頁目前為未來擴充預留區，預計容納帳號管理、付費方案、通知偏好與語系切換。

---

## 4. 資料模型與程式化邏輯 (Backend Data Model & Logic)

### 4.1 架構原則

1. **單一真實世界資料來源**  
   所有時間投入的真實紀錄以 Supabase `FocusSessionLog` 為準；Vision 與 Dashboard 的草稿與設定可暫存於 localStorage，但 KPI 與排行榜一律以 `FocusSessionLog` 計算。

2. **純程式化智慧，避免黑盒 AI**  
   所有建議、診斷與排行榜皆由 IF/THEN 或 SQL 聚合完成，確保可理解與可調整。

3. **模組化狀態管理**  
   GoalsProvider 集中管理目標、週承諾、日曆任務與計時寫入，減少跨頁資料不一致問題。

4. **即時同步**  
   Focus League 透過 Supabase Realtime 更新排行榜；Partner 透過 RPC 與視圖維持雙方資料同步。

### 4.2 核心資料實體 (Supabase + 本地儲存)

| 實體/儲存 | 關鍵欄位/鍵值 | 說明 | 用途 |
| :--- | :--- | :--- | :--- |
| `User` | `mission_statement`, `roles`, `accountability_partner_id` | 使用者哲學對齊資訊與問責關聯 | 儀表板錨定、夥伴關係 |
| `Goal` | `goal_id`, `goal_name`, `goal_category`, `linked_role` | 目標主檔，含 Core / Avoid 分類與角色綁定 | Vision、Dashboard、Execute |
| `Subgoal` | `subgoal_id`, `goal_id`, `name`, `order` | 核心目標拆解 | Vision Subgoal 管理、Execute 下拉選擇 |
| `FocusSessionLog` | `session_id`, `goal_id`, `subgoal_id`, `duration_minutes`, `honesty_mode`, `interruption_reason`, `interruption_count`, `start_time` | 專注紀錄唯一來源 | Dashboard / Review / Partner / League |
| `focus_league_user_details` (View) | `display_name`, `weekly_honest_minutes`, `rank_in_group` | 聯賽排行榜顯示來源 | Focus League |
| `focus_league_user_stats` | Realtime 來源表 | 觸發排行榜更新 | Focus League 即時訂閱 |
| `AccountabilityPartner` | `owner_user_id`, `partner_user_id`, `partner_email`, `role`, `visibility`, `status`, `invite_token` | 問責夥伴關係與可視設定 | Partner 頁面 |
| `profiles` | `user_id`, `nickname` | 匿名查詢資料 | Partner 邀請搜尋 |
| localStorage `vision.step1Answers` | JSON | 以終為始問卷結果 | Vision 啟動前載入 |
| localStorage `vision.skipStep1` | boolean | 是否跳過 Step 1 | Vision UI 控制 |
| localStorage `commitment_goal_plans_v3` | GoalPlan[] | 目標拆解與週承諾 | Vision / Execute / Dashboard 共用 |
| localStorage `commitment_calendar_tasks_v3` | CalendarStore | 月曆任務與完成情況 | Vision / Dashboard |
| localStorage `dashboard_mit_<date>` | string | 本日 MIT 任務選擇 | Dashboard |
| localStorage `goals_v2` | 舊版遺留 | 初次啟動執行遷移 → Supabase `Goal` | GoalsProvider 內建遷移腳本 |

### 4.3 程式化邏輯規格

| 功能 | 規則 / 公式 | 來源 |
| :--- | :--- | :--- |
| 年度時間複利 | `AnnualForecast = Σ weeklyHours(goal) × 52` | Vision 週承諾設定 |
| 週承諾連勝 (Weekly Streak) | 若本週實際投入 ≥ 週承諾總和 → streak + 1；否則歸零。 | `useWeeklyStreak`, `FocusSessionLog` |
| 週報告承諾達成率 | `Rate = (Σ FocusSessionLog.durationMinutes(本週) / Σ WeeklyCommitmentHours × 60) × 100%` | Dashboard KPI |
| 目標健康分數（概念位） | 當 `Rate < 50%` 或中斷次數高於平均，標記為紅燈。 | Dashboard 或未來報告 |
| 中斷建議 | 例如：若 `mostCommonReason === '通知'`，建議開啟勿擾模式或飛航模式。 | Review/Data `ADVICE_MAP` |
| 目標相近群組排名 | 依 `Goal_GoalTags` 聚類使用者，並以「高誠實度總分鐘數」排序。 | 未來 V2 功能 |

---

## 5. 產品品質、發布準備與持續迭代 (Quality, Go-to-Market & Roadmap)

### 5.1 產品品質保證與測試重點 (QA & Testing)

測試聚焦在兩點：

1. **數據正確性**：時間、誠實度、承諾達成率計算必須可重演、可驗證。
2. **哲學邏輯不可被繞過**：例如 5/25 聚焦、Honesty Mode 標記、中斷紀錄等。

| 測試類型 | 具體情境與驗證點 | 品質標準 |
| :--- | :--- | :--- |
| 哲學邏輯強制性 | 在 `Goal` 實體中嘗試儲存超過 5 個 Core 目標，驗證 UI 或後端是否阻擋。 | 無法透過一般操作繞過聚焦限制。 |
| 核心數據閉環 | 模擬完成 30 分鐘專注，確認 `FocusSessionLog` 的 `duration_minutes` 正確寫入並反映在 Dashboard 週承諾達成率。 | 計算結果與預期完全一致。 |
| 高誠實度標記 | 在 Honesty Mode + Timelapse 下完成專注，確認 `honesty_mode = TRUE`。 | 誠實度標記與實際模式一致。 |
| 程式化邏輯建議 | 建立 2–4 PM 連續 5 次中斷（原因為 "通知"）的測試資料，驗證對應建議卡有正確顯示。 | 建議內容與 IF/THEN 規則對應無誤。 |
| 彈性排程 | 將 1 小時時間塊從週一拖曳到週四，確認總承諾不變，且日曆不對每日進度過度懲罰。 | 原子習慣的容錯性邏輯如預期運作。 |

### 5.2 發布準備與市場定位 (Go-to-Market Strategy)

| 準備工作 | 策略重點 | 文案與定位方向 |
| :--- | :--- | :--- |
| App 名稱與副標題 | 必須包含「專注」、「時間複利」、「目標聚焦」等關鍵詞。 | 例：**「高價值聚焦：你的時間複利儀表」**。 |
| 截圖與預覽 | 必須突出 5/25 篩選流程、Honesty Mode 專注錄影、時間複利儀表。 | 強調「避免瞎忙」、「可驗證的時間投資」。 |
| 定價策略 | 建議訂閱制：免費版提供標準計時與 5/25；付費解鎖縮時錄影、自動週報告、程式化建議等。 | 對齊「高價值用戶」定位，篩選掉只想玩玩看的使用者。 |
| 初期社群 | 聚焦 Notion 使用者、效率黑客、創作者等對結構化與數據化有期待的族群。 | 以內容行銷與教學文引導。 |

### 5.3 產品迭代與 V2 藍圖 (Roadmap for Growth)

| 迭代功能 (V2 Focus) | 目的 | 依賴的數據基礎 |
| :--- | :--- | :--- |
| 成就與基準線 | 實作 Goal Tags 跨用戶數據，提供相近目標群組的徽章與全球基準線。 | 需要累積足夠活躍用戶與目標標籤。 |
| 程式化排程優化 | 從「給建議」升級為「一鍵建立建議排程」，直接寫回 Vision 月曆。 | 依賴 `FocusSessionLog.start_time` 與熱力圖。 |
| 視覺化反向日曆 | 在 Vision 以互動方式呈現「從年到週」的拆解路徑。 | 提升長期目標與日常任務的可視化。 |
| 多層次問責群組 | 支援 3–5 人私密問責小組，共享高誠實度時長資訊。 | 在不過度曝光個人細節下，增加社會支持力道。 |

---

## 6. 技術棧與部署建議 (Tech Stack & Deployment)

### 6.1 開發技術棧 (The Development Stack)

| 項目 | 推薦工具 | 職責與優勢 |
| :--- | :--- | :--- |
| 前端框架 | **Next.js 14 + TypeScript** | 主流生態、AI 支援充足；TypeScript 提升型別安全與維護性。 |
| 資料庫 / 後端 | **Supabase (Postgres)** | 提供 Auth、資料庫與 Realtime，適合集中管理 5 大核心實體與 RPC。 |
| 樣式與 UI | **Tailwind CSS** | 開發速度快、可維持風格一致且易於調整。 |
| 部署與託管 | **Vercel** | 與 Next.js 緊密整合，一鍵部署，免費額度足以支援早期成長。 |

> 原則：避免太冷門或實驗性框架，以確保 AI 支援度與人力補充的可行性。

### 6.2 運營與整合工具 (Operations Ecosystem)

| 項目 | 推薦工具 | 職責與優勢 |
| :--- | :--- | :--- |
| 自動化 / 集成中樞 | **n8n** | 承接跨系統集成、排程任務與自動化流程，避免業務邏輯散落在前端。 |
| 錯誤追蹤 | **Sentry** | 監控前後端錯誤，特別是程式化邏輯失敗時的告警。 |
| 行為分析 | **Mixpanel / Amplitude** | 追蹤專注時長、中斷頻率、功能使用率等，用於產品優化與留存分析。 |

### 6.3 Cursor 與 n8n 職責分工 (Division of Labor)

| 職責領域 | 任務說明 | 由 Cursor 實作 (Dev) | 由 n8n 實作 (Ops) |
| :--- | :--- | :--- | :--- |
| 核心業務邏輯 | 將哲學轉成可維護的程式 | 實作 5/25 邏輯、時間複利公式、程式化建議 IF/THEN | 無（只接收結果） |
| 高誠實度數據 | 處理專注紀錄寫入與標記 | 建立 Supabase 實體與 API，確保 `honesty_mode` 正確寫入 | 無 |
| 問責與報告 | 產出與寄送週報 | 計算週報所需「原始指標」 | n8n 排程觸發，每週日拉取數據並寄出報告與夥伴摘要 |
| 產品穩定與增長 | 監控錯誤與留存 | 前端埋點、初始化 Sentry | 集成 Sentry 告警、設定留存提醒流程（例如 streak 提醒） |

---

（完）

