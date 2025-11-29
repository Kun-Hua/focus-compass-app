# 實作計畫表（Partner/Coach/家長視角 畫面接上真實功能）

> 目標：將 Partner 畫面從靜態或 mock UI，改為讀取後端實際資料（例如被陪伴者的進度、專注時間、目標狀態等），同樣 **不大改既有 UI 排版**，先讓畫面「真的會動」。

## 一、資料模型與狀態設計

### [A1] 確立 Partner 頁面角色與資料需求

依 Web 版 Partner 頁為準，一般會需要：

- **被陪伴者（student / child）列表**
  - 若 Partner 可以關注多個對象，需列表：
    - `id`
    - `displayName`
    - 關係 / 備註（父母、教練…）

- **單一被陪伴者的專注與目標摘要**
  - 可能包含：
    - 今日 / 本週專注分鐘數
    - 近期專注紀錄列表（Log）
    - 目前核心目標概覽
    - 達成率 / 積分等

> 實際欄位須對照 Web 版 Partner 邏輯（在 `src/` 內搜尋 partner/coach 相關檔案）。

### [A2] 狀態設計

- `loading: boolean`
- `error: string | null`
- `selectedStudentId: string | null`
- `students: PartnerStudent[]`
- `summary: PartnerStudentSummary | null`

型別可依 Web 端既有型別做調整，這裡只先定概念：

```ts
type PartnerStudent = {
  id: string;
  name: string;
};

type PartnerStudentSummary = {
  todayFocusMinutes: number;
  weekFocusMinutes: number;
  recentSessions: any[]; // 後續可細分型別
  goalsSnapshot: any[];  // 目標概況
};
```

---

## 二、資料來源與 service 規劃

### [B1] 盤點 Web 版 Partner 使用的 API

- 在 `src/` 中搜尋：`partner`, `coach`, `parent` 等關鍵字。
- 找出：
  - 已有的 Supabase 表（例如：`PartnerRelation`, `StudentSummaryView` 等）。
  - 已封裝的 service 或 hooks。

### [B2] 在 App 端建立對應 service（若尚未抽出）

- 在 `src/core/services/` 下建立或沿用：
  - `partnerApi.getMyStudents()`
  - `partnerApi.getStudentSummary(studentId)`

> 真實實作以 Web 端邏輯為準，這裡先規劃名稱與責任切割。

---

## 三、載入流程設計（Partner 頁 `loadPartnerData`）

### [C1] 載入學生列表

- 畫面載入 / Partner 登入後：
  - 呼叫 `partnerApi.getMyStudents()`。
  - 將結果存為 `students`。
  - 若列表非空，預設選中第一位：`setSelectedStudentId(students[0].id)`。

### [C2] 載入被選取學生摘要

- 當 `selectedStudentId` 變更時：

```ts
setLoading(true);
setError(null);

try {
  const summary = await partnerApi.getStudentSummary(selectedStudentId);
  setSummary(summary);
} catch (err) {
  setError(err.message ?? '載入失敗，請稍後再試');
} finally {
  setLoading(false);
}
```

- UI 依 `summary` 更新各卡片內容（專注、目標、近期紀錄等）。

---

## 四、UI 對應與互動設計

### [D1] 學生列表 / 切換

- 若 Partner UI 上有「切換孩子 / 學生」元件：
  - 資料來源改為 `students` state。
  - 點擊某個學生 → 更新 `selectedStudentId`，自動觸發重新載入 summary。

### [D2] 專注摘要卡片

- 使用 `summary.todayFocusMinutes` / `summary.weekFocusMinutes` 替換 mock 數值。
- 若沒有資料（例如新註冊）：顯示適當空狀態文案。

### [D3] 目標 / 最近紀錄區塊

- 以 `summary.goalsSnapshot` 與 `summary.recentSessions` 為資料來源。
- 儘量沿用目前 UI 元件，只改傳入 props。

---

## 五、錯誤 / Loading / 空狀態處理

### [E1] Loading 態

- 初次載入學生列表、或切換學生時：
  - 顯示 Loading Spinner，避免畫面閃爍。

### [E2] Error 態

- `error` 有值時：
  - 顯示錯誤訊息
  - 提供「重試」按鈕 → 重新觸發資料載入。

### [E3] 無學生 / 無摘要資料

- 若 `students.length === 0`：
  - 顯示「尚未綁定任何學生 / 孩子」的提示，並指引使用者如何建立關係。
- 若 `summary` 為 `null` 且 `selectedStudentId` 存在：
  - 顯示「目前尚無紀錄」空狀態。

---

## 六、實作與測試步驟

### [F1] 盤點並抽出 Web 版 Partner service

1. 在 Web 版找出 Partner 相關 API 調用。
2. 若尚未抽成 `partnerApi`，先在 `src/core/services/` 抽象出來。

### [F2] 接到 App Partner 畫面

1. 在 Partner 畫面元件中引入 `partnerApi`。
2. 建立 `students`、`selectedStudentId`、`summary` 等 state。
3. 在 `useEffect` 中實作：
   - 第一次載入學生列表。
   - 監聽 `selectedStudentId` 變化來載入 summary。

### [F3] 測試不同情境

- Partner 有多位學生 → 切換時摘要會更新。
- 無任何學生 → 顯示空狀態與引導。
- API 失敗 / 斷網 → 顯示錯誤與重試。 
