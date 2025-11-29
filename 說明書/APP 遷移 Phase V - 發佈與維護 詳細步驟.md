# APP 遷移 Phase V：發佈與維護（上線階段）詳細步驟

> 對應：《APP 遷移技術規劃 (Web to Expo React Native).md》中的 Phase V
> 目的：將 App 從內部測試推進到 App Store / Google Play 正式上架，並建立後續維護與更新流程。

---

## 0. 前提與完成定義

- **前提條件**
  - Phase I–IV 已完成：App 功能可用、雲端環境穩定、EAS build 正常。
- **本 Phase 完成判準**
  - App 已在 App Store / Google Play 上架，至少以小規模用戶運行。
  - 已定義版本管理策略與更新流程（含 EAS Updates）。

---

## 1. App 身份與版本設定

### 1.1 Bundle Identifier / Package Name

- iOS：
  - 設定 `ios.bundleIdentifier`（例如：`com.focuscompass.app`）。
- Android：
  - 設定 `android.package`（例如：`com.focuscompass.app`）。

### 1.2 版本號策略

- 採用：
  - `version`（對使用者顯示，例：1.0.0）
  - `buildNumber`（iOS） / `versionCode`（Android）作為內部累進編號。
- 在文件中定義：
  - 何種變更需要 bump major / minor / patch。

---

## 2. App Store / Google Play 準備

### 2.1 應用資訊與文案

- 依《產品規格說明書》的定位，準備：
  - App 名稱與副標題。
  - 簡短介紹與完整說明文字。
  - 關鍵字（搜尋用）。

### 2.2 截圖與預覽

- 至少準備：
  - 5–10 張截圖，覆蓋：Vision / Focus / Dashboard / League / Partner。
  - 強調：
    - 5/25 聚焦流程。
    - Honesty Mode 專注紀錄。
    - 時間複利儀表板（Dashboard）。

### 2.3 隱私與權限說明

- 若 App 使用：
  - 通知權限：說明用途（例如提醒專注 / 週報）。
  - 相機 / 麥克風（若未來 Timelapse 擴充）：說明用途與隱私保護策略。

---

## 3. Build 與提交流程

### 3.1 使用 EAS 產生正式 build

- iOS：
  - `eas build --platform ios --profile production`
- Android：
  - `eas build --platform android --profile production`

### 3.2 提交到 Store

- iOS：
  - 透過 Transporter / EAS 連動上傳至 App Store Connect。
  - 設定 TestFlight 測試群組，先做內部測試。
- Android：
  - 將 AAB 上傳到 Google Play Console。
  - 選擇 internal / closed / open 測試通道。

---

## 4. 更新與維護策略

### 4.1 EAS Updates（OTA 更新）

- 定義：
  - 哪些更新可透過 EAS Updates（JS / UI）發布。
  - 哪些更新必須重新 build（新增原生權限／模組）。
- 建議流程：
  - 開發 → 測試 → 使用 EAS Update 推到 staging channel → 無問題後再推到 production channel。

### 4.2 監控與回饋

- 導入：
  - 錯誤追蹤（例如 Sentry）。
  - 行為分析（例如 Mixpanel / Amplitude）：
    - 監控專注時長、留存率、功能使用率。
- 建立：
  - crash 率與主要錯誤指標的監控儀表板。
  - 重要事件（例如 FocusSessionLog 寫入失敗）的告警。

---

## 5. 版本迭代與溝通

### 5.1 發版節奏

- 建議：
  - 早期：每 1–2 週一版（快速修 bug 與調整）。
  - 穩定後：每月 1 版，聚焦在明確的功能迭代。

### 5.2 變更紀錄

- 維護公開或半公開的 Changelog：
  - 列出每版主要改動（新功能 / 改善 / 修正）。
  - 在 App 內提供「近期更新」區塊或連結到官方頁面。

### 5.3 使用者溝通

- 建議：
  - 在關鍵功能變更時，透過：
    - App 內 banner / modal 提醒。
    - Email / 社群公告（若有 mailing list / 社團）。

---

## 6. Phase V 收尾

- 檢查：
  - 是否有完整的上架文件（含截圖、文案、權限說明）。
  - 是否有標準化的「發版 checklist」。
  - 是否能在有限時間內（例如 1–2 天）完成從「合併 PR」到「使用者拿到更新」的完整流程。

> 本文件為 Phase V 的上線與維護步驟說明，實際時間表可依 App 成熟度與團隊資源調整。
