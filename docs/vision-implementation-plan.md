# 實作計畫表（Vision 畫面接上真實功能 — 以現有 UI 為主）

> 目標：**以現在的 `VisionScreen` UI 和互動為核心**，讓「目標清單 + 目標拆解」都接上 Supabase 真實資料，同時維持既有 Loading / Error / Empty / 未登入狀態的行為。

## 一、目前 Vision 畫面 UI 行為盤點

### [A1] 畫面結構對應（`app/(tabs)/index.tsx`）

- **Header 區**
  - 顯示標題 `Vision`。
  - 右上角 `+` 按鈕：點擊後打開 `AddGoalModal`。

- **目標清單區**
  - `CoreGoalsList`：
    - Props：`coreGoals`, `avoidGoals`, `onGoalPress`。
    - UI：顯示 Core 目標與 Avoidance 目標，來源為 `UIGoal[]`。

- **目標拆解區（Goal Breakdown）**
  - 僅在 `coreGoals.length > 0` 時顯示。
  - 元件組成：
    - 標題、說明文字。
    - `GoalSelector`：
      - Props：`coreGoals`, `selectedGoalId`, `onSelect`。
      - 讓使用者在 Core 目標中切換目前要拆解的目標。
    - `GoalBreakdown`：
      - 在 `selectedGoalId` 有值時顯示。
      - Props：
        - `goal`：目前被選取的 `UIGoal`。
        - `breakdown`：從 `goalBreakdowns.get(selectedGoalId)` 取得的計畫。
        - `onUpdate`：呼叫 `handleBreakdownUpdate(goalId, breakdown)`。

- **Empty State 區**
  - 當 `coreGoals.length === 0 && avoidGoals.length === 0` 時顯示：
    - 文案：「還沒有任何目標 / 點擊右上角 + 新增第一個目標」。

- **Overlay：AddGoalModal**
  - 由 `addModalVisible` 控制顯示。
  - Props：`visible`, `onClose`, `onAdd`。
  - `onAdd(name, category)` → 呼叫 `handleAddGoal`。

### [A2] 頂層狀態與分支 UI

- `loading`：
  - `true` 時直接回傳 Loading 畫面（SafeAreaView + Spinner）。
- `error`：
  - 有值時顯示 Error 畫面，並提供「重試」按鈕 → 呼叫 `loadData()`。
- `user`：
  - 若 `!user` 則直接顯示「請先登入」畫面。
- 其他與資料相關的狀態：
  - `coreGoals: UIGoal[]`
  - `avoidGoals: UIGoal[]`
  - `goalBreakdowns: Map<string, GoalPlan>`
  - `selectedGoalId: string | null`
  - `addModalVisible: boolean`

> 結論：VisionScreen 已經把「不同狀態的畫面分支」寫好，也有 `goalsApi` 和 `goalPlansApi` 的 import，目前只缺 `loadData` 的實作，以及 `goalBreakdowns` 的初始化邏輯。

---

## 二、資料模型與狀態（以現有程式為主）

### [B1] 目標清單的 UI 型別（`UIGoal`）

- 結構：
  - `id: string`
  - `name: string`
  - `description?: string`
  - `status: 'core' | 'avoid'`

- 對應 DB `Goal`：
  - `id` ← `goal.goal_id`
  - `name` ← `goal.goal_name`
  - `description` ← `goal.goal_description`
  - `status` ← 由 `goal.goal_category` 轉成 `'core' | 'avoid'`。

### [B2] 目標拆解的 UI 型別（`GoalPlan`）

- 來源：`GoalBreakdown` 元件的 `GoalPlan` 型別。
- 對應 DB `GoalPlanDB`：
  - `annualGoal` ← `annual_goal ?? ''`
  - `quarterlyGoal` ← `quarterly_goal ?? ''`
  - `monthlyGoal` ← `monthly_goal ?? ''`
  - `weeklyGoal` ← `weekly_goal ?? ''`
  - `weeklyCommitmentHours` ← `weekly_commitment_hours`。
- 存放方式：
  - `goalBreakdowns: Map<string, GoalPlan>`，key = `goal_id`。

### [B3] Loading / Error / 未登入 狀態

- `loading: boolean`：控制是否顯示 Loading 畫面。
- `error: string | null`：控制是否顯示 Error 畫面與重試按鈕。
- `user` 來自 `useAuth()`：
  - `!user` 時直接顯示未登入狀態，不再嘗試載入目標資料。

---

## 三、以 UI Flow 拆解要做的事

### [C1] Flow 1：進入 Vision → 載入目標與拆解 → 顯示對應區塊

1. 畫面掛載且 `user` 存在：
   - 由 `useEffect(() => { if (user) loadData(); }, [user])` 觸發。
2. `loadData` 目標：
   - 一次抓到：
     - Core 目標清單。
     - Avoidance 目標清單。
     - 該使用者所有目標的拆解計畫。
   - 並轉成對應的 `UIGoal[]` 與 `Map<string, GoalPlan>`。
3. 載入成功後：
   - 更新：`coreGoals`, `avoidGoals`, `goalBreakdowns`。
   - 讓下方的 `CoreGoalsList` / `GoalSelector` / `GoalBreakdown` 自動根據這些 state 更新 UI。
4. `useEffect` 幫忙自動選擇第一個 Core 目標：
   - 當 `coreGoals` 有資料且 `selectedGoalId` 仍為空時 → 設為第一個 Core 目標的 `id`。

### [C2] Flow 2：點右上角 `+` 新增目標

