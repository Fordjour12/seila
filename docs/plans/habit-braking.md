# Habit Break Spec (V1, Implementation Ready)

This spec defines the V1 behavior for break habits and aligns with the current codebase contracts.

## 1. Scope

- Keep existing sections in habit form:
  - Mode (`build` / `break`)
  - Rhythm (cadence/frequency and time preference)
  - Intensity (difficulty/energy and target)
  - Schedule (existing start/end behavior)
- No visual redesign required for V1.

## 2. Canonical Types

Use the existing target type enum everywhere:

- `binary`
- `quantity`
- `duration`

Do not use `simple` in code or payloads.

## 3. New Fields

Add these fields for break behavior:

- `breakGoal: "quit" | "limit"`
- `breakMetric?: "times" | "minutes"` (required when `breakGoal = "limit"`)

Notes:

- `kind` already exists and must remain `"build" | "break"`.
- `targetType`, `targetValue`, `targetUnit` continue to be used.

## 4. Form Rules

### Build (`kind = "build"`)

- Show target type selector (`binary`, `quantity`, `duration`).
- `binary`: no target inputs.
- `quantity`: require value and optional/free unit.
- `duration`: require value, unit fixed to `minutes`.

### Break (`kind = "break"`)

- Show `breakGoal` selector (`Quit`, `Limit`).
- If `breakGoal = "quit"`:
  - No target inputs shown.
  - Persist as:
    - `targetType = "quantity"`
    - `targetValue = 0`
    - `targetUnit = "times"`
- If `breakGoal = "limit"`:
  - Show `breakMetric` selector (`times`, `minutes`).
  - Show limit value input.
  - Persist as:
    - `targetType = breakMetric === "minutes" ? "duration" : "quantity"`
    - `targetValue = <limit number>`
    - `targetUnit = breakMetric === "minutes" ? "minutes" : "times"`

## 5. Validation Rules

### Build

- `name` is required.
- If `targetType` is `quantity` or `duration`, `targetValue > 0` is required.
- If `targetType = "duration"`, unit must be `minutes`.

### Break

- `breakGoal` is required.
- `quit` requires no extra input.
- `limit` requires:
  - `breakMetric` selected.
  - `targetValue >= 1`.
- For `breakMetric = "minutes"`, unit must be `minutes`.

## 6. Logging Behavior

### Build

- `binary`: tap to complete.
- `quantity` / `duration`: prompt numeric value, then evaluate completion.

### Break

- `quit`: action label `Slip +1`.
- `limit` + `times`: action label `+1`.
- `limit` + `minutes`: action label `Log minutes`.

Input mapping for break logs:

- `quit`: log `value = 1` per slip event.
- `limit` + `times`: log `value = 1` per event; multiple taps can accumulate for day total.
- `limit` + `minutes`: log entered minutes as `value`.

## 7. Completion Semantics

Define completion by day:

- Build habits:
  - `binary`: complete when marked complete.
  - `quantity` / `duration`: complete when `dailyTotal >= targetValue`.
- Break habits:
  - `quit`: complete when `dailyTotal <= 0` (no slips).
  - `limit`: complete when `dailyTotal <= targetValue`.

`dailyTotal` is sum of all values logged for that habit on that day.

## 8. Backend Contract Changes

### Schema

Habits table:

- add `breakGoal?: "quit" | "limit"`
- add `breakMetric?: "times" | "minutes"`

Habit logs table:

- keep numeric `value` field.
- ensure aggregation support for multiple break events/day.

### Commands

- `createHabit` / `updateHabit`:
  - accept and validate `breakGoal`, `breakMetric`.
  - normalize break payload to canonical `targetType/targetValue/targetUnit` mapping above.
- `logHabit`:
  - support build and break evaluation using completion semantics above.
  - for break habits, do not force `value >= targetValue` logic.

### Queries

- today/query responses must return:
  - `kind`, `targetType`, `targetValue`, `targetUnit`, `breakGoal`, `breakMetric`, `todayValue`.
- day/status logic must use break-specific completion rules.

## 9. Native App Contract Changes

- Habit form (`add`/`edit`) must show break controls only when `kind = "break"`.
- Habit card and detail actions must render break-specific action labels.
- Quantity/duration input prompt should be reused for:
  - build value logging
  - break `minutes` logging

## 10. Compatibility and Migration

- Existing habits without `breakGoal`:
  - if `kind = "break"` and `targetValue === 0`, treat as `breakGoal = "quit"`.
  - else if `kind = "break"`, treat as `breakGoal = "limit"` with metric inferred from target type.
- Existing build habits continue unchanged.

## 11. Done Criteria

- [ ] Form supports break goal + metric.
- [ ] Break habits persist canonical target mapping.
- [ ] Break logging actions match goal/metric.
- [ ] Completion status uses `<=` for break and `>=` for build.
- [ ] Today/detail UI shows correct break status and actions.
- [ ] Existing habits remain compatible without manual migration.
