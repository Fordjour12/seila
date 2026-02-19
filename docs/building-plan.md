# Life OS — Development Plan

> Single developer. Single user. No deadlines, no sprints — just a sequence of things that need to exist before the next thing can.

---

## How to Read This Plan

Each phase has a clear **exit condition** — the thing that must be true before moving on. Phases are not time-boxed. A phase is done when its exit condition is met, not when a calendar says so.

Within each phase, tasks are ordered by dependency. Do them in order.

---

## Phase 0 — Foundation
*The repo exists, the tools work, and you can write a line of code that touches the database.*

Status: `[ ] Done`

### Tasks

**0.1 Monorepo bootstrap**
- [x] Init repo with Bun + Turborepo
- [x] Configure `turbo.json` with `build`, `dev`, `lint`, `test` pipelines
- [x] Add `.gitignore`, `bunfig.toml`, root `package.json` with workspace glob

**0.2 Package scaffold**
- [x] Create `apps/native` — bare Expo project with Expo Router
- [x] Create `packages/backend` — empty Convex project
- [x] Create `packages/domain-kernel` — empty TS lib with `tsconfig.json`
- [x] Create `packages/env` — Zod-based env parser, typed exports
- [x] Create `packages/ui` — stub with design tokens only (colors, spacing, typography)

**0.3 Convex setup**
- [x] Init Convex project, link to `packages/backend`
- [x] Configure `convex/schema.ts` with the `events` table (bare minimum: `type`, `occurredAt`, `idempotencyKey`, `payload`)
- [ ] Confirm Convex dev server runs and a test mutation writes to the DB

**0.4 Expo + Convex wiring**
- [x] Install `convex` client in `apps/native`
- [x] Wrap app in `ConvexProvider`
- [x] Write a single test query that reads from `events` and renders the count on screen
- [ ] Confirm hot reload works end-to-end

**0.5 Domain kernel skeleton**
- [x] Define `LifeEvent<T, P>` base type
- [x] Define `Command` base type with `idempotencyKey`
- [x] Write the trace harness: `given(events).when(command).expect(state)`
- [x] Add one passing test (even a trivial one) to confirm the harness works

### Exit condition
Running `bun dev` starts both Expo and Convex. A screen renders data from the database. The kernel has at least one passing test.

Status: `[ ] Exit condition not fully verified in sandbox`

---

## Phase 1 — Habits Module
*The core loop works for one module end-to-end: command in, event written, state derived, UI updated.*

Status: `[ ] Done`

### Tasks

**1.1 Kernel: Habits**
- [x] Define `HabitCommand` union (`createHabit`, `logHabit`, `skipHabit`, `snoozeHabit`, `archiveHabit`)
- [x] Define `HabitEvent` union (`habit.created`, `habit.completed`, `habit.skipped`, `habit.snoozed`, `habit.archived`)
- [x] Write `habitReducer(state, event) => state`
- [x] Write `HabitState` type (`activeHabits`, `todayLog`)
- [x] Write trace tests for each event type — including the shame-free invariant (no missed-habit state)

**1.2 Backend: Habits**
- [x] Add `habits` table to Convex schema
- [x] Write `commands/createHabit.ts` mutation — validates input, deduplicates by `idempotencyKey`, appends event, runs reducer, writes derived state
- [x] Write `commands/logHabit.ts`, `skipHabit.ts`, `snoozeHabit.ts`, `archiveHabit.ts`
- [x] Write `queries/todayHabits.ts` — reads derived state for today
- [x] Write `queries/habitHistory.ts` — reads event log filtered to habit events

**1.3 UI: Habits**
- [x] Home screen with today's habit list
- [x] Tap to complete, swipe to skip, long-press for snooze
- [x] Add habit sheet (name, cadence, anchor, difficulty)
- [x] Archive confirmation (no "delete" language)
- [x] No streak display anywhere

### Exit condition
You can create a habit, log it, skip it, and snooze it. The UI updates reactively. Nothing in the UI communicates failure or missed state.

Status: `[ ] Exit condition not yet manually verified on simulator/device`

---

