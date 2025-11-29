# APP 遷移 Phase I：核心邏輯遷移（Web → App Core）詳細步驟

> 對應：《APP 遷移技術規劃 (Web to Expo React Native).md》中的 Phase I
> 目的：把「建立 Expo 專案 + 搬移資料模型與 Supabase 業務邏輯」拆解成可逐項勾選的工程步驟。
> 狀態：僅為說明文件，尚未實作程式碼。

---

## 0. 前提與完成定義

- **前提條件**
  - 現有 Next.js 專案仍可正常跑（供對照）。
  - Supabase 專案已存在且結構穩定（`Goal / Subgoal / FocusSessionLog / ...`）。
- **本 Phase 完成判準（Definition of Done）**
  - `focus-compass-app/` 內的 Expo 專案可正常啟動在模擬器 / 實機上。
  - App 端已：
    - 擁有與 Web 相同的 Type 定義（database models）。
    - 建立好可用的 `supabaseClient`（含 Auth 儲存）。
    - 搬完：`useGoals / useSubgoals / useHabitStreak / useWeeklyStreak / useFocusAnalytics / useFocusDiagnostics / leagueApi / GoalsContext`（邏輯層級）。
  - 至少有一個簡單測試畫面可以：
    - 讀取使用者的 Goals 列表（`Goal`）
    - 新增一個 Goal 並寫入 Supabase。
- **開發備註**
  - 不要在 PowerShell 中執行 `todo_list` 這類不存在的指令；規劃下一步只需在本說明書或 issue tracker 中用條列方式記錄即可。

---

## 1. 建立新的 Expo 專案目錄（Project Skeleton）

### 1.1 建立目錄與初始化專案

- **步驟**
  - 在 `c:\focus-compass` 下建立資料夾：`focus-compass-app/`。
  - 在該資料夾內執行（未來實作時）：
    - `npx create-expo-app@latest .`（或選擇 TypeScript 模板）。
- **檢查點**
  - 目錄結構類似：
    - `focus-compass-app/app` 或 `focus-compass-app/App.tsx`
    - `package.json` 中已包含 `expo` 相關依賴。
  - 執行 `npm start` / `npx expo start` 能啟動開發伺服器。

### 1.2 初始化 TypeScript、ESLint 等基礎設定（如模板已內建可略）

- **步驟**
  - 確認專案有 `tsconfig.json`，若無則新增。
  - 加入或確認 ESLint / Prettier 設定（可複用 Web 專案部分規則）。
- **檢查點**
  - `App.tsx` 等檔案已採用 TypeScript。
  - 執行 lint / type-check 時無重大錯誤。

---

## 2. 搬移資料模型（Type 定義）

### 2.1 建立 core types 資料夾

- **步驟**
  - 在 `focus-compass-app/src/` 建立：`core/types/`。
  - 新增檔案：`src/core/types/database.ts`。

### 2.2 從 Web 專案複製型別

- **來源**
  - `c:\focus-compass\src\types\database.ts`
- **步驟**
  - 將以下型別複製到 App 專案：
    - `Goal`
    - `Subgoal`
    - `FocusSessionLog`
    - `User`
    - `WeeklyCommitment`
    - `HabitTracking`
    - `AccountabilityPartner`
    - `DayTask`, `CalendarStore`
    -（以及總集合 `Database` 型別）
  - 調整 import / export 以符合 App 專案命名空間（若有需要）。
- **檢查點**
  - App 專案中所有 core hooks / services 皆可從 `src/core/types/database.ts` import 對應型別。

### 2.3 規劃型別使用準則

- **說明**
  - 未來與 Supabase 互動的所有邏輯（含 hooks / services）都應該：
    - 優先使用這份 `database.ts` 的型別，而非 `any`。
  - 若 App 有新增前端專用型別（例如 UI 專用 DTO），應放在 `src/core/types/ui.ts` 或其他檔案，避免與 DB model 混淆。

---

## 3. 在 Expo 端重建 Supabase Client

### 3.1 決定環境變數來源

