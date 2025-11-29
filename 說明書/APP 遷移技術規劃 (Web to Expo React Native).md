# Focus Compass：Web → App（Expo / React Native）遷移技術規劃

> 狀態：已確認方向，尚未開始實作程式碼
> 前提：未來只做手機 App，不再維護 Web 前端，現有 Next.js 專案僅作為「邏輯與規格參考」。

---

## 一、總體策略

1. **保持同一個 Git Repo**：
   - 現有專案 `c:\focus-compass` 保留：
     - `src/`：Next.js Web 前端（僅作為參考，不再投資新功能）
     - `supabase/`：Edge Functions / SQL（正式服使用中）
   - 在同一層新增一個 Expo / React Native App 專案目錄：

   ```text
   c:\focus-compass
     ├─ src/                ← 既有 Next.js Web 前端（暫時保留）
     ├─ supabase/           ← 既有 Supabase functions / SQL
     ├─ 說明書/              ← 產品與技術說明文件
     └─ focus-compass-app/  ← 新增：Expo / React Native App 專案
   ```

2. **Web 不再是產品，變成「活的規格文件」**：
   - 不再重寫 Web UI，只在必要時用來：
     - 對照畫面行為
     - 驗證 Supabase schema / RPC / Edge Functions
   - 產品的唯一正式前端 = Expo / React Native App。

3. **抓住真正需要保留的東西**：
   - **保留：**
     - Supabase 資料模型與 SQL / Edge Functions
     - 業務邏輯 Hooks：
       - `useGoals`
       - `useSubgoals`
       - `useHabitStreak`
       - `useWeeklyStreak`
       - `useFocusAnalytics`
       - `useFocusDiagnostics`
       - `GoalsContext`
       - `leagueApi`
     - 型別定義：`src/types/database.ts`
   - **捨棄 / 重做：**
     - 所有 Next.js `app/` 頁面與 `components/` UI（未來用 React Native 完全重寫）

---

## 二、分階段路線圖（對應原本五大階段）

### Phase I. 核心邏輯遷移（Web → App Core）

**目標：**
- 建立新的 Expo 專案，並把現有 Next.js 專案中的「資料模型 + Supabase 邏輯」搬到 App 專案中重用。

**實作步驟：**

1. **建立新的 Expo 專案目錄**（之後執行，尚未實作）
   - 在 `c:\focus-compass` 下新增資料夾：`focus-compass-app/`
   - 在該資料夾內執行：
     - `npx create-expo-app@latest .`（或等同指令）
   - 讓此目錄成為未來唯一的 App 專案。

2. **複製資料模型（Type 定義）到 App 專案**
   - 來源：`src/types/database.ts`
   - 目標範例（在 App 專案中）：`src/core/types/database.ts`
   - 內容：`Goal / Subgoal / FocusSessionLog / User / WeeklyCommitment / HabitTracking / AccountabilityPartner / CalendarStore` 等型別。

3. **在 Expo 端重建 Supabase Client**
   - 參考來源：`src/lib/supabaseClient.ts`
   - 在 App 專案新增：`src/core/lib/supabaseClient.ts`
   - 差異：
     - 不再用 `process.env.NEXT_PUBLIC_*`，改由 Expo Config (`app.config.ts` / `app.json` 的 `extra`) 或 `.env` 讀取。
     - 在 React Native 使用 `AsyncStorage` 作為 auth 儲存，確保 `supabase.auth` 在 App 中可以記住登入狀態。

4. **把業務邏輯 Hooks / Services 搬到 App 專案**

   在 App 專案建立 `src/core/hooks/` 與 `src/core/services/`，將下列邏輯搬運並調整 import 路徑：

   - Hooks：
     - `useGoals`（從 `src/hooks/useGoals.ts` 搬移）
     - `useSubgoals`（從 `src/hooks/useSubgoals.ts` 搬移）
     - `useHabitStreak`（從 `src/hooks/useHabitStreak.ts` 搬移）
     - `useWeeklyStreak`（從 `src/hooks/useWeeklyStreak.ts` 搬移）
     - `useFocusAnalytics`（從 `src/hooks/useFocusAnalytics.ts` 搬移）
     - `useFocusDiagnostics`（從 `src/hooks/useFocusDiagnostics.ts` 搬移）
   - Services：
     - `leagueApi`（從 `src/lib/leagueApi.ts` 搬移至 `src/core/services/leagueApi.ts`）

   **原則：**
   - 保留 Supabase 查詢與 RPC 邏輯。
   - 只修改：import 路徑、環境變數來源、瀏覽器專屬 API（如 localStorage）。