## Phase 2 — Check-in Module
*The primary signal input for the pattern engine exists and is usable daily.*

### Tasks

**2.1 Kernel: Check-in**
- Define `CheckinCommand` union (`submitCheckin`, `updateCheckin`)
- Define `CheckinEvent` union (`checkin.submitted`, `checkin.updated`)
- Define `CheckinState` — `recentCheckins[]`, `moodTrend`, `energyTrend`
- Write `checkinReducer`
- Write trace tests including weekly check-in variant

**2.2 Backend: Check-in**
- Add `checkins` table to schema
- Write `commands/submitCheckin.ts` — validates mood (1–5), energy (1–5), flags array, optional note
- Write `queries/recentCheckins.ts`
- Write `queries/moodTrend.ts` — last 14 days of mood/energy averaged

**2.3 UI: Check-in**
- Daily check-in sheet — emoji mood picker, energy slider, flag chips, optional note
- Weekly check-in variant with 3 scaffolded text prompts
- Home screen widget showing last check-in (mood + energy only, no note)
- Check-in history view (calendar or timeline, no streak coloring)

### Exit condition
You complete a daily check-in. You complete a weekly check-in. The home screen reflects recent mood/energy without any judgment framing.

---

## Phase 3 — Tasks Module
*Lightweight capture exists. The Focus view enforces the 3-item limit.*

### Tasks

**3.1 Kernel: Tasks**
- Define `TaskCommand` union (`captureTask`, `focusTask`, `deferTask`, `completeTask`, `abandonTask`)
- Define `TaskEvent` union
- Define `TaskState` — `inbox[]`, `focus[]` (max 3), `deferred[]`
- Write reducer with hard 3-item Focus invariant
- Write trace tests — including the "fourth item rejected" case

**3.2 Backend: Tasks**
- Add `tasks` table to schema
- Write all task mutations with idempotency
- Write `queries/todayFocus.ts`
- Write `queries/inbox.ts`

**3.3 UI: Tasks**
- Quick capture input (always accessible, one tap)
- Inbox view with triage actions (Focus / Later / Done)
- Today Focus view — 3 slots, read-only if full
- "Inbox has items, Focus is empty" nudge (passive, not alarming)

### Exit condition
You can capture a task from anywhere in the app. The Focus view never shows more than 3 items. Attempting to add a fourth prompts a triage choice, not an error.

---

## Phase 4 — Policy Engine
*The system can proactively suggest things. Not many things — the right things.*

Status: `[ ] Done`

### Tasks

**4.1 Kernel: Policy engine**
- [x] Define `Suggestion` type
- [x] Define `PolicyFn = (state: DomainState) => Suggestion[]`
- [x] Write `runPolicies(state, activePolicies) => Suggestion[]` with 3-item sparsity cap
- [x] Implement all 7 policies: `MorningHabitPrompt`, `CheckinPrompt`, `WeeklyReviewReady`, `EnvelopeApproaching`, `PatternSurface`, `FocusEmpty`, `RestPermission`
- [x] Write tests for sparsity cap — only 3 surface even if 5 trigger

**4.2 Backend: Policy runner**
- [x] Wire `runPolicies` into a Convex scheduled action (runs every hour)
- [x] Write `suggestions` table to schema
- [x] Write `queries/activeSuggestions.ts` — returns max 3, ordered by priority

**4.3 UI: Suggestions**
- [x] Suggestion card component — headline, subtext, optional one-tap action, dismiss
- [x] Home screen suggestion strip (max 3, horizontal scroll or stack)
- [x] Dismiss writes a `suggestion.dismissed` event

### Exit condition
Go a few hours without checking in. A suggestion appears. It is one of three maximum. Dismissing it makes it go away. Nothing about the suggestion is alarming or shame-inducing.

Status: `[ ] Exit condition not yet manually verified on simulator/device`

---

## Phase 5 — Finance Module
*Manual spending awareness is live. The envelope model works.*

Status: `[ ] Done`

### Tasks

**5.1 Kernel: Finance**
- [x] Define all Finance command and event types
- [x] Define `FinanceState` — `envelopes[]`, `recentTransactions[]`, `inbox[]`
- [x] Write `financeReducer`
- [x] Write trace tests including the import → confirm flow

