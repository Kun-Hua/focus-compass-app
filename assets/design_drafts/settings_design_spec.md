# Settings Design Specification

## 1. Overview
- **Page Name**: Settings
- **Route**: `/settings`
- **Goal**: Manage account details and system preferences.
- **Style**: Cold Productivity Minimalist (Primary: `#3B82F6`, Bg: `#F9FAFB`)

## 2. Layout & Components

### 2.1 Profile Section
- **Layout**: Card style.
- **Avatar**:
    - **Visual**: Large circle (80px) centered.
    - **Action**: Click to upload/change image.
    - **Icon**: Camera overlay on hover.
- **Nickname**:
    - **Input**: Text field with "Edit" icon.
    - **Validation**: Max 20 chars.
- **Account Info**:
    - **Email**: Display text (Gray, Read-only).
    - **User ID**: Small caption (for support).

### 2.2 Preferences
- **Language**:
    - **Label**: "Language / 語言".
    - **Control**: Segmented Control [ English | 繁體中文 ].
- **Notifications**:
    - **Label**: "Daily Reminder".
    - **Control**: Toggle Switch.
    - **Sub-text**: "Remind me at 09:00 AM to plan my day."

### 2.3 About & Legal
- **List**: Simple link rows.
    - "Version 1.0.0"
    - "Terms of Service"
    - "Privacy Policy"
    - "Log Out" (Red text).

## 3. Data Sources & Logic

| UI Element | Source | Logic |
| :--- | :--- | :--- |
| **Profile** | Supabase `profiles` | Read/Update `avatar_url`, `nickname`. |
| **Settings** | LocalStorage / `profiles` | Persist language and notification prefs. |
| **Auth** | Supabase Auth | `signOut()` method. |

## 4. Interaction Flows
1. **Change Language**: User clicks "繁體中文" -> App reloads/updates context immediately.
2. **Log Out**: User clicks Log Out -> Confirm Modal -> Redirect to Login.