1. 使用者點 Header 右上 `+`：
   - `onPress={() => setAddModalVisible(true)}` → 打開 `AddGoalModal`。
2. 在 `AddGoalModal` 中輸入目標名稱與分類（Core / Avoidance）：
   - 呼叫 `onAdd(name, category)` → 導到 `handleAddGoal`。
3. `handleAddGoal`：
   - 若 `!user` → return。
   - 呼叫 `goalsApi.create(user.id, { goal_name: name, goal_category: category })`。
   - 成功後呼叫 `loadData()` 重新載入列表與拆解。
   - 失敗時：
     - `console.error('Failed to create goal:', err);`
     - `Alert.alert('新增失敗', err.message || '請稍後再試');`。

### [C3] Flow 3：編輯目標拆解（GoalBreakdown → handleBreakdownUpdate）

1. 使用者在 `GoalSelector` 中選擇某個 Core 目標。
2. `selectedGoalId` 改變 → UI 顯示該目標對應的 `GoalBreakdown`：
   - 透過 `goalBreakdowns.get(selectedGoalId)` 取得現有拆解計畫（若有）。
3. 使用者在 `GoalBreakdown` 中修改年/季/月/週目標與每週投入時數，按下儲存：
   - 呼叫 `onUpdate(goalId, breakdown)` → `handleBreakdownUpdate(goalId, breakdown)`。
4. `handleBreakdownUpdate`：
   - 若 `!user` → return。
   - 先樂觀更新前端 `goalBreakdowns` Map。
   - 再呼叫 `goalPlansApi.upsert(goalId, user.id, { ...breakdown })` 把資料寫入 Supabase。
   - 失敗時：
     - `console.error('Failed to save goal plan:', err);`
     - `Alert.alert('儲存失敗', err.message || '請稍後再試');`。

---

## 四、`loadData` 的具體行為

### [D1] 前置檢查與狀態

- 若 `!user` → 直接 return。
- 進入載入狀態：
  - `setLoading(true)`
  - `setError(null)`

### [D2] 並行取得目標與拆解資料

- 使用 `Promise.all` 呼叫：
  - `goalsApi.getCoreGoals(user.id)`
  - `goalsApi.getAvoidanceGoals(user.id)`
  - `goalPlansApi.getAll(user.id)`

### [D3] 轉換與寫入 state

- 將 Core / Avoidance 目標轉成 `UIGoal[]`：
  - `status` 分別為 `'core'` / `'avoid'`。
- 將 `GoalPlanDB[]` 轉成 `Map<string, GoalPlan>`：
  - 以 `goal_id` 為 key，對應一筆 `GoalPlan`。
- 更新：
  - `setCoreGoals(coreUiGoals)`
  - `setAvoidGoals(avoidUiGoals)`
  - `setGoalBreakdowns(breakdownMap)`

### [D4] 錯誤處理與完成

- 用 `try/catch/finally` 包起來：
  - `catch`：
    - `console.error('Failed to load data:', err);`
    - `setError(err.message || '載入失敗，請稍後再試');`
  - `finally`：
    - `setLoading(false);`

---

## 五、狀態分支（Loading / Error / 未登入 / Empty）檢查

### [E1] Loading 狀態

- 當 `loading === true` 時：
  - 顯示 Loading 畫面（Spinner + 「載入中…」）。
  - 不渲染下方 Vision 內容。

### [E2] Error 狀態

- 當 `error` 有值時：
  - 顯示錯誤訊息與「重試」按鈕。
  - 點擊「重試」時呼叫 `loadData()` 重新載入。

### [E3] 未登入狀態

- 當 `!user` 時：
  - 顯示「請先登入」畫面，不再嘗試載入資料。

### [E4] Empty 狀態

- 當 `coreGoals.length === 0 && avoidGoals.length === 0`：
  - 顯示「還沒有任何目標 / 點擊右上角 + 新增第一個目標」。
  - 作為初次使用者的引導。

---

## 六、實作與測試順序（依現有 UI）

### [F1] Step 1：實作並驗證 `loadData`

- 實作 `loadData`，包含：
  - `setLoading(true/false)` 與 `setError`。
  - `Promise.all` 呼叫三個 API。
  - 正確映射成 `UIGoal[]` 與 `Map<string, GoalPlan>`。
- 手動測試：
  - 有 Core / Avoidance / GoalPlan 資料的帳號 → 打開 Vision 時列表與拆解都顯示正確。

### [F2] Step 2：測試新增目標 Flow（AddGoalModal → handleAddGoal → 重新載入）

- 測試：
  - 點右上角 `+` 開啟 AddGoalModal。
  - 新增 Core 目標 / Avoidance 目標。
  - 儲存後 `loadData()` 被呼叫，目標清單與 Empty 狀態更新正確。

### [F3] Step 3：測試拆解儲存 Flow（GoalBreakdown → handleBreakdownUpdate）

- 測試：
  - 在 `GoalSelector` 選一個 Core 目標。
  - 在 `GoalBreakdown` 編輯內容並儲存。
  - 前端立即顯示新內容，重新整理 app 後仍維持（代表 DB 寫入成功）。

### [F4] Step 4：邊界與錯誤情境

- 無目標：
  - 顯示 Empty 狀態，並可透過 `+` 新增第一個目標。
- API 失敗 / 斷網：
  - 顯示錯誤畫面與「重試」。
- 未登入：
  - 顯示「請先登入」，不呼叫 `loadData`。

