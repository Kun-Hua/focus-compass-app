# 實作計畫表（League 畫面接上真實功能 — 以現有 UI 為主）

> 目標：**保留現在 League 畫面的視覺與區塊設計**（Rank 卡片、Leaderboard、Badges），把裡面的 Mock 資料換成真實的 leagueApi 資料，同時補上必要的 Loading / Error / Empty 狀態。

## 一、目前 League 畫面 UI 行為盤點

### [A1] 畫面結構對應（`app/(tabs)/league.tsx`）

- **Header 區**
  - 單純顯示標題 `League`。

- **Rank Card（段位卡片）**
  - 目前使用 `userRank` Mock：
    - `league`, `icon`, `honestyMinutes`, `nextLeague`, `minutesToNext`, `progress`, `atRisk`。
  - UI 元件：
    - 上方：當前 League 名稱、Icon、Subtitle（例如「Top 20% of users」）、本週誠實分鐘數。
    - 中間：進度條（距離下一段位的進度）。
    - 下方：若 `atRisk` 為 true 時顯示警告訊息。

- **Leaderboard 區塊**
  - 使用 `leaderboard` Mock 陣列：`rank`, `name`, `minutes`, `trend`, `isUser`。
  - UI：
    - Card 內的列表，每列顯示名次、縮寫 Avatar、名稱、分鐘數、趨勢箭頭。
    - `isUser` 決定該列是否使用強調顏色（代表「你自己」）。

- **Badges 區塊**
  - 使用 `badges` Mock 陣列：`id`, `name`, `icon`, `unlocked`。
  - UI：
    - 幾個徽章卡片，顯示 emoji + 名稱。
    - `unlocked === false` 時以淡化（locked）樣式呈現。

> 結論：League 畫面目前是「純 UI + 本地 Mock」，沒有任何 API 呼叫與狀態分支，我們要在維持 UI 長相不變的前提下，接上 leagueApi 資料，並加上基本的 loading/error/empty 行為。

---

## 二、資料模型與狀態設計（以 UI 需求為主）

### [B1] 需要的後端資料

- 使用者聯盟資訊（League Mapping）
  - 來源：`getMyLeagueMapping()`
  - 型別：`LeagueMapping`
    - `current_league_id`, `current_group_id`, `hqc_status` 等。

- 聯盟列表（Leagues）
  - 來源：`getLeagues()`
  - 用途：
    - 以 `league_id` 對應顯示名稱 `league_name`。
    - 提供 `getLeagueName(leagues, id)` 幫 rank 卡顯示文字。

- 匿名排行榜（Anonymous Board）
  - 來源：`getMyAnonymousBoard(weekStart?)`
  - 型別：`AnonymousBoardRow[]`
    - `rank_in_group`, `masked_id`, `weekly_honest_minutes` 等。

- （Phase 之後）徽章 / 歷史升降級紀錄
  - 來源：`getMyBadges()`, `getMyLeagueHistory()`。
  - 暫時只在後續 Phase 處理。

### [B2] League 畫面本地狀態

- `loading: boolean`
- `error: string | null`
- `mapping: LeagueMapping | null`
- `leagues: League[]`
- `board: AnonymousBoardRow[]`

- **衍生 UI 狀態**（不另外存 state，由資料計算）：
  - 目前 League 名稱：`currentLeagueName = getLeagueName(leagues, mapping?.current_league_id)`。
  - 本人本週誠實分鐘數：從 `board` 中推算（必要時之後再以 `getMyMaskedId` 精準對應）。

---

## 三、以 UI Flow 拆解要做的事

### [C1] Flow 1：打開 League → 載入 mapping / leagues / board

1. 畫面載入時：
   - 透過 `useEffect` 觸發 `loadData()`（之後在 `LeagueScreen` 中新增）。
2. `loadData` 目標：
   - 以 `Promise.all` 並行呼叫：
     - `getMyLeagueMapping()`
     - `getLeagues()`
     - `getMyAnonymousBoard(weekStart)`（`weekStart` 可用 `getWeekStartISO()` 算出本週一）。
3. 成功後更新狀態：
   - `setMapping(mapping)`
   - `setLeagues(leagues)`
   - `setBoard(board)`
