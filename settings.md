# Settings Page Plan Based On Current APIs

This document proposes the sections for the frontend settings page based on the backend APIs that currently exist.

## Goal

Build a settings page that only exposes controls we can actually support right now, and clearly marks fields that are view-only until more backend APIs are added.

## Recommended Sections

### 1. Account

Purpose:
- Core user identity and basic account info.

Items:
- `Username`
  - Editable
  - API: `PATCH /users/{id}/username`
- `Email`
  - Display only for now
  - We have lookup APIs, but no update-email API
- `GitHub-connected email`
  - Optional display-only if available from logged-in user object

Suggested UI:
- Username input
- Email read-only field
- Save button for username

Notes:
- Username is supported now.
- Email update should not be shown as editable unless we add a backend endpoint later.

### 2. Profile Privacy

Purpose:
- Control whether the user profile is publicly visible.

Items:
- `Public profile`
  - Toggle
  - API: `PATCH /users/{id}/profile-public`
- `Public profile URL preview`
  - Display only
  - Based on frontend route like `/@username`

Suggested UI:
- Toggle for public profile
- Small preview text of the public URL

Notes:
- This section is fully supported by current APIs.

### 3. Notifications & Digest

Purpose:
- Control whether users receive email digests and at what time.

Items:
- `Email digest enabled`
  - Toggle
  - API: `PATCH /users/{id}/email-opt-in`
- `Digest time`
  - Time input
  - API: `PATCH /users/{id}/digest-time`
- `Timezone`
  - Display only for now
  - No API currently exists to update timezone

Suggested UI:
- Toggle for email digest
- Time picker for digest time
- Timezone shown with helper text like "Timezone editing not available yet"

Notes:
- `digest_time` is editable today.
- `timezone` should not be editable until a backend patch route exists.

### 4. Integrations

Purpose:
- Show which coding platforms are connected and let users connect/disconnect them.

Items:
- `GitHub`
  - Status: connected / not connected
  - API to read: `GET /users/{id}/integrations/active`
  - Connect flow: `GET /auth/github/login`
  - Disconnect flow: `DELETE /integrations/{integrationId}`
- `LeetCode`
  - Status: connected / not connected
  - API to read: `GET /users/{id}/integrations/active`
  - Add flow: `POST /integrations`
  - Disconnect flow: `DELETE /integrations/{integrationId}`
- `Codeforces`
  - Status: connected / not connected
  - API to read: `GET /users/{id}/integrations/active`
  - Add flow: `POST /integrations`
  - Disconnect flow: `DELETE /integrations/{integrationId}`

Suggested UI:
- One card per platform
- Show:
  - platform name
  - connected handle
  - connected status
  - connect / reconnect button
  - disconnect button

Notes:
- GitHub should use the OAuth login flow, not just manual handle entry.
- LeetCode and Codeforces can use manual handle-based forms for now.

### 5. Data & Sync

Purpose:
- Let the user manually trigger activity sync and understand current sync state.

Items:
- `Sync today`
  - Button
  - API: `POST /users/{id}/aggregate`
- `Sync specific date`
  - Date picker + button
  - API: `POST /users/{id}/aggregate?date=YYYY-MM-DD`
- `Connected integrations`
  - Display using `GET /users/{id}/integrations/active`
- `Last activity for selected day`
  - API: `GET /users/{id}/activities?date=YYYY-MM-DD`

Suggested UI:
- Primary "Sync Today" button
- Secondary date picker for manual backfill
- Lightweight sync status area

Notes:
- This section is very useful for debugging and user trust.
- It can also help recover from missing heatmap data without waiting for scheduler jobs.

### 6. Activity Inspector

Purpose:
- Show the per-day activity details behind the heatmap.

Items:
- `Daily activity list`
  - API: `GET /users/{id}/activities?date=YYYY-MM-DD`
- `Daily totals`
  - API: `GET /users/{id}/metrics?date=YYYY-MM-DD`

Suggested UI:
- This can be part of settings, but it is probably better as:
  - a modal from the heatmap
  - or a "Recent activity" subpanel

Notes:
- This is available now, but it feels more like account analytics than classic settings.
- If placed in settings, keep it as a secondary section.

## Best Settings Page Structure

If we want a clean settings page right now, the best order is:

1. Account
2. Profile Privacy
3. Notifications & Digest
4. Integrations
5. Data & Sync

`Activity Inspector` is optional in settings and may fit better on the profile/dashboard side.

## What Is Fully Supported Right Now

These can be implemented immediately:

- Update username
- Toggle public profile
- Toggle email digest on/off
- Update digest time
- View active integrations
- Connect GitHub via OAuth
- Add LeetCode / Codeforces integrations
- Disconnect integrations
- Trigger one-user aggregation
- Fetch daily metrics
- Fetch daily activities

## What Should Be Display-Only For Now

These should not be editable until backend support is added:

- Email
- Timezone
- Email frequency
- Password / authentication method management
- Delete account

## API Mapping Summary

### Account
- `GET /users/by-email`
- `GET /users/by-username`
- `PATCH /users/{id}/username`

### Privacy
- `PATCH /users/{id}/profile-public`

### Notifications
- `PATCH /users/{id}/email-opt-in`
- `PATCH /users/{id}/digest-time`

### Integrations
- `GET /users/{id}/integrations/active`
- `POST /integrations`
- `DELETE /integrations/{id}`
- `GET /auth/github/login`

### Sync / Activity
- `POST /users/{id}/aggregate`
- `GET /users/{id}/metrics?date=YYYY-MM-DD`
- `GET /users/{id}/metrics/range?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `GET /users/{id}/heatmap?start=YYYY-MM-DD&end=YYYY-MM-DD`
- `GET /users/{id}/activities?date=YYYY-MM-DD`

## Recommended MVP For Frontend

If you want the fastest useful settings page, build this first:

1. `Account`
   - username edit
   - email display
2. `Privacy`
   - public profile toggle
3. `Notifications`
   - email opt-in toggle
   - digest time picker
4. `Integrations`
   - GitHub connect/reconnect
   - LeetCode handle form
   - Codeforces handle form
   - disconnect actions
5. `Data & Sync`
   - sync today
   - sync selected date

That will give you a complete, API-backed settings page without inventing unsupported controls.
