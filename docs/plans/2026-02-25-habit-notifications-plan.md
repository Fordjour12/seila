# Habit Notifications Plan (Draft)

## Goal
Deliver reliable, respectful habit reminders that increase follow-through without creating notification fatigue.

## Scope
- Habit reminder scheduling per habit.
- Quiet hours and global notification controls.
- Timezone-safe scheduling.
- Delivery telemetry and adaptive retry rules.

Out of scope for this phase:
- AI-generated reminder copy.
- Cross-device push token conflict resolution beyond last-write-wins.

## Product Requirements
- Users can set reminder time for each habit.
- Users can enable/disable reminders per habit and globally.
- Quiet hours suppress notifications.
- Missed reminders can be retried once (configurable).
- Break habits can use different reminder tone/wording.
- Users can snooze a reminder directly from notification action.

## Data Model Changes
- `habits`:
  - `remindersEnabled?: boolean`
  - `reminderTimeLocal?: string` (`HH:mm`)
  - `reminderChannel?: "push" | "in_app"`
- `notificationSettings` (new table):
  - `enabled: boolean`
  - `quietHoursEnabled: boolean`
  - `quietStartLocal: string`
  - `quietEndLocal: string`
  - `timezone: string`
  - `updatedAt: number`
- `notificationDeliveries` (new table):
  - `habitId`
  - `scheduledFor`
  - `sentAt?`
  - `status: "scheduled" | "sent" | "suppressed_quiet_hours" | "failed" | "snoozed"`
  - `failureReason?`

## Backend Plan (Convex)
1. Add schema tables/fields above.
2. Add query: `queries/habitNotificationQueue.ts` (fetch due reminders).
3. Add action: `actions/processHabitNotifications.ts`.
4. Add command: `commands/habits/snoozeReminder.ts`.
5. Add command: `commands/habits/setReminderPreferences.ts`.
6. Add command: `commands/settings/setNotificationSettings.ts`.
7. Add cron every 5 minutes to process due reminders.

## Scheduling Rules
- Resolve day boundaries using saved user timezone.
- Only schedule reminders for active, scheduled habits.
- Do not schedule archived or paused habits.
- Suppress sends during quiet hours.
- Retry at most once after 15 minutes if delivery failed.

## Client Plan (Expo)
1. Habit add/edit: reminder toggle + time picker.
2. Settings page: global enable + quiet hours + timezone display.
3. Notification action handlers:
   - `Done`
   - `Snooze 1h`
   - `Skip Today`
4. In-app timeline section showing recent reminder sends/suppressions.

## Metrics
- Delivery success rate.
- 24h completion after reminder.
- Snooze rate.
- Quiet-hours suppression count.
- Weekly opt-out rate.

## Rollout Strategy
1. Phase 1: Internal/dev only (`enabled=false` default).
2. Phase 2: 10% users, monitor failure and opt-out.
3. Phase 3: 100% rollout with retry tuning.

## Risks and Mitigations
- Timezone drift:
  - Recompute local schedule when timezone changes.
- Notification fatigue:
  - Enforce minimum spacing and quiet hours.
- Duplicate sends:
  - Idempotency key per `habitId + dayKey + reminderTime`.

## Test Plan
- Unit tests for scheduling windows and quiet-hours suppression.
- Integration tests for cron -> queue -> delivery status updates.
- End-to-end tests for snooze/done/skip actions.

