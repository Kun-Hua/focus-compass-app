# Focus (Execute) Design Specification

## 1. Overview
- **Page Name**: Focus (Execute)
- **Route**: `/execute`
- **Goal**: Execute high-honesty focus sessions and strictly record interruptions.
- **Style**: Cold Productivity Minimalist (Primary: `#3B82F6`, Bg: `#F9FAFB`)

## 2. Layout & Components

### 2.1 Header
- **Layout**: Flex row, centered or space-between.
- **Title**: "Focus" (H2, 24px, SemiBold).
- **Subtitle**: Current Goal Name (Caption, 14px, Regular, `#6B7280`).

### 2.2 Goal Selection Area
- **Container**: Top section below header.
- **Primary Goal Dropdown**:
    - **Style**: Full width, clean border input style.
    - **Content**: List of Core Top 5 + Other Goals.
    - **Default**: Pre-selected if navigated from Dashboard.
- **Subgoal Dropdown**:
    - **Style**: Full width, secondary style.
    - **Content**: Filtered list of subgoals for selected Goal.

### 2.3 Honesty Mode Toggle
- **Component**: Switch/Toggle with Icon.
- **Layout**: Centered or right-aligned.
- **State ON**:
    - **Icon**: Shield (Solid Blue).
    - **Label**: "Honesty Mode: ON" (Green/Blue text).
    - **Visual Feedback**: App background might have a subtle tint or border to indicate "High Stakes".
- **State OFF**:
    - **Icon**: Shield (Outline Gray).
    - **Label**: "Standard Mode".

### 2.4 Timer Tabs
- **Style**: Segmented Control (Stopwatch | Pomodoro | Timelapse).
- **Tab 1: Stopwatch**
    - **Display**: HH:MM:SS (Huge font, e.g., 64px, Monospace variant).
    - **Controls**: Start (Green), Pause (Amber), Stop (Red).
- **Tab 2: Pomodoro**
    - **Display**: MM:SS (Countdown).
    - **Settings**: 25m default (editable in settings, but fixed here for simplicity).
- **Tab 3: Timelapse** (Premium)
    - **Display**: Camera preview placeholder or "Recording..." indicator.
    - **Note**: "Record your work session for ultimate accountability."

### 2.5 Interruption Modal
- **Trigger**: Automatically opens when "Stop" or "Pause" is clicked (if session > 1 min).
- **Title**: "Session Interrupted?"
- **Grid of Reasons** (Selectable Tags):
    - Social Media, Notification, Colleague, Family, Fatigue, Hunger, Daydreaming, Other.
- **Counter**: "Times Interrupted: [ - ] 0 [ + ]"
- **Quick Action**: "Perfect Session (0 Interruptions)" - Large Primary Button.
- **Save Action**: "Save Log" - Secondary Button.

## 3. Data Sources & Logic

| UI Element | Source | Logic |
| :--- | :--- | :--- |
| **Goal List** | `GoalsProvider` | Active Core Goals first. |
| **Subgoal List** | `GoalsProvider` | Filtered by `selected_goal_id`. |
| **Timer State** | Local State | `isRunning`, `elapsedTime`, `mode`. |
| **Save Log** | Supabase `FocusSessionLog` | On save: `insert({ goal_id, duration, honesty_mode, interruptions... })`. |

## 4. Interaction Flows
1. **Start Session**: User selects Goal -> Toggles Honesty Mode -> Clicks Start.
2. **During Session**: Timer updates every second. Screen stays awake (if possible).
3. **End Session**: User clicks Stop -> Interruption Modal appears immediately.
4. **Log Data**: User selects "Notification" (1 time) -> Clicks Save -> Redirects to Dashboard or shows Summary Toast.