4. 失敗時：
   - `console.error('[League] Failed to load data', err);`
   - `setError(err.message || '載入失敗，請稍後再試');`

### [C2] Flow 2：用真實資料替換 Rank Card Mock

1. 以 `mapping` + `leagues` 產出：
   - `leagueName`：目前 League 名稱。
   - 額外資訊（暫時可維持固定文案或簡單判斷）：
     - `Top 20% of users` 等 subtitle。
2. 以 `board` 推出「你自己的本週誠實分鐘數」：
   - 最簡單版本：
     - 先不特別區分「你」與「其他人」，只顯示 `board` 中某個代表值（例如：最大值 / 平均值）。
   - 之後可透過 `getMyMaskedId()` 精準對應出本人的一列。
3. `nextLeague`, `minutesToNext`, `progress`, `atRisk`：
   - Phase I 可先以假邏輯 / 固定值呈現（只是換算顯示方式），之後再由 server 端提供精準數值。

### [C3] Flow 3：用 `board` 替換 Leaderboard Mock

1. 使用 `board: AnonymousBoardRow[]` 作為資料來源。
2. 排序邏輯：
   - 先依 `rank_in_group` 排序，若無則依 `weekly_honest_minutes` 由大到小。
3. 對應到 UI 欄位：
   - `rank` → 排序後的 index 或 `rank_in_group`。
   - `name` → `masked_id`（匿名 ID）。
   - `minutes` → `weekly_honest_minutes`。
   - `trend`：Phase I 可以全部給 `'neutral'`，之後再結合歷史資料。
   - `isUser`：之後可藉由 `getMyMaskedId` 來標記「你」那一列。

### [C4] Flow 4（之後 Phase）：Badges 接真實資料

- 目前 Badges 純用 `badges` Mock。
- 之後若要接真實資料：
  - 呼叫 `getMyBadges()`。
  - 使用回傳的 `badge.badge_name` / `badge.badge_code` 作為顯示文字與 Icon 決策依據。

---

## 四、Loading / Error / Empty 狀態規劃

### [D1] Loading 狀態

- 新增 `loading` state：
  - 在 `loadData` 前設為 `true`，完成時設為 `false`。
- UI 行為（可複用 Vision 的模式）：
  - `loading === true` 時顯示 Spinner + 簡短文字，暫時不渲染 Rank / Leaderboard / Badges。

### [D2] Error 狀態

- 新增 `error` state：
  - 當任一 API 出錯時設置錯誤訊息。
- UI 行為：
  - 顯示簡單錯誤文字與「重試」按鈕。
  - 點擊「重試」時重新呼叫 `loadData()`。

### [D3] Empty 狀態

- `mapping === null`：
  - 顯示「尚未加入 League」的提示文案，解釋如何開始累積專注時間以進入 League 系統。
- `board.length === 0`：
  - Leaderboard 區塊顯示「本週尚無排行榜資料」。

---

## 五、實作與測試順序

### [E1] Step 1：在 LeagueScreen 中接上 leagueApi

- 在 `LeagueScreen` 中加入：
  - `loading`, `error`, `mapping`, `leagues`, `board` 等 state。
  - `useEffect` 觸發 `loadData()`。
- 實作 `loadData`：
  - `setLoading(true)` → `Promise.all` 呼叫三個 API → 更新 state → `setLoading(false)`。

### [E2] Step 2：替換 Rank Card 的資料來源

- 把 `userRank` 改成由 `mapping` + `leagues` 推出的衍生資料結構。
- 驗證：
  - 不管 mapping 是否為 null，UI 都不會爆錯。

### [E3] Step 3：替換 Leaderboard 的資料來源

- 把 `leaderboard` Mock 改為由 `board` 轉出。
- 驗證：
  - 有資料時各列顯示正確 rank / masked_id / minutes。
  - 無資料時顯示空狀態文案。

### [E4] Step 4：測試錯誤與空狀態

- 刻意讓某個 API 失敗 / 斷網：
  - 應看到錯誤訊息與重試功能。
- 在沒有 mapping 或 board 的帳號下：
  - 應看到合理的空狀態解釋，而非整個畫面壞掉。

