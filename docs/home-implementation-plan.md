# 實作計畫表（Home/Overview 畫面接上真實功能）

> 目標：將 App Home/Overview 畫面從「靜態展示」改為串接實際資料（如使用者名稱、當日重點、進度摘要等），但 **不大改現有 UI 排版**。

## 一、資料模型與狀態設計

### [A1] 確立前端需要的資料

具體欄位依實際 Home 畫面為準，建議先支持：

- **使用者基本資訊**
  - 來源：`useAuth()` 或對應的 User context
  - 用途：顯示稱呼（例如「嗨，某某」）、個人化文案

- **今日 / 本週 Focus 概況（選擇性）**
  - 來源：
    - `FocusSessionLog` 的彙總（可沿用或抽象成 `useFocusAnalytics` 或新的 service）
  - 指標：
    - 今日專注分鐘數
    - 本週專注分鐘數

- **Goal / League 概要（選擇性）**
  - 從已有 service 輕量取得：
    - `goalsApi.getCoreGoals(user.id)` → 顯示核心目標標題
    - `getMyLeagueMapping()` + `getLeagues()` → 顯示目前所屬 League

> 註：若當前 Web 版有 Home/Overview 頁，可先比對其使用的 hooks/services，對齊欄位需求。

### [A2] Home 畫面狀態

- `loading: boolean`
- `error: string | null`
- `userSummary` / `focusSummary` / `goalsSummary` / `leagueSummary` 等衍生資訊：
  - 儘量由 service / helper 哈函式計算得出，減少重複狀態。

---

## 二、載入流程設計（實作 `loadHomeData`）

### [B1] 前置檢查

- 若未登入（`!user`）
  - 可選擇：
    - 直接導向登入相關畫面
    - 或顯示「請先登入」提示（視目前 Home 設計而定）

### [B2] 並行取得摘要資料

- 在 `useEffect` 中依賴 `[user]`，當 `user` 存在時：

```ts
setLoading(true);
setError(null);

try {
  const [focusSummary, goalsSummary, leagueSummary] = await Promise.all([
    // 依實作選擇：從 useFocusAnalytics 或直接 query Supabase
    fetchFocusSummary(user.id),
    fetchGoalsSummary(user.id),
    fetchLeagueSummary(user.id),
  ]);

  setState({ focusSummary, goalsSummary, leagueSummary });
} catch (err) {
  setError(err.message ?? '載入失敗，請稍後再試');
} finally {
  setLoading(false);
}
```

- `fetchFocusSummary` / `fetchGoalsSummary` / `fetchLeagueSummary` 可包在 `src/core/services/` 下作為輕量 API。

---

## 三、UI 對應與取代暫時文案

### [C1] User Greeting 區

- 將「Hi, User」這類靜態字串，改為：
  - 若 `user.profile` 或類似欄位有名稱 → 顯示使用者名字
  - 否則 fallback 為 email / 匿名稱呼

### [C2] 今日 / 本週專注摘要區

- 以 focusSummary 的資料取代 mock：
  - 例如：`今日專注 X 分鐘`、`本週誠實專注 Y 分鐘` 等

### [C3] 目標與 League 總覽卡片

- 改為顯示：
  - 目前核心目標數量＋其中一個目標標題
  - 目前 League 名稱（使用 `getLeagueName(leagues, mapping.current_league_id)`）

---

## 四、錯誤 / Loading / 空狀態設計

### [D1] Loading 態

- `loading === true` 時：
  - 置中 Loader + 簡短文字（例如：「載入你的專注儀表板…」）

### [D2] Error 態

- `error` 有值時：
  - 顯示錯誤訊息
  - 提供「重試」按鈕，重新觸發 `loadHomeData()`

### [D3] 空狀態

- 沒有任何專注記錄 / 目標 / league 時：
  - 顯示引導文案（例如：「還沒有專注紀錄，馬上開始第一個 Focus Session 吧！」）。

---

## 五、實作與測試步驟

### [E1] 比對 Web 版 Home/Overview（若有）

1. 在 `src/` 下尋找 Web 版 Home/Overview 頁或 hooks。
2. 列出已存在的 service / hook，可直接沿用。

### [E2] 建立 `loadHomeData` 流程

1. 在 Home 畫面元件內新增：`loading`, `error`, 以及 `summary` 類狀態。
2. 於 `useEffect` 中實作 `loadHomeData` 並在 mount / user 變更時觸發。

### [E3] 將 UI 由靜態改為資料驅動

1. Greeting 區改成顯示真實使用者稱呼。
2. 專注 / 目標 / league 區塊使用真實 summary 資料。

### [E4] 測試各種情境

- 已有大量專注紀錄與目標 → 應正確顯示摘要。
- 完全沒資料的新帳號 → 應顯示友善的空狀態文案。
- 斷網 / API 失敗 → 顯示錯誤訊息與重試選項。