5. **GoalsContext 遷移與 Storage 抽象化**

   - 來源：`src/components/GoalsContext.tsx`
   - 在 App 專案建立：`src/core/context/GoalsContext.tsx`
   - 需要遷移的核心職責：
     - 維護 `allGoals`, `coreTop5`, `goalPlans`, `calendarTasks` 狀態
     - 提供 `addFocusSession`（寫入 `FocusSessionLog`）
     - 提供 `addGoal / updateGoalName / updateGoalCategory / deleteGoal / reorderGoals` 等方法
   - 針對 localStorage：
     - 現有常數：
       - `GOAL_PLANS_STORAGE_KEY = 'commitment_goal_plans_v3';`
       - `CALENDAR_STORAGE_KEY = 'commitment_calendar_tasks_v3';`
     - 改為定義一個 Storage 介面，例如：
       - `StorageDriver`：`getItem(key) / setItem(key, value) / removeItem(key)`
     - 在 Web 環境實作：透過 `localStorage`（現在專案已存在）
     - 在 App 環境實作：使用 `AsyncStorage`
   - 這樣 GoalsContext 就能同時服務 Web（暫存）與 App（正式）。

---

### Phase II. 設計與規劃（Figma / App 專用藍圖）

**目標：**
- 把目前 Web 的各個功能頁面，轉成適合手機的 Navigation 結構與畫面設計。

**主要功能模組（來自現有產品）**：

- **Vision / Goals**：
  - 管理目標 (`Goal`)、Core 5 選擇 (`goal_category = 'Core'`)、小目標 (`Subgoal`)
- **Weekly Commitment / Calendar**：
  - 每週承諾、行事曆任務 (`WeeklyCommitment`, `CalendarStore`)
- **Focus Session**：
  - 專注計時、誠實模式(`honesty_mode`)、中斷次數與原因(`interruption_*`)
- **Analytics**：
  - 淨投入時間、自我欺騙時間、誠實度比例（`useFocusAnalytics`）
  - 中斷診斷（`useFocusDiagnostics`）
  - streak（`useHabitStreak`, `useWeeklyStreak`）
- **League**：
  - 排行榜、段位歷史、徽章（`leagueApi`, 相關 RPC）
- **Accountability**：
  - 問責夥伴與可見權限 (`AccountabilityPartner`)

**Figma 設計輸出（未來要做）**：

- 決定 App 的主導航結構，例如：
  - 底部 Tab：`Home / Focus / League / Analytics / Me`
- 每個畫面標註：
  - 對應的 core hooks / services（例如：`VisionScreen` 使用 `useGoals`, `useSubgoals`）
  - 需要顯示的指標與狀態（loading / error / empty state）

---

### Phase III. 前端 UI 徹底重寫（React Native）

**目標：**
- 使用 React Native 元件與 React Navigation，重寫所有畫面；
- Data Layer 直接使用 Phase I 搬過來的 hooks / services。

**App 架構建議（在 `focus-compass-app/` 中）：**

- 主要目錄（示意）：

  ```text
  focus-compass-app/
    ├─ app/                 ← Expo Router 或 React Navigation 入口（screens）
    ├─ src/
    │   ├─ core/            ← 從 Web 搬來的型別 + Supabase client + hooks + services + context
    │   └─ components/      ← 手機 App 專用 UI 元件
    └─ ...
  ```