**5.2 Backend: Finance**
- [x] Add `envelopes` and `transactions` tables to schema
- [x] Write all finance mutations
- [x] Write `queries/envelopeSummary.ts`
- [x] Write `queries/spendingTrend.ts`
- [x] Write `queries/transactionInbox.ts`
- [x] Wire `EnvelopeApproaching` policy to real finance state

**5.3 UI: Finance**
- [x] Envelope list view with spend vs ceiling progress (no red/green judgment coloring)
- [x] Log transaction sheet — amount, envelope picker, optional note
- [x] Spending trend view — week-over-week, neutral framing
- [x] Transaction inbox (for future import flow)

### Exit condition
You log a transaction. It appears in the correct envelope. The envelope summary reflects it. Approaching a ceiling produces a suggestion, not an alert.

Status: `[ ] Exit condition not yet manually verified on simulator/device`

---

## Phase 6 — Pattern Awareness
*The AI layer is live. It observes, surfaces, and shuts up.*

Status: `[x] Done`

### Tasks

**6.1 Pattern detection action**
- [x] Write `actions/detectPatterns.ts` — reads last 30 days of cross-module events, runs correlation logic
- [x] Implement at minimum: Mood × Habit, Energy × Check-in timing, Spending × Mood correlations
- [x] Apply confidence threshold before emitting a pattern candidate
- [x] Apply tone policy — reject negative framing before surfacing

**6.2 Pattern kernel layer**
- [x] Define `Pattern` type with `type`, `correlation`, `confidence`, `headline`, `subtext`
- [x] Define pattern events (`pattern.detected`, `pattern.surfaced`, `pattern.dismissed`, `pattern.pinned`, `pattern.expired`)
- [x] Write `patternReducer`
- [x] Write 30-day TTL expiry logic

**6.3 Backend: Patterns**
- [x] Add `patterns` table to schema
- [x] Schedule `detectPatterns` action to run nightly
- [x] Write `queries/activePatterns.ts` — max 3, ordered by confidence
- [x] Write `commands/dismissPattern.ts`, `pinPattern.ts`

**6.4 UI: Patterns**
- [x] Pattern card — headline, subtext, dismiss / pin actions
- [x] Pin saves to the top of the patterns list
- [x] Dismissed patterns disappear with no record shown to user

### Exit condition
After a week of usage, at least one pattern surfaces. It is framed positively or neutrally. Dismissing it removes it silently. Pinning it persists it past the 30-day TTL.

Status: `[ ] Exit condition not yet manually verified on simulator/device`

---

## Phase 7 — Weekly Review
*The weekly loop closes. The system can reflect.*

Status: `[x] Done`

### Tasks

**7.1 AI summary action**
- [x] Write `actions/generateWeeklySummary.ts`
- [x] Reads past 7 days of events across all modules
- [x] Produces: max 5 bullets, one bright spot, one worth-noticing observation
- [x] No recommendations in the summary — those come in Intentions only
- [x] Apply tone policy before returning

**7.2 Kernel: Weekly Review**
- [x] Define all review command and event types
- [x] Define `ReviewState` — `currentReview`, `reviewHistory[]`
- [x] Write `reviewReducer`
- [x] Write trace tests for each phase (Look Back → Reflect → Intentions → Close)

**7.3 Backend: Weekly Review**
- [x] Add `reviews` table to schema
- [x] Write all review mutations
- [x] Wire `WeeklyReviewReady` policy to trigger Sunday evenings
- [x] Write `queries/currentReview.ts`, `queries/reviewHistory.ts`

**7.4 UI: Weekly Review**
- [x] 4-phase flow: Look Back → Reflect → Intentions → Close
- [x] Look Back: AI summary card, read-only
- [x] Reflect: 3 fixed prompts + optional AI prompt (skippable)
- [x] Intentions: free-text, 1–3 items
- [x] Close: summary card saved, gentle confirmation

### Exit condition
You complete a full weekly review end-to-end. The AI summary is accurate and non-judgmental. Skipping the review is as easy as doing it.