- **步驟**
  - 在 App 專案選擇一種方案：
    - `app.config.ts` / `app.json` 的 `extra` 欄位
    - 或使用 `.env` 搭配 `expo-constants` / `react-native-dotenv` 等工具
  - 定義：
    - `SUPABASE_URL`
    - `SUPABASE_ANON_KEY`
- **檢查點**
  - 任何環境變數的讀取方式，必須能在 iOS / Android / 開發模式下都正常工作。

### 3.2 建立 `supabaseClient` 檔案

- **步驟**
  - 在 App 專案建立：`src/core/lib/supabaseClient.ts`。
  - 內容概念：
    - 從 Expo Config / 環境變數讀取 `SUPABASE_URL` 與 `SUPABASE_ANON_KEY`。
    - 使用 `@supabase/supabase-js` 建立 client。
    - 在 React Native 中設定 `auth` 的 storage（多使用 `AsyncStorage`）。
- **檢查點**
  - 在一個簡單的測試 hook（例如 `usePingSupabase`）中呼叫 `supabase.from('Goal').select('*').limit(1)` 能成功取得資料或適當錯誤。

### 3.3 設定 Auth 儲存（AsyncStorage）

- **步驟**
  - 安裝 `@react-native-async-storage/async-storage`。
  - 在建立 supabase client 時，將 `auth` 設定為使用 AsyncStorage，確保登入狀態可在 App 內被記住。
- **檢查點**
  - 使用者在 App 內登入後，重新啟動 App 仍可維持登入狀態（依實作情境而定）。

---

## 4. 搬移業務邏輯 Hooks / Services

> 目標：在 App 專案中建立 `src/core/hooks/` 與 `src/core/services/`，並逐一搬移邏輯。

### 4.1 建立目錄結構

- **步驟**
  - 在 App 專案建立：
    - `src/core/hooks/`
    - `src/core/services/`

### 4.2 搬移 Goals / Subgoals 邏輯

- **來源檔案（Web 專案）**
  - `src/hooks/useGoals.ts`
  - `src/hooks/useSubgoals.ts`
- **搬移步驟**
  1. 在 App 專案建立：
     - `src/core/hooks/useGoals.ts`
     - `src/core/hooks/useSubgoals.ts`
  2. 將原檔案內容貼入並調整：
     - import `supabase` 改為從 `src/core/lib/supabaseClient` 引入。
     - 型別改為從 `src/core/types/database` 引入。
     - 移除或標記暫時不支援的瀏覽器專屬 API（例如直接觸碰 `window`）。
  3. 保持原有邏輯：
     - 讀取使用者 ID
     - CRUD `Goal`
     - CRUD `Subgoal`
- **檢查點**
  - 在 App 中建立一個臨時測試畫面（例如 `GoalsDebugScreen`），可以：
    - 呼叫 `useGoals` 讀取目前使用者目標清單。
    - 使用 `addGoal` 新增目標並看到畫面更新。

### 4.3 搬移 Streak 與 Analytics Hooks

- **來源檔案**
  - `src/hooks/useHabitStreak.ts`
  - `src/hooks/useWeeklyStreak.ts`
  - `src/hooks/useFocusAnalytics.ts`
  - `src/hooks/useFocusDiagnostics.ts`
- **搬移步驟**
  - 依序在 App專案 `src/core/hooks/` 中建立對應檔案並貼上邏輯：
    - 確認使用的型別都從 `core/types/database` 引入。
    - 所有 Supabase 呼叫改用 App 端 `supabaseClient`。
  - 若有使用 `console.log` 調試，可保留但未來考慮統一成 logger。
- **檢查點**
  - 能在測試畫面中顯示：
    - 使用者當前 habit streak / weekly streak 數值。
    - Focus analytics（淨投入、自我欺騙、誠實度比例）。
    - 中斷診斷結果（常見原因列表）。

### 4.4 搬移 League 相關 Service

- **來源檔案**
  - `src/lib/leagueApi.ts`
