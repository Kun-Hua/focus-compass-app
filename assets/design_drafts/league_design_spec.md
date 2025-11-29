# League Design Specification

## 1. Overview
- **Page Name**: League
- **Route**: `/league`
- **Goal**: Gamify the focus experience through social competition and achievements.
- **Style**: Cold Productivity Minimalist (Primary: `#3B82F6`, Bg: `#F9FAFB`)

## 2. Layout & Components

### 2.1 League Dashboard
- **League Card**:
    - **Visual**: Card with metallic gradient border (Bronze/Silver/Gold).
    - **Content**:
        - **Icon**: League Rank Icon.
        - **Text**: "Silver League" (H2).
        - **Stats**: "120 Honesty Minutes this week".
    - **Progress Bar**:
        - **Label**: "30 mins to Gold".
        - **Visual**: Thin progress bar with target marker.
    - **Warning**: "Risk of Demotion" (if in bottom 20%).

### 2.2 Leaderboard
- **List Item**:
    - **Rank**: Number (1, 2, 3...).
    - **Avatar**: Small circle.
    - **Name**: User nickname.
    - **Score**: "340 mins" (Right aligned).
    - **Trend**: Green Up Arrow / Red Down Arrow.
- **Interaction**: Pull-to-refresh to update rankings.

### 2.3 Badge Wall
- **Layout**: Grid of square icons.
- **Unlocked Badge**:
    - **Visual**: Full color icon.
    - **Label**: Badge Name + Date earned.
- **Locked Badge**:
    - **Visual**: Gray silhouette + Lock icon.
    - **Label**: "???" or Hint text.

## 3. Data Sources & Logic

| UI Element | Source | Logic |
| :--- | :--- | :--- |
| **League Info** | Supabase `focus_league_user_stats` | Current rank, score, next threshold. |
| **Leaderboard** | Supabase `focus_league_leaderboard` | Query by `league_id`, order by `score`. |
| **Badges** | Supabase `user_badges` | List of earned badge IDs. |

## 4. Interaction Flows
1. **Check Rank**: User opens page -> Sees current standing.
2. **View Rival**: User clicks a name in Leaderboard -> Sees public profile stats.
3. **Badge Detail**: User clicks a badge -> Modal shows description and how to earn.
