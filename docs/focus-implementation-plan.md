# 實作計畫表（Focus 畫面接上真實功能 — 以現有 UI 為主）

> 目標：**完全以現在的 `FocusScreen` UI 與互動為基準**，讓畫面真的寫入/讀取資料，而不是照搬 Web。以下每一節都直接對應到你現在看到的 UI 區塊與互動流程。

## 一、目前 Focus 畫面 UI 行為盤點

### [A1] 畫面結構對應

- **Header 區**（檔案：`app/(tabs)/focus.tsx`）
  - 顯示標題 `Focus` 和「今天日期」。
  - 右側為 `ViewSwitcher`，可在 `day / week / month` 三種視圖切換。

- **主視圖區**
  - `currentView === 'day'` → 顯示 `TimeAxisCalendar`：
    - Props：`tasks`, `onTaskPress`, `onTimeSlotPress`.
  - `currentView === 'week'` → 顯示 `WeekCalendar`：
    - Props：`tasks`, `onTaskPress`, `onDatePress`.
  - `currentView === 'month'` → 顯示 `MonthCalendar`：
    - Props：`tasks`, `onTaskPress`, `onDatePress`.

- **互動元件**
  - `TimerModeModal`：
    - 由 `timerModalVisible` 控制顯示。
    - 顯示被點擊的 `selectedTask`.
    - 使用者選擇 `stopwatch / pomodoro / timelapse` 後 → 呼叫 `onSelectMode`.
  - `AddTaskSheet`：
    - 由 `addTaskSheetVisible` 控制顯示。
    - 接收 `goals={coreGoals}` 與 `selectedTime`, 幫使用者建立某一時間格的任務.
  - `TimerView`：
    - 由 `activeSession` 是否為 `null` 控制顯示.
    - 收到 `onComplete(duration)` 後 → 呼叫 `handleTimerComplete` 寫入專注紀錄.

### [A2] 目前邏輯與資料來源

- `useAuth()` 取得 `user` → 對應目前登入使用者.
- `goalsApi.getCoreGoals(user.id)` → 用來載入 Core Goals, 供 `AddTaskSheet` 綁定.
- `focusApi.createSession(...)` → 在 `handleTimerComplete` 時, 將一段專注 Session 寫入 Supabase.
- 任務 `tasks`：
  - 目前為寫死的 mock 陣列（單筆「補習」）.
  - 主要用途：
    - 提供 TimeAxis / Week / Month 三個 Calendar 顯示.
    - 提供可以被點擊, 進入 Timer 流程.

> 結論：FocusScreen 已經是「UI + 部分真實 API（goals / focus session）+ 本地任務 mock」的混合體, 我們的計畫要在**尊重這個流程**的前提下, 逐步補齊資料來源與狀態管理.

---

## 二、資料模型與狀態（以現有程式為主）

### [B1] 保留的 state 設計

- 視圖切換相關：
  - `currentView: 'day' | 'week' | 'month'`

- 任務與互動相關：
  - `tasks: Task[]`（來自 `TimeAxisCalendar` 定義）
  - `selectedTask: Task | null`
  - `timerModalVisible: boolean`
  - `addTaskSheetVisible: boolean`
  - `selectedTime: string`
  - `activeSession: { task: Task; mode: 'stopwatch' | 'pomodoro' | 'timelapse' } | null`

- 目標選單用資料：
  - `coreGoals: { id: string; name: string; color: string }[]`

### [B2] 短期與長期目標

- **Phase I（現在要做的）**
  - 保留 `tasks` 在前端 state, 不接任務後端表.
  - 確保：
    - Core Goals 真的從 Supabase 載入.
    - 專注 Session 真的寫進 Supabase.
    - 所有現有 UI 流程（點任務 → 選模式 → 計時 → 完成）都能完整走完.

- **之後的 Phase（另外寫計畫）**
  - 設計 Tasks 資料表與 `tasksApi`.
  - 任務的 CRUD, 完成狀態, 重複規則等.

---

## 三、以 UI 流程拆解要做的事

### [C1] Flow 1：新增任務 → 顯示在行事曆

1. 使用者在 Day 視圖上點某個時間格：
   - 觸發 `handleTimeSlotPress(time)`：
     - `setSelectedTime(time)`
     - `setAddTaskSheetVisible(true)`
2. `AddTaskSheet` 彈出：
   - 需要 `goals={coreGoals}` 有實際 Core Goals, 讓使用者可以綁定任務對應的目標.
3. 使用者在 `AddTaskSheet` 填完並按儲存：
   - 觸發 `handleSaveTask({ name, goalId, isMIT, time })`：
     - 從 `coreGoals` 找 `selectedGoal`.
     - 建立 `newTask: Task`：
       - `id = Date.now().toString()`（暫時即可）.
       - `goalId`, `goalName`, `goalColor` 來自 `selectedGoal`.
       - `startTime = time`.
       - `duration = 60`（暫定一小時）.
       - `isMIT = isMIT`.
     - `setTasks([...tasks, newTask])`.
     - 關閉 AddTaskSheet.
