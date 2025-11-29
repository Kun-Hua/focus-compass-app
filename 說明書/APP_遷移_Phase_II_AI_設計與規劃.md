# APP 遷移 Phase II：AI 輔助設計與規劃

> **目標**：透過 AI 生成高保真 UI 設計圖，取代手動 Figma 設計流程。
> 
> **依據**：《頁面功能詳細清單》
> 
> **輸出**：各頁面的設計圖 (存於 `assets/design_drafts/`)

---

## 1. 工作流程

1. **AI 分析需求**：閱讀《頁面功能詳細清單》，理解頁面功能與資訊架構。
2. **生成設計圖**：使用 `generate_image` 工具產出高保真 UI Mockup (iPhone 14 Pro 尺寸)。
3. **使用者審核**：檢視設計圖，提出修改意見。
4. **迭代優化**：AI 根據回饋調整並重新生成。
5. **定案存檔**：確認後存為 Phase III 開發標準。

---

## 2. 設計原則

### 2.1 視覺風格
- **關鍵字**：冷靜、專注、極簡 (Cold Productivity Minimalist)
- **避免**：強烈對比、複雜裝飾、過多色彩

### 2.2 色彩系統
- **主色 (Primary)**：低飽和藍/青綠 `#3B82F6` - 專注、穩定
- **成功 (Success)**：綠 `#10B981` - 達標、成長
- **警示 (Warning)**：琥珀 `#F59E0B` - 提醒、注意
- **錯誤 (Error)**：紅 `#EF4444` - 失衡、違反承諾
- **背景 (Background)**：淺灰 `#F9FAFB`
- **表面 (Surface)**：白 `#FFFFFF`

### 2.3 字體
- **字型**：Inter
- **層級**：
  - H1: 32px / Bold
  - H2: 24px / SemiBold
  - Body: 16px / Regular
  - Caption: 14px / Regular

### 2.4 元件風格
- **卡片**：中等圓角 (12px)、柔和陰影
- **按鈕**：圓角 8px、清晰 CTA
- **Icon**：線性、簡潔

---

## 3. 設計任務清單

### 3.1 設計系統 (Design System)

- [ ] **Style Guide 總覽圖**
  - Color Palette (6 色)
  - Typography Scale (4 級)
  - Component Library (Button / Card / Input / Badge / Modal)

---

### 3.2 頁面設計

#### A. Home (Dashboard) - 每日決策中心

**參考**：《頁面功能詳細清單》第 1 節

##### A1. Home - Normal State
- [ ] **Header 區**
  - 左：標題 "Today" 或 "Dashboard"
  - 右：日期 + 使用者頭像

- [ ] **MIT 卡片**
  - 標題：「今日 MIT」
  - 任務名稱 + 綁定目標 Tag
  - CTA：「開始專注」按鈕 (跳轉 Focus)

- [ ] **KPI 核心指標 (3 卡)**
  - 本週承諾時數 (目標值)
  - 淨投入時間 (實際值)
  - 誠實度 % (比例)
  - 狀態燈號 (綠/黃/紅)

- [ ] **週連勝徽章**
  - 火焰 Icon 🔥 + 連勝週數
  - 本週達標狀態 (✓ 已達標 / ⏳ 進行中)

- [ ] **圖表 Carousel (橫向滑動)**
  - 卡片 1: 貢獻度條狀圖 (Core Top 5 各目標投入時間)
  - 卡片 2: 角色圓餅圖 (Role 分配)
  - 卡片 3: 效率熱力圖 (7天 × 24小時)

- [ ] **程式化診斷 (3 張卡)**
  - 中斷原因標題 + 次數
  - 改善建議文案
  - CTA：「前往 Focus 做實驗」

##### A2. Home - Empty State
- [ ] **空 MIT 引導**
  - 插圖 + 文案：「從 Vision 月曆選擇今日 MIT」
  - CTA：「前往 Vision」

- [ ] **空數據提示**
  - 文案：「開始第一次專注後，這裡會出現你的數據」
  - CTA：「前往 Focus」

---

#### B. Focus (Execute) - 專注執行

**參考**：《頁面功能詳細清單》第 2 節

##### B1. Focus - Timer View
- [ ] **Header**
  - 標題：「Focus」或「專注模式」
  - 次標題：目前選定目標名稱

- [ ] **目標選擇區**
  - Dropdown 1: 主目標 (Core Top 5 + 其他)
  - Dropdown 2: 小目標 (Subgoal)

- [ ] **Honesty Mode Toggle**
  - 開關 + 盾牌 Icon
  - 說明文字：「高誠實度專注」

- [ ] **計時器 Tabs**
  - Tab 1: Stopwatch (碼表)
  - Tab 2: Pomodoro (番茄鐘)
  - Tab 3: Timelapse (縮時攝影)
  - 大型計時器數字 (視覺中心)
  - 開始 / 暫停 / 結束按鈕

##### B2. Focus - Interruption Modal
- [ ] **中斷紀錄彈窗**
  - 標題：「紀錄中斷情況」
  - 中斷原因選擇 (8 種標籤：通知、社群、疲勞...)
  - 中斷次數 Stepper
  - 快速選項：「完全專注，無中斷」
  - 主按鈕：「儲存紀錄」
  - 次按鈕：「取消」(附警示文案)

