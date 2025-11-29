# Home (Dashboard) Design Specification

## 1. Overview
- **Page Name**: Home (Dashboard)
- **Route**: `/dashboard`
- **Goal**: Help users decide "What to do next" in 10 seconds and track weekly progress.
- **Style**: Cold Productivity Minimalist (Primary: `#3B82F6`, Bg: `#F9FAFB`)

## 2. Layout & Components

### 2.1 Header
- **Layout**: Flex row, space-between.
- **Left**:
  - **Title**: "Today" (H1, 32px, Bold, `#111827`)
  - **Date**: "Mon, Nov 29" (Caption, 14px, Regular, `#6B7280`) - *Below title*
- **Right**:
  - **Avatar**: 40x40px circle, user profile image. Clicking navigates to `/settings`.

### 2.2 MIT Card (Most Important Task)
- **Container**: Card style (White, 12px radius, soft shadow).
- **State A: Normal (Task Selected)**
  - **Header**: "Today's Focus" (Caption, `#6B7280`, Uppercase).
  - **Content**:
    - **Task Name**: Text (H2, 24px, SemiBold, `#111827`).
    - **Goal Tag**: Pill badge (Bg: `#EFF6FF`, Text: `#3B82F6`, 12px).
  - **Action**: "Start Focus" Button (Primary, Full width, 48px height).
    - *Interaction*: Navigates to `/execute?goalId={id}&taskId={id}`.
- **State B: Empty (No Task)**
  - **Illustration**: Simple vector icon (Target/Calendar).
  - **Text**: "Select your One Thing for today."
  - **Action**: "Select from Vision" Button (Secondary).
    - *Interaction*: Opens Bottom Sheet with tasks from `CommitmentCalendar`.

### 2.3 KPI Cards (Row of 3)
- **Layout**: Grid (3 columns) or horizontal scroll on small screens.
- **Card Style**: Small square cards (White, 12px radius).
- **Card 1: Commitment**
  - Label: "Planned"
  - Value: "{hours}h" (e.g., "40h")
  - Color: Neutral `#6B7280`
- **Card 2: Net Focus**
  - Label: "Actual"
  - Value: "{hours}h" (e.g., "32.5h")
  - Color: Primary `#3B82F6`
- **Card 3: Honesty**
  - Label: "Honesty"
  - Value: "{percentage}%"
  - Color: Dynamic (Green > 90%, Amber > 70%, Red < 70%).

### 2.4 Weekly Streak
- **Container**: Transparent or subtle border.
- **Content**:
  - **Icon**: Fire emoji 🔥 or icon.
  - **Text**: "{N} Week Streak" (H2, SemiBold).
  - **Status**: "On Track" (Green text) or "At Risk" (Amber text).
- **Logic**: Checks if `current_week_hours >= committed_hours` for all Core goals.

### 2.5 Charts Carousel
- **Component**: Swipeable card carousel.
- **Card 1: Contribution**
  - **Type**: Horizontal Bar Chart.
  - **Data**: Top 5 Core Goals time distribution.
- **Card 2: Role Balance**
  - **Type**: Donut Chart.
  - **Data**: Time spent per Role tag.
- **Card 3: Efficiency Heatmap**
  - **Type**: 7x24 Grid.
  - **Data**: Intensity based on `FocusSessionLog` timestamps.

### 2.6 Programmatic Diagnostics (Vertical Stack)
- **Container**: List of dismissible cards.
- **Content**:
  - **Title**: "Distraction Alert" / "Pattern Detected".
  - **Body**: "You are often interrupted by 'Social Media' around 2 PM."
  - **Action**: "Try Focus Mode" (Link to `/execute`).
- **Data Source**: Analysis of `FocusSessionLog` interruption tags.

## 3. Data Sources & Logic

| UI Element | Source | Logic |
| :--- | :--- | :--- |
| **MIT Task** | `localStorage` (`dashboard_mit_{date}`) | Selected from Vision Calendar tasks. |
| **KPI Data** | Supabase `FocusSessionLog` | `sum(duration)` where `honesty_mode=true`. |
| **Commitment** | Supabase `Goal` | `sum(weekly_commitment_hours)` of active goals. |
| **Streak** | Hook `useWeeklyStreak` | Compares history of logs vs commitments. |
| **Charts** | Supabase `FocusSessionLog` | Aggregated by `goal_id`, `role`, `timestamp`. |

## 4. Interaction Flows
1. **Select MIT**: User clicks "Select" -> Bottom Sheet shows tasks -> User picks one -> Card updates to Normal State.
2. **Start Focus**: User clicks "Start Focus" -> App navigates to `/execute` -> Timer is ready with the specific Goal/Subgoal pre-selected.
3. **View Details**: Clicking a Chart Card opens a detailed Analytics modal (future scope).
