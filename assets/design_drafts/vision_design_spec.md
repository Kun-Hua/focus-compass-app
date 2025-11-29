# Vision Design Specification

## 1. Overview
- **Page Name**: Vision
- **Route**: `/vision`
- **Goal**: Define long-term direction using the 5/25 rule and break it down into weekly commitments.
- **Style**: Cold Productivity Minimalist (Primary: `#3B82F6`, Bg: `#F9FAFB`)

## 2. Layout & Components

### 2.1 5/25 Goal Management (巴菲特法則)
- **Layout**: Two-column split (Desktop) or Tabbed view (Mobile: Core / Avoid).
- **Left Column: Core Top 5**
    - **Header**: "Core Top 5" (H2, 24px, SemiBold).
    - **Counter**: "3/5 Goals" (Caption, Gray).
    - **List**: Draggable cards (最多 5 個).
    - **Card Style**: 
        - White background, 12px radius, soft shadow.
        - Prominent "Core" badge (Blue `#3B82F6`).
        - Goal name (Body, 16px).
        - Drag handle icon (⋮⋮) on left.
    - **Add Button**: "+ Add Goal" (只在 < 5 時顯示).
- **Right Column: Avoid List**
    - **Header**: "Avoid List" (H2, Red `#EF4444` text).
    - **Description**: "Goals to actively ignore." (Caption).
    - **List**: Draggable cards (Grayed out, opacity 0.6).
    - **Card Style**: Same as Core but with gray badge.
- **Interaction**: 
    - **拖拉**：長按卡片 → 拖到另一欄 → 放開 → 自動更新狀態.
    - **限制**：拖到 Core 時，若已有 5 個，顯示紅色邊框 + Toast "Core 目標已達上限 (5/5)".
    - **視覺回饋**：拖拉時卡片放大 1.05 倍，目標欄位顯示虛線框.

### 2.2 Commitment Calendar (承諾月曆)
- **View**: Monthly Grid (5 rows × 7 columns).
- **Header**:
    - Month/Year selector: "← November 2025 →".
    - Weekday labels: Mon, Tue, Wed, Thu, Fri, Sat, Sun (Caption, Gray).
- **Cell (每個日期格子)**:
    - **Size**: Square, ~48px × 48px.
    - **Date Number**: Top-left corner (14px, Bold if today).
    - **Today Indicator**: Blue circle background if current date.
    - **Task Dots**: Small colored dots below date (最多顯示 3 個).
        - Each dot = 1 task, color = goal's color.
        - If > 3 tasks: show "+2" text.
    - **MIT Star**: Gold star ⭐ icon in top-right corner if MIT is set.
- **Empty Cell**: Light gray background `#F9FAFB`.
- **Interaction**: 
    - **Click cell** → Opens **Add Task Bottom Sheet**.
    - **Click existing dot** → Opens task list for that day.

### 2.3 Add Task Bottom Sheet
- **Input**: "What will you do?" (Text).
- **Goal Selector**: Dropdown (Core goals only).
- **MIT Toggle**: "Make this my #1 priority today".
- **Action**: "Save Commitment".

### 2.4 Goal Detail View
- **Route**: `/vision/goal/:id`
- **Header**: Goal Name (Editable).
- **Subgoals Section**:
    - List of sub-tasks.
    - "Add Subgoal" input row.
- **Weekly Commitment**:
    - Input: "Hours per week" (Number).
    - Helper text: "Be realistic. Start small."
- **Long-term Vision**:
    - Textarea (Collapsible): "Why do I want this?"

### 2.5 Onboarding (First Run)
- **Style**: Full-screen wizard.
- **Step 1**: "Imagine your 80th birthday..." (Textarea).
- **Step 2**: "Define your top 3 values."
- **Skip Option**: "I know my goals, skip to 5/25."

## 3. Data Sources & Logic

| UI Element | Source | Logic |
| :--- | :--- | :--- |
| **Goal Lists** | Supabase `Goal` | Filter by `status` ('core', 'avoid'). |
| **Calendar** | `CommitmentCalendar` | Stored in LocalStorage or Supabase JSONB. |
| **Goal Detail** | Supabase `Goal`, `Subgoal` | CRUD operations. |

## 4. Interaction Flows
1. **Prioritize**: User drags "Learn Spanish" from Avoid to Core. App warns if Core > 5.
2. **Plan Week**: User clicks Monday -> Adds "Study Ch 1" -> Binds to "Learn Spanish".
3. **Review**: User clicks "Learn Spanish" -> Updates weekly commitment to 5 hours.