- **搬移步驟**
  - 在 App 專案新增 `src/core/services/leagueApi.ts`。
  - 搬移：
    - `getMyLeagueMapping`
    - `getMyAnonymousBoard`
    - `getMyLeagueHistory`
    - `getMyBadges`
    - `invokeFocusLeagueEdge`
    - `getLeagues`
    - `getLeagueName`
    - `getMyMaskedId`
  - 調整：
    - import 路徑 → 使用 App 的 `supabaseClient`。
    - 環境變數讀取（anon key）改從 Expo Config / 環境變數取得。
- **檢查點**
  - 在 App 端能透過簡單測試呼叫以上 API，不拋出錯誤（或能顯示適當的錯誤訊息）。

---

## 5. GoalsContext 遷移與 Storage 抽象化

### 5.1 規劃 Storage 介面

- **目標**
  - 將目前在 Web 使用 `localStorage` 的部分抽象成 `StorageDriver`，讓 App 可替換為 `AsyncStorage`。
- **設計草案（概念）**
  - 定義介面：
    - `getItem(key: string): Promise<string | null>`
    - `setItem(key: string, value: string): Promise<void>`
    - `removeItem(key: string): Promise<void>`
  - Web 版實作（未來需要時）：包一層 localStorage。
  - App 版實作：使用 AsyncStorage。

### 5.2 搬移 GoalsContext

- **來源檔案**
  - `src/components/GoalsContext.tsx`
- **搬移步驟**
  1. 在 App 專案新增：`src/core/context/GoalsContext.tsx`。
  2. 搬移以下內容：
     - `GoalsContext` 型別定義。
     - `GoalsProvider` 組件。
     - `coreTop5` 的計算邏輯。
     - `goalPlans` 與 `calendarTasks` 狀態與更新函式。
     - `addFocusSession` 寫入 `FocusSessionLog` 的邏輯。
     - `addGoal / updateGoalName / updateGoalCategory / deleteGoal / reorderGoals` 的封裝。
  3. 調整儲存機制：
     - 原使用 `localStorage` 的區域（例如 `GOAL_PLANS_STORAGE_KEY`, `CALENDAR_STORAGE_KEY`）改為依賴 `StorageDriver`。
     - 在 App 專案中提供一個預設的 `AsyncStorageStorageDriver` 實作。
- **檢查點**
  - App 內部可以透過 `GoalsProvider`：
    - 取得 Core Top5 與對應的拆解設定。
    - 新增／更新／刪除 Goal 與 Subgoal。
    - 新增 Focus Session 紀錄。

---

## 6. Phase I 收尾：整合測試與技術債清單

### 6.1 整合驗證情境

- **至少完成以下手動驗證（以暫時的 Debug 畫面即可）**：
  1. 登入 App（若已串 Auth）：
     - 能從 App 端看到與 Web 相同的 Goals 清單。
  2. 在 App 中新增一個新 Goal：
     - 可在 Supabase 後台 / Web 版 Dashboard 中看到該 Goal。
  3. 呼叫一個簡易的 FocusSession 寫入：
     - 透過 GoalsContext 的 `addFocusSession` 新增紀錄。
     - 在 Supabase `FocusSessionLog` 表中可看到正確欄位值。

### 6.2 整理技術債與 TODO

- 在文件或 issue tracker 中記錄：
  - 哪些 Web 端功能仍未搬到 App core（例如尚未搬運的 RPC 或 view）。
  - 哪些地方暫時以 mock / 簡化實作代替（之後再強化）。
  - 對型別與錯誤處理的後續優化需求。

---

> 本文件僅為 Phase I 的詳細步驟藍圖，實際實作時可依進度斟酌拆成多個 Pull Request 或開發循環。

## 附錄：錯誤清單（Error Log）

> 規則：遇到錯誤時在此新增一筆，`狀態` 標示「未解決 / 已解決」，解決後補上「解法」。

- **E-001 PowerShell 無法辨識 `todo_list` 指令**
  - 狀態：已解決
  - 發生環境：開發機 Windows / PowerShell
  - 現象：在 PowerShell 執行 `todo_list ...` 出現「無法辨識 'todo_list' 詞彙是否為 Cmdlet、函數、指令檔或可執行程式的名稱」。
  - 解法：確認專案中並無 `todo_list` CLI，停止在 shell 中呼叫該指令，改在本說明書中用條列方式維護工作與錯誤清單。