- 導航：
  - 使用 `@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/native-stack`
  - 建立 Screens：
    - `VisionScreen`：目標與 Core 5（用 `useGoals`, `useSubgoals`）
    - `FocusTimerScreen`：專注計時，呼叫 `GoalsContext.addFocusSession`
    - `AnalyticsScreen`：呼叫 `useFocusAnalytics`, `useFocusDiagnostics`
    - `LeagueScreen`：呼叫 `leagueApi` 相關函式，以及即時訂閱邏輯（從 `FocusLeagueLeaderboard.tsx` 拆出 hook）
    - `ProfileScreen` / `SettingsScreen`：帳號、問責夥伴入口

- UI 實作原則：
  - 僅使用 React Native 原生元件（`View`, `Text`, `Pressable`, `FlatList` 等）與樣式（`StyleSheet` 或其他 RN 樣式方案）。
  - 不直接複製 Tailwind className，而是根據 Figma 重新設計樣式。

---

### Phase IV. 雲端與自動化準備

**目標：**
- 讓 Expo App 能穩定打包，並連到既有的 Supabase 專案。

**步驟概要：**

1. 在 App 專案設定 Supabase 環境變數
   - 在 `app.config.ts` 或 `app.json`：
     - `extra.SUPABASE_URL`
     - `extra.SUPABASE_ANON_KEY`
   - Supabase client 從這裡讀取設定。

2. 建立 EAS 設定
   - 在 App 專案加入 `eas.json`：
     - 定義 `preview` / `production` profiles
   - 確保可以使用：
     - `eas build --platform ios`
     - `eas build --platform android`

3. 確認 Supabase 端穩定
   - 資料表：`Goal`, `Subgoal`, `FocusSessionLog`, `UserStats`, `league_*`, `AccountabilityPartner`, ...
   - RPC：`get_interruption_reason_counts`, `get_my_group_anonymous_board`, `get_my_masked_id`, ...
   - Edge Functions：`focus-league`, `league-daily`, `weekly-report` 等

---

### Phase V. 發佈與維護

**目標：**
- 讓 App 成功上架到 App Store / Google Play，並建立後續更新流程。

**重點事項：**

1. App 基本識別設定
   - iOS：`bundleIdentifier`（例如：`com.focuscompass.app`）
   - Android：`applicationId`（例如：`com.focuscompass.app`）

2. EAS Cloud Build 與上架流程
   - 使用 `eas build` 產生 iOS / Android 安裝包（ipa / aab）。
   - 將 build 結果提交到：
     - iOS：App Store Connect / TestFlight
     - Android：Google Play Console（internal / closed / production track）

3. EAS Updates（熱更新）
   - 對於純 JS / UI 更新，使用 `eas update` 進行交付。
   - 對於需要更改原生權限或新增原生模組的變更，仍需重新 build + 上架。

---

## 三、實作優先順序（未來開始寫程式時用）

> 以下是「開始動手」之後建議的優先順序，目前僅作為規劃備忘，不在此時實作。

1. **建立 `focus-compass-app/` Expo 專案**
2. **搬移 `types/database.ts` → App 專案 `src/core/types/database.ts`**
3. **建立 Supabase client（搭配 Expo Config / AsyncStorage）**
4. **選一個 domain 先搬（建議：Goal + Subgoal）**
   - 搬 `useGoals`, `useSubgoals` 到 `src/core/hooks/`
   - 在 App 裡做一個簡單的目標清單畫面，確認：
     - Supabase 連線成功
     - 讀寫 `Goal` / `Subgoal` 正常
5. **搬移並調整 GoalsContext**
6. **再逐步搬移 Analytics / Streak / League 等其他 hooks 與服務**
7. **最後才專心做完整的 Figma + RN UI 重寫與導航結構**

---

## 四、目前狀態總結

- 決策：
  - 未來只維護手機 App，不再維護 Web 版產品。
  - 保留現有 Next.js 專案當作「邏輯與資料結構參考」。
  - 在同一個 repo 下新增 `focus-compass-app/` 作為 Expo / React Native App 專案。

- 本文件用途：
  - 作為未來開始動手改造時的「技術藍圖」。
  - 目前階段只寫說明，不對任何程式碼與專案結構做實際修改。