Status: `[ ] Exit condition not yet manually verified on simulator/device`

---

## Phase 8 — Hard Mode
*You can hand the wheel to the AI for a defined window.*

Status: `[x] Done`

### Tasks

**8.1 Kernel: Hard Mode**
- [x] Define `HardModeSession`, `HardModeScope`, `HardModeConstraint`, `HardModePlan`, `PlannedItem` types
- [x] Define all Hard Mode events
- [x] Write `hardModeReducer`
- [x] Write constraint validation logic — preference anchors checked before every planned item
- [x] Write flag processing logic — `not_now`, `not_aligned`, `too_much` each produce different state mutations
- [x] Write low-energy failsafe — mood/energy ≤ 2 drops plan to 1 habit, 1 task, 1 check-in
- [x] Write trace tests for all flag types and the failsafe

**8.2 AI planner action**
- [x] Write `actions/generateHardModePlan.ts`
- [x] Reads current scope, constraints, and recent state
- [x] Produces a `HardModePlan` with conservative item count
- [x] Respects all `HardModeConstraint` records — violations are kernel errors, not soft skips
- [x] Schedules `rationale` strings (max 80 chars) for each item
- [x] Low-confidence items scheduled last, first to drop

**8.3 Backend: Hard Mode**
- [x] Add `hardModeSessions` table to schema
- [x] Write `commands/activateHardMode.ts` — validates scope and window, writes session
- [x] Write `commands/flagItem.ts` — processes flag type, rolls back planned item, emits correction event
- [x] Write `commands/deactivateHardMode.ts` — instant, no confirmation
- [x] Write `commands/extendHardMode.ts` — requires explicit opt-in, not auto-renewal
- [x] Wire daily plan generation to trigger at start of each Hard Mode day
- [x] Write `queries/currentHardModePlan.ts`
- [x] Write `queries/hardModeSession.ts`

**8.4 UI: Hard Mode**
- [x] Activation sheet — scope picker (module toggles), duration picker, constraint builder
- [x] Persistent mode indicator — subtle, not alarming
- [x] Plan view — read-only card sequence, not a checklist
- [x] Long-press reveals `rationale`
- [x] Flag sheet — three options: Not now / Not aligned / Too much
- [x] Exit — one tap, no confirmation dialog, no summary of flags
- [x] "Crisis override" gesture — clears all plans for the day, no explanation required

### Exit condition
You activate Hard Mode for one day scoped to Habits and Tasks. The AI fills your Focus and schedules your habits. You flag one item. It responds correctly to the flag type. You exit Hard Mode. Nothing asks you why.

Status: `[ ] Exit condition not yet manually verified on simulator/device`

---

## Phase 9 — Polish & Depth
*The system feels like yours.*

### Tasks

**9.1 Audit log**
- Event log viewer — chronological, filterable by module
- Export events as JSON (full log or date range)

**9.2 Cross-module dashboard**
- Home screen summary: mood trend sparkline, habit completion rate (neutral framing), current envelope health, active patterns
- Weekly at-a-glance card (generated from last review)

**9.3 Notification personalization**
- Per-policy notification settings — on/off, preferred time window
- Quiet hours configuration
- Notification tone always neutral (no urgency language)

**9.4 Plaid integration (Finance)**
- Link bank account
- Transaction import flow — inbox → user confirmation → event log
- AI categorization suggestions — user confirms, never auto-applied

**9.5 Offline resilience**
- Command queue for offline writes
- Sync on reconnect with idempotency key deduplication

### Exit condition
The app feels complete. Every module works. Hard Mode is stable. The event log is readable and exportable. You would trust this system to run your days.

---

## What's Not in This Plan

These are explicit non-goals. They will not be built.

- Multi-user support
- Sharing or social features
- Streak tracking of any kind
- Gamification (points, badges, levels)
- Push notifications with urgency language
- AI that writes to the event log without user confirmation
- A "missed" or "failed" state anywhere in the UI

---

*Build in order. Each phase is a working system, not a partial one. Ship nothing that isn't honest.*
