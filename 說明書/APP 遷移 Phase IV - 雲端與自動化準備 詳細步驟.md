# APP 遷移 Phase IV：雲端與自動化準備 詳細步驟

> 對應：《APP 遷移技術規劃 (Web to Expo React Native).md》中的 Phase IV
> 目的：讓 Expo App 能穩定與 Supabase 專案連線，並建立 EAS 打包與基本 CI/CD 流程。

---

## 0. 前提與完成定義

- **前提條件**
  - Phase I–III 已有初步可運作的 App（至少能執行核心 flow）。
  - Supabase 專案在 Web 版上已穩定使用一段時間。
- **本 Phase 完成判準**
  - App 專案：
    - 有 `app.config.ts` / `app.json`，內含 Supabase 所需環境變數。
    - 有 `eas.json`，可使用 `eas build` 在雲端成功產出 iOS / Android build。
  - Supabase 端：
    - 表格 / RPC / Edge Functions 列表有清單與版本紀錄。

---

## 1. Supabase 設定與檢查

### 1.1 梳理目前使用的資料表與 RPC

- 依《產品規格說明書》與程式碼，整理清單：
  - 表格：`Goal`, `Subgoal`, `FocusSessionLog`, `User`, `WeeklyCommitment`, `HabitTracking`, `AccountabilityPartner`, `UserStats`, `focus_league_*`。
  - 視圖：`focus_league_user_details` 等。
  - RPC：`get_interruption_reason_counts`, `get_my_group_anonymous_board`, `get_my_masked_id` 等。
  - Edge Functions：`focus-league`, `league-daily`, `weekly-report` 等。

### 1.2 確認 Schema 穩定性

- 為每個實體確認：
  - 是否還有未定欄位名稱或型別要改？
  - 是否有未來一定會調整的大改（若有，儘量在 App 上線前完成）。
- 若可能，將 Supabase 資料表定義納入版本控制（例如 SQL migration 檔）。

---

## 2. 在 App 專案設定 Supabase 環境變數

### 2.1 app.config.ts / app.json 設定

- 在 `focus-compass-app` 中：
  - 建立或更新 `app.config.ts`：
    - `extra: { SUPABASE_URL, SUPABASE_ANON_KEY, ... }`
- 確保：
  - 不將機密金鑰（service key）放入 App；只使用 anon key。

### 2.2 開發 / 測試 / 正式環境區分

- 規劃：
  - `SUPABASE_URL` / `SUPABASE_ANON_KEY` 依 profile（dev / staging / prod）切換。
  - 確認 App 在不同 profile 使用正確的 Supabase 專案。

---

## 3. 設定 EAS（Expo Application Services）

### 3.1 建立 eas.json

- 在 App 專案根目錄建立 `eas.json`，定義至少兩個 profile：
  - `preview`：
    - 用於內部測試 build（例如 debug build）。
  - `production`：
    - 用於正式上架 build。

### 3.2 EAS 帳號與專案連結

- 透過 CLI：
  - 登入 Expo 帳號。
  - 將 App 專案連結到專案 slug。

### 3.3 測試雲端 build

- 嘗試：
  - `eas build --platform ios --profile preview`
  - `eas build --platform android --profile preview`
- 確認：
  - build 可在 TestFlight / internal track 安裝與啟動。

---

## 4. 建立基本 CI/CD 流程（可選但強烈建議）

### 4.1 與 GitHub 連動

- 將 repo（含 Web + App）推到 GitHub 或其他版本控管平台。
- 設定權限讓 EAS 能讀取該 repo（若需）。

### 4.2 建立簡單的自動化流程

- 例如使用 GitHub Actions：
  - 對 main 分支：
    - push 時跑 lint / test。
  - 對 tag（例如 `v*`）：
    - 觸發 EAS build（可先用手動觸發，之後再自動化）。

---

## 5. Supabase 與 App 的整合驗證

### 5.1 End-to-End 測試（手動）

- 使用 EAS build 出來的 App，在實機上做：
  - 登入 / 註冊（若已實作）。
  - 建立目標、啟動專注、完成後在 Dashboard / League 中檢查數據是否正確。

### 5.2 監控與錯誤追蹤

- 規劃未來導入 Sentry 等工具：
  - App JS 層錯誤收集。
  - 若 Edge Functions 或 RPC 失敗，可在 Sentry 中看到相關資訊。

---

## 6. Phase IV 收尾

- 檢查：
  - 是否有清楚的文件說明如何在新環境（新機器）重新設定 EAS / Supabase 環境變數。
  - 是否能在合理時間內（例如 1 小時內）從零建好一個可 build 的 App 環境。

> 本文件針對雲端與自動化準備提供步驟清單，實際 CI/CD 深度可隨團隊規模與預算調整。
