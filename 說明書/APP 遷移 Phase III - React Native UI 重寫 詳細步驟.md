# APP 遷移 Phase III：前端 UI 徹底重寫（React Native）詳細步驟

> 對應：《APP 遷移技術規劃 (Web to Expo React Native).md》中的 Phase III
> 目的：在 Phase I core 完成、Phase II 設計定稿後，依 Figma 將 Web UI 全面重寫為 React Native UI。

---

## 0. 前提與完成定義

- **前提條件**
  - Phase I：core 層（型別 + Supabase + hooks + GoalsContext + leagueApi）已在 App 專案可用。
  - Phase II：Figma 視覺與互動規格已穩定（至少 v1 凍結）。
- **本 Phase 完成判準**
  - App 端已具備：
    - 完整的 React Navigation 結構（Tab + Stack）。
    - 各主要頁面（Home / Focus / Vision / League / Partner / Settings）的 RN UI。
    - 所有主要功能皆可透過 App UI 正常操作（與 Web 行為一致或更佳）。

---

## 1. 規劃 React Navigation 結構

### 1.1 選擇導航方式

- 建議使用：
  - `@react-navigation/native`
  - `@react-navigation/bottom-tabs`
  - `@react-navigation/native-stack`
- 導航結構：
  - Root：Bottom Tab Navigator（Home / Focus / Vision / League / Partner / Settings）
  - 每個 Tab 內部再視需求使用 Stack Navigator。

### 1.2 建立基本 Screen 架構

- 在 `focus-compass-app` 中：
  - `app/`（若用 Expo Router）或 `src/screens/`（若手動配置）：
    - `HomeScreen.tsx`
    - `FocusScreen.tsx`
    - `VisionScreen.tsx`
    - `LeagueScreen.tsx`
    - `PartnerScreen.tsx`
    - `SettingsScreen.tsx`
- 每個 Screen 先實作：
  - 基本 Layout（Header + 主要內容區塊 Placeholder）
  - 使用 `GoalsProvider` 包裹整個 App，使 hooks 可用。

---

## 2. 建立共用 UI 元件（Components）

### 2.1 Components 目錄

- 在 App 專案建立：`src/components/`
  - `layout/`：AppBar, ScreenContainer, Card, SectionHeader
  - `inputs/`：Button, TextInput, NumberInput, Toggle, SegmentedControl
  - `feedback/`：Toast, Modal, BottomSheet, Skeleton
  - `data/`：KpiCard, ListItem, Tag / Chip

### 2.2 依照 Figma 實作元件

- 按 Figma 的設計 token（顏色 / 字級 / 間距）實作：
  - Primary / Secondary Buttons
  - 卡片樣式與陰影
  - Tab Bar Icon + Label
- 為常用元件（例如 Button、Card）加入 props：
  - `variant`（primary / secondary / ghost）
  - `size`（sm / md / lg）
  - `loading` / `disabled`

---

## 3. 各畫面 UI 實作與 core 接線

### 3.1 HomeScreen（Dashboard）

- **UI 實作**
  - 依 Figma：Header + MIT 卡 + KPI 卡 + 圖表 Carousel + 診斷卡。
- **Data 接線**
  - MIT 卡：
    - 讀取 Vision 月曆與本地 MIT 選擇（之後可改為 AsyncStorage）。
  - KPI：
    - 使用 `useWeeklyStreak`, `useFocusAnalytics`。
  - 診斷卡：
    - 使用 `useFocusDiagnostics`。
- **互動**
  - 點擊「選擇 MIT」→ 導向 Vision / 顯示任務選擇 BottomSheet。
  - 點擊「開始專注」→ 導向 FocusScreen 並帶入 `goalId`。

### 3.2 FocusScreen（Execute）

- **UI 實作**
  - 目標 / 小目標選擇器（使用 `useGoals`, `useSubgoals`）。
  - Honesty Mode Toggle。
  - 計時器 Tab（Stopwatch / Pomodoro / Timelapse）：
    - 可先實作 Stopwatch，其他兩種後續補上。
- **Data 接線**
  - 計時結束時，開啟中斷紀錄 Modal。
  - Modal 送出後呼叫 `GoalsContext.addFocusSession` 寫入 `FocusSessionLog`。
- **狀態管理**
  - 使用 React state 或適當的 context 管理計時器狀態（避免重整後狀態消失）——可列為後續技術債。

### 3.3 VisionScreen

- **UI 實作**
  - 標記 3 個區塊：
    - 以終為始問卷區（可折疊）
    - 5/25 Core vs Avoid
    - Core 詳細拆解 + 承諾月曆
- **Data 接線**
  - 以終為始：先以本地 state / AsyncStorage 為主。
  - 5/25：
    - 讀取 `useGoals` 回傳的 `goals`。
    - 切換 Core / Avoid 時呼叫 `updateGoalCategory`。
  - Subgoals：
    - 使用 `useSubgoals` 管理新增 / 排序 / 刪除。
  - 週承諾 & 月曆：
    - 使用 `GoalsContext` 的 `goalPlans` / `calendarTasks`。

### 3.4 LeagueScreen

- **UI 實作**
  - 段位卡、排行榜列表、徽章牆、歷史紀錄列表。
- **Data 接線**
  - 使用 `leagueApi` 中的相關函式取得資料。
  - 若有即時更新需求，可在 RN 端使用 Supabase Realtime 訂閱。

### 3.5 PartnerScreen

- **UI 實作**
  - 上方：範圍 Segmented control（Day / Week / Month）。
  - 中間：夥伴比較列表。
  - 下方：邀請 / 審核與可視指標設定區。
- **Data 接線**
  - 先實作靜態 UI，可延後真正 RPC / 視圖接線到後續迭代。

### 3.6 SettingsScreen

- **UI 實作**
  - 列表式項目：帳號、語系、通知、付費方案（占位）。
- **Data 接線**
  - 現階段可先保留為空或簡易假資料，待未來帳號 / 訂閱方案規格確認後再實作。

---

## 4. 狀態管理與錯誤處理

### 4.1 Loading / Error UI

- 根據 Figma 中對每頁的狀態設計：
  - 在每個 Screen 中，為主要資料加入：
    - `isLoading`
    - `error`
  - 對應：Skeleton / 空狀態 / 錯誤提示。

### 4.2 Toast / Modal 統一處理

- 建議建立全域的 Toast context 或使用第三方庫：
  - 寫入成功 / 失敗時統一使用同樣樣式。
- Modal：
  - 中斷紀錄 / 設定 / 警告對話框的 UI 風格一致。

---

## 5. Phase III 收尾與檢查

- **自我驗證清單**
  - 是否可以「不用看 Web 版」，僅靠 App 就完成一次完整的：
    - 設定目標 → 排程承諾 → 啟動專注 → 查看 Dashboard 回饋。
  - 是否所有 Figma 上設計的主要頁面都有對應的 RN 實作？
  - 是否主要互動流程都已串接 Navigation？
- **技術債記錄**
  - 哪些 UI 僅為 MVP，可在之後視覺優化。
  - 哪些資料目前用 mock，尚未串 Supabase / RPC。

> 本文件為 Phase III 的 UI 重寫實作清單，實作順序可依開發資源與風險調整。
