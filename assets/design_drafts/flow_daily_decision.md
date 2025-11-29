# Key Flow: Daily Decision Loop

## 1. Overview
- **Flow Name**: Daily Decision Loop
- **Goal**: Guide the user from "What should I do?" to "Focus Complete" in minimal steps.
- **Pre-condition**: User has set up Goals in Vision.

## 2. Step-by-Step Walkthrough

### Step 1: The Trigger (Dashboard)
- **User State**: Opens app.
- **UI State**: Dashboard (Normal).
- **Scenario A (MIT Already Set)**:
    - User sees **MIT Card** with "Finish Report".
    - **Action**: Clicks "Start Focus".
    - **Transition**: Go to Step 3.
- **Scenario B (No MIT)**:
    - User sees **Empty MIT Card**.
    - **Action**: Clicks "Select from Vision".
    - **Transition**: Open Bottom Sheet (Step 2).

### Step 2: Selection (Vision Sheet)
- **UI State**: Bottom Sheet over Dashboard.
- **Content**: List of tasks from `CommitmentCalendar` for today.
- **Action**: User taps "Finish Report".
- **System**:
    - Saves `dashboard_mit_{date}` = Task ID.
    - Closes Sheet.
    - Updates Dashboard MIT Card to Scenario A.

### Step 3: Preparation (Focus Preview)
- **UI State**: Focus Page (Timer View).
- **Data**: Goal "Work" and Subgoal "Report" are pre-selected.
- **Action**:
    - User toggles **Honesty Mode** ON.
    - User clicks **Start Timer**.
- **System**:
    - Starts local timer.
    - Prevents screen sleep.

### Step 4: Execution (Focusing)
- **UI State**: Timer Running (Huge Numbers).
- **User Action**: Works for 25 minutes.
- **Interruption**: Phone rings.
- **Action**: User clicks **Stop/Pause**.

### Step 5: Accountability (Interruption Modal)
- **UI State**: Modal "Session Interrupted?".
- **User Action**:
    - Selects tag "Phone Call".
    - Increments count to 1.
    - Clicks "Save Log".
- **System**:
    - Writes to `FocusSessionLog`.
    - Calculates `net_focus_time = duration - (interruptions * penalty)`.

### Step 6: Feedback (Dashboard)
- **UI State**: Dashboard.
- **Updates**:
    - **Net Focus Card**: Increases by session duration.
    - **Honesty Card**: Recalculates based on interruption.
    - **Streak**: Checks if daily goal met.
- **User Feeling**: "I made progress and was honest."

## 3. Edge Cases
- **Forgot to Stop**: App detects long idle (future feature) or limits max session to 4 hours.
- **App Crash**: Timer state restored from LocalStorage on restart.