---

#### C. Vision - 願景與規劃

**參考**：《頁面功能詳細清單》第 3 節

##### C1. Vision - 5/25 Management
- [ ] **5/25 目標管理**
  - 左欄：Core Top 5 列表 (最多 5 個)
  - 右欄：Avoid List (避免清單)
  - 拖拉排序視覺提示 (虛線框 / 拖曳手柄)
  - 錯誤提示：「Core 目標已達上限 (5/5)」

##### C2. Vision - Calendar View
- [ ] **承諾月曆**
  - 月曆 Grid (5×7，週一起算)
  - 日期格子 + 任務縮略 (最多顯示 2 個，其他用 "+x")
  - MIT 標記視覺 (星星 Icon / 高亮邊框)
  - 點擊日期 → Bottom Sheet 顯示當日任務清單

- [ ] **新增任務 Bottom Sheet**
  - 任務文字輸入
  - 綁定目標選擇 (Dropdown)
  - 儲存 / 取消按鈕

##### C3. Vision - Goal Detail
- [ ] **目標詳細拆解**
  - 目標名稱 + Core Tag
  - Subgoals 列表 (可新增/編輯/刪除/排序)
  - 週承諾時數輸入欄位
  - 長期願景文字 (可折疊區塊：年/季/月目標)

##### C4. Vision - Onboarding (可略過)
- [ ] **以終為始問卷**
  - 問題卡片 (80歲回顧、理想的一天、三大價值觀)
  - 多行文字輸入框
  - 頂部勾選框：「我已清楚目標，暫時跳過」

---

#### D. League - 聯賽與成就

**參考**：《頁面功能詳細清單》第 4 節

##### D1. League - Dashboard
- [ ] **段位卡**
  - 段位名稱 (Bronze / Silver / Gold) + Icon
  - 本週高誠實度分鐘
  - 升級進度條 + 文案：「距離升級還差 XX 分鐘」
  - 降級警示 (若接近門檻)

- [ ] **排行榜**
  - 列表顯示同組使用者
  - 欄位：排名 + 暱稱 + 週誠實分鐘 + 趨勢箭頭
  - 下拉更新視覺提示

- [ ] **徽章牆**
  - 網格或橫向 Scroll
  - 已解鎖：彩色 + 解鎖日期
  - 未解鎖：灰階 + 鎖頭 Icon

---

#### E. Partner - 問責夥伴

**參考**：《頁面功能詳細清單》第 5 節

##### E1. Partner - Comparison View
- [ ] **夥伴列表**
  - 夥伴卡片 (暱稱 + 頭像)
  - 核心指標：淨投入時間 / 承諾達成率 / 誠實度
  - 趨勢箭頭 (↑ 上升 / ↓ 下降)
  - 展開按鈕：查看更多細節

- [ ] **隱私設定入口**
  - 設定 Icon → 彈出設定面板
  - 可視指標開關 (5 項指標)

---

#### F. Settings - 設定

**參考**：《頁面功能詳細清單》第 6 節

##### F1. Settings - Profile
- [ ] **個人檔案**
  - 頭像 (可點擊更換)
  - 暱稱編輯欄位
  - Email / 匿名 ID 顯示

- [ ] **語系切換**
  - Segmented Control: 繁體中文 / English

- [ ] **通知設定**
  - Toggle: 每日提醒

---

### 3.3 關鍵流程設計

- [ ] **Flow: 每日決策循環**
  - 畫面 1: Dashboard 選 MIT
  - 畫面 2: 點擊「開始專注」→ Focus 頁面 (自動帶入目標)
  - 畫面 3: Focus 計時器運行
  - 畫面 4: 結束後彈出中斷紀錄 Modal
  - 畫面 5: 儲存後返回 Dashboard，KPI 更新

---

## 4. 交付物

### 4.1 設計資產清單
- `design_system.png` - 設計系統總覽
- `home_normal.png` - Dashboard 正常狀態
- `home_empty.png` - Dashboard 空狀態
- `focus_timer.png` - Focus 計時器
- `focus_interruption_modal.png` - 中斷紀錄彈窗
- `vision_5_25.png` - 5/25 目標管理
- `vision_calendar.png` - 承諾月曆
- `vision_goal_detail.png` - 目標詳細拆解
- `league_dashboard.png` - 聯賽儀表板
- `partner_view.png` - 夥伴比較
- `settings.png` - 設定頁面
- `flow_daily_decision.png` - 每日決策循環流程圖

### 4.2 設計註解
- 每張圖附帶 Markdown 格式的互動邏輯說明
- 標註資料來源 (Supabase 表 / Hook 名稱)

---

## 5. Phase II 完成標準

- [ ] 所有主要頁面皆有設計圖 (Normal + Empty State)
- [ ] 設計圖符合視覺風格原則 (冷靜生產力極簡風)
- [ ] 使用者確認設計圖可作為開發依據
- [ ] 設計資產已存檔至 `assets/design_drafts/`

---

## 6. 下一步：Phase III

完成 Phase II 後，進入 **Phase III: React Native UI 重寫**，依據設計圖實作各頁面元件。
