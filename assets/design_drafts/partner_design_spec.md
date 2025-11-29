# Partner Design Specification

## 1. Overview
- **Page Name**: Partner
- **Route**: `/partner`
- **Goal**: Maintain 1-on-1 accountability through mutual visibility of progress.
- **Style**: Cold Productivity Minimalist (Primary: `#3B82F6`, Bg: `#F9FAFB`)

## 2. Layout & Components

### 2.1 Partner List
- **Layout**: Vertical list of cards.
- **Partner Card**:
    - **Header**:
        - **Avatar**: Circle (40px).
        - **Name**: Nickname.
        - **Status**: "Online" or "Last seen 2h ago".
    - **Metrics Row** (3 cols):
        - **Net Focus**: "32h" (vs Your "28h").
        - **Commitment**: "90%" (vs Your "85%").
        - **Honesty**: "98%" (vs Your "95%").
    - **Trend Indicator**:
        - Icon: Up/Down arrow.
        - Color: Green/Red based on week-over-week change.
    - **Action**: "Nudge" button (Send predefined notification).

### 2.2 Comparison View (Expanded)
- **Trigger**: Click on Partner Card.
- **Visual**: Side-by-side Bar Charts for key metrics.
- **Interruption Analysis**:
    - "You were interrupted mostly by 'Phone'."
    - "Partner was interrupted mostly by 'Fatigue'."

### 2.3 Privacy Settings
- **Entry**: Gear icon in top right.
- **Toggles**:
    - "Share Exact Focus Minutes" (Default: ON).
    - "Share Interruption Reasons" (Default: OFF).
    - "Allow Nudges" (Default: ON).

### 2.4 Invite Flow
- **FAB**: Floating Action Button (+) at bottom right.
- **Modal**:
    - **Search**: Input field for Email or Nickname.
    - **Result**: User card with "Invite" button.
    - **Pending Tab**: List of sent/received invitations.

## 3. Data Sources & Logic

| UI Element | Source | Logic |
| :--- | :--- | :--- |
| **Partner List** | Supabase `AccountabilityPartner` | Join with `profiles` and `FocusSessionLog`. |
| **Metrics** | RPC `get_partner_weekly` | Calculates aggregated stats for both users. |
| **Privacy** | Supabase `profiles` | JSONB column `privacy_settings`. |

## 4. Interaction Flows
1. **Compare**: User opens app -> Checks Partner tab -> Sees Partner is ahead -> Gets motivated.
2. **Invite**: User clicks + -> Searches "Alice" -> Sends Invite -> Alice accepts -> Data syncs.
