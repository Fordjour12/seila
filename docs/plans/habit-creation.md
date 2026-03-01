# Habit Creation Spec (V1)

This document defines the V1 habit system for creating, tracking, and reviewing habits.
It is intentionally constrained to keep implementation simple and behavior predictable.

## Product Principles

- Low friction
- Identity aligned
- Energy aware
- Shame free
- Analytics ready
- No gamification noise

## 1. Habit Creation Form

Implement only the fields listed below.

### Required Fields

- `name` (string)
- `targetType` (`binary` | `quantity` | `duration`)
- `frequencyType` (`daily` | `weekly`)

### Optional Fields

- `identityTags` (multi-select)
  - `Health`
  - `Faith`
  - `Learning`
  - `Discipline`
  - `Finance`
  - `Relationships`
  - `Custom`
- `energyLevel`
  - `low` (default)
  - `medium`
  - `high`
- `timePreference`
  - `morning`
  - `afternoon`
  - `evening`
  - `flexible` (default)

### Frequency Rules

For `daily`:

- Every day, or
- Every X days (`everyXDays`: integer)

For `weekly`:

- Weekday multi-select (`Mon` through `Sun`)
- At least one day must be selected

### Target Rules

For `binary`:

- No numeric value required

For `quantity`:

- `targetValue` (number, required)
- `targetUnit` (string, optional)

For `duration`:

- `targetValue` (number, required)
- Unit is fixed to minutes in V1
- No custom duration units in V1

## 2. Data Model (Locked for V1)

```ts
type Habit = {
  id: string;
  name: string;

  identityTags: string[];

  frequencyType: "daily" | "weekly";
  frequencyConfig: {
    everyXDays?: number;
    weekdays?: number[]; // 0-6
  };

  targetType: "binary" | "quantity" | "duration";
  targetValue?: number;
  targetUnit?: string;

  energyLevel: "low" | "medium" | "high";
  timePreference: "morning" | "afternoon" | "evening" | "flexible";

  startDate: string;
  pausedAt?: string;
  archivedAt?: string;
};
```

Notes:

- Do not store a `streak` field.
- Streaks are derived from logs.

## 3. Logging System

```ts
type HabitLog = {
  habitId: string;
  date: string;
  value?: number; // quantity/duration only
  completed: boolean;
};
```

### Completion Rules

For `binary`:

- A tap marks `completed = true`

For `quantity`:

- `value` is required
- `completed = value >= targetValue`

For `duration`:

- `value` is required
- `completed = value >= targetValue`

## 4. Today View Behavior

Today view must:

1. Show only habits due today.
2. Sort by `timePreference`, then `energyLevel` (`low` to `high`).

### Low Energy Mode

When low energy mode is active:

- Show low-energy habits first.
- Collapse high-energy habits.

## 5. Missed Habit Behavior

If a habit is missed:

- Do not use red warning styles.
- Do not show "0 streak".
- Do not break layout or card state.

Use:

- Neutral `Missed` state
- Small neutral indicator
- Optional recovery suggestion

## 6. Gentle Return Logic

Trigger:

- User inactive for 3 or more days

System suggestion:

- Pick the smallest low-energy habit due today.

Selection criteria:

- `energyLevel = low`
- `targetType = binary`
- `archivedAt` is not set
- Habit is due today

## 7. Analytics (V1)

Compute:

- Completion rate (`7d`, `30d`)
- Average completion by energy level
- Identity-tag completion imbalance

Example insight:

`Health habits are 82% complete. Learning habits are 40% complete.`

## 8. UI Constraints

Do not include:

- Confetti
- Flame streaks
- Shame-oriented red text
- Rewards
- XP systems
- Social leaderboards

## 9. V1 Limits

- Maximum 15 active habits
- Maximum 3 high-energy habits
- Manual logging only (no auto-complete)
- No templates in V1

## 10. Completion Checklist

- [ ] Habit creation supports all required and optional fields
- [ ] Habit logs are created correctly for all target types
- [ ] Today view filters only due-today habits
- [ ] Today view sorting matches time then energy
- [ ] Missed state is neutral and non-shaming
- [ ] Gentle return suggests smallest low-energy binary habit due today
- [ ] 7-day analytics are computed
- [ ] No `streak` is stored in the database