4. Calendar 元件（Day/Week/Month）收到新的 `tasks` props, 自動重繪 UI.

> **Phase I 決策：** 保持 `handleSaveTask` 僅更新前端 `tasks`, 不做任務持久化.

### [C2] Flow 2：點任務 → 選計時模式 → 開始專注

1. 使用者在任何一個 Calendar 上點一個任務區塊：
   - 觸發 `handleTaskPress(task)`：
     - `setSelectedTask(task)`
     - `setTimerModalVisible(true)`
2. `TimerModeModal` 顯示：
   - 展示當前 `selectedTask` 的資訊.
   - 使用者選擇模式（`stopwatch` / `pomodoro` / `timelapse`）.
3. 觸發 `handleSelectTimerMode(mode)`：
   - 關閉 `TimerModeModal`.
   - 若 `selectedTask` 存在：
     - `setActiveSession({ task: selectedTask, mode })`.
4. 因為 `activeSession` 不為 `null`, 畫面底部顯示 `TimerView`, 開始計時.

### [C3] Flow 3：完成一段專注 → 寫入 Supabase

1. 計時完成時, `TimerView` 透過 `onComplete(duration)` 回報專注秒數.
2. `handleTimerComplete(duration)` 被呼叫：
   - 若 `!user` 或 `!activeSession` → return.
   - 呼叫 `focusApi.createSession({
       user_id: user.id,
       goal_id: activeSession.task.goalId,
       duration_minutes: Math.ceil(duration / 60),
       mode: activeSession.mode === 'stopwatch' ? 'Stopwatch'
         : activeSession.mode === 'timelapse' ? 'Timelapse' : 'Pomodoro',
       honesty_mode: true,
       interruption_count: 0,
     })`.
   - 若失敗：`console.error('Failed to save session:', error)`.
   - （可選）未來可加入 Alert 提示使用者.

3. `TimerView` 的 `onClose` 將 `activeSession` 設為 `null`, 關閉計時 UI.

---

## 四、Core Goals 載入（支撐 AddTaskSheet 下拉選單）

### [D1] 現有 `loadGoals` 邏輯

- 掛在 `useEffect(() => { if (user) loadGoals(); }, [user])`.
- 內容：
  - 若 `!user` → return.
  - 呼叫 `goalsApi.getCoreGoals(user.id)`.
  - 將結果映射為：
    - `id: g.goal_id`
    - `name: g.goal_name`
    - `color: '#3B82F6'`（暫定）.
  - 設定 `setCoreGoals(mappedGoals)`.
  - 錯誤時：`console.error('Failed to load goals:', error);`.

### [D2] 要補強與測試的地方

  - 有 Core Goals 時：AddTaskSheet 的目標選單顯示正確列表.
  - 沒有 Core Goals 時：
    - 最少要防呆（`selectedGoal` 找不到就 return, 不崩潰）.
    - 之後可在 UI 裡引導使用者先去 Vision 新增目標（此為未來優化）.

---

## 五、實作與測試順序（完全依照現有 UI）

### [E1] Step 1：確認並微調 Core Goals 載入

- 檢查 `loadGoals` 是否已正確映射 `goal_id / goal_name`.
- 手動測試：
  - DB 有 Core Goals → Focus 畫面打開後, 新增任務時看得到正確目標清單.

### [E2] Step 2：確認任務新增 Flow（AddTaskSheet → tasks）

- 以現有 `handleTimeSlotPress` + `handleSaveTask` 為核心：
  - 驗證：
    - 點 Day 視圖中的時間格 → AddTaskSheet 正確開啟, 時間帶入.
    - 在 AddTaskSheet 選擇某個 Core Goal, 輸入任務名稱 → 儲存後任務出現在 Day 視圖.
  - 暫不連接後端, 只確保 UI 互動完整.

### [E3] Step 3：確認 Timer Flow（任務 → 模式 → TimerView）

- 測試：
  - 點任務 → TimerModeModal 出現.
  - 選擇模式 → TimerView 正常出現, 顯示對應任務名稱與模式.
  - 關閉 TimerView → `activeSession` 歸 `null`, 畫面回到行事曆.

### [E4] Step 4：確認 Session 寫入 Supabase

- 模擬一段專注（可以縮短時間測試）：
  - 完成後 `handleTimerComplete` 被呼叫.
  - 驗證：
    - Supabase 對應表（例如 `FocusSessionLog`）有新的紀錄.
    - `user_id / goal_id / duration_minutes / mode / honesty_mode` 等欄位正確.

### [E5] Step 5：邊界與錯誤情境

- **未登入 user**：
  - 確保 `loadGoals` 與 `handleTimerComplete` 在 `!user` 時安全 return, 不崩潰.
- **無 Core Goals**：
  - AddTaskSheet 雖然打開, 但選目標時可能是空列表 → 之後再補 UX, 引導去 Vision 新增目標.
- **API 失敗 / 斷網**：
  - `loadGoals` 失敗時 console 有 log;
  - `focusApi.createSession` 失敗時 console 有 log, 未來可再加 Alert.
