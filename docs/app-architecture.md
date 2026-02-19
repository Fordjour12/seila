# Life OS
### Personal Recovery-First Operating System — Architecture, Modules & Design Specification `v2.1`

> **Single-user system.** This is not a product. It is a personal tool built for one person. There is no multi-tenancy, no user table, no auth complexity, no onboarding flow. Every design decision optimizes for the owner's experience exclusively.

---

## Product Principles

> The values baked into every design decision.

| | Principle |
|---|---|
| 🛡️ | **Shame is a bug.** No streaks, no failure states — only progress events. |
| 🤝 | **AI proposes; humans decide.** No mutation happens without explicit user command. |
| 📜 | **Events are source of truth.** State is always derived — never stored directly. |
| 🌿 | **Suggestions stay sparse.** 1–3 visible proposals at a time, never a to-do avalanche. |
| 😴 | **Rest is a valid state.** The app does nothing unless the user wants it to. |
| 🔒 | **Privacy by design.** Sensitive data stays on-device or encrypted at rest. |
| 🎛️ | **Surrender is a valid strategy.** Hard Mode lets the AI architect your plans — you flag, it learns. |

---

## Architecture

Life OS is built on a strict event-driven loop. All state is derived from an immutable event log. No component writes derived state directly — it flows from commands through validation into events, then outward to queries.

### Command Loop

| Step | Action |
|------|--------|
| ① | UI dispatches a **Command** with an `idempotencyKey` |
| ② | Convex kernel validates input and authenticates the user |
| ③ | Backend deduplicates by `idempotencyKey`, appends **Event(s)** to the log |
| ④ | **Reducers** derive current `DomainState` from the full event stream |
| ⑤ | **Policy engine** generates bounded Suggestions (max 3 visible at once) |
| ⑥ | UI receives live updates via Convex reactive queries |

### Monorepo Structure

Built with **Bun + Turborepo** for fast, cache-aware builds across all packages.

| Package / App | Role |
|---|---|
| `apps/native` | Expo React Native client — Expo Router, Uniflow, HeroUI Native |
| `packages/backend` | Convex backend — auth, commands, queries, policies, AI actions |
| `packages/domain-kernel` | Canonical domain primitives: types, reducers, policy engine, test harness |
| `packages/env` | Shared environment parsing (Zod schemas, typed access) |
| `packages/ui` | Shared design tokens, component primitives, theming |

---

## Kernel Architecture

The kernel is the single source of behavioral truth. It is **pure TypeScript** — no side effects, no network calls, no Convex dependencies. This makes it fully testable and portable across environments.

### Layers

| Layer | Responsibility |
|---|---|
| **Commands** | Typed intents from the UI. Validated before anything is written. |
| **Events** | Immutable facts appended to the log. Never deleted or mutated. |
| **Reducers** | Pure functions: `(State, Event) => State`. Derive all domain state. |
| **Policies** | Read-only rules that emit Suggestions. Never mutate state. |
| **Trace / Harness** | Test utilities to replay event sequences and assert on outcomes. |

> **Invariant:** The kernel has zero knowledge of Convex, HTTP, or device APIs. The Convex layer (`packages/backend/convex/kernel`) is an orchestration adapter — it calls kernel functions and handles persistence.

### Event Schema Convention

Every event follows a consistent shape, enabling generic replay tools and audit logs:

```ts
type LifeEvent<T extends string, P> = {
  type: T;              // e.g. "habit.completed"
  occurredAt: number;   // ms epoch
  idempotencyKey: string;
  payload: P;
}
```

---

## Modules

Six first-class capability domains. Each module is a self-contained slice of kernel + backend + UI, sharing the same command/event/reducer pattern and plugging into the policy engine without coupling to each other.

| # | Module | Purpose | Key Commands | Key Queries |
|---|---|---|---|---|
| 1 | **Habits** | Flexible routines without streak shame | `logHabit`, `skipHabit`, `snoozeHabit` | `todayHabits`, `habitHistory` |
| 2 | **Check-in** | Daily/weekly mood + energy snapshots | `submitCheckin`, `updateCheckin` | `recentCheckins`, `moodTrend` |
| 3 | **Finance** | Spending awareness, not judgment | `logTransaction`, `setEnvelope`, `linkAccount` | `envelopeSummary`, `spendingTrend` |
| 4 | **Patterns** | AI-detected behavioral correlations | `dismissPattern`, `pinPattern` | `activePatterns`, `patternHistory` |
| 5 | **Weekly Review** | Structured reflection with AI scaffolding | `startReview`, `submitReview`, `addNote` | `currentReview`, `reviewHistory` |
| 6 | **Tasks** | Lightweight capture & triage (no overload) | `captureTask`, `completeTask`, `deferTask` | `todayFocus`, `inbox` |

---

## Module 1: Habits

*Flexible routines without shame.*

Habits are the foundational module — the primary daily touchpoint and seed data for pattern detection. The design avoids streak-based gamification entirely.

### Domain Model

| Field | Type | Notes |
|---|---|---|
| `id` | `Id<"habits">` | Convex document ID |
| `name` | `string` | Label |
| `cadence` | `Cadence` | `daily \| weekdays \| custom days` |
| `anchor` | `TimeOfDay?` | `morning \| afternoon \| evening \| anytime` |
| `difficulty` | `Difficulty?` | `low \| medium \| high` — informs policy weighting |
| `archivedAt` | `number?` | Soft delete via archive event |

### Events

- `habit.created` — new habit definition added
- `habit.completed` — user logged a completion
- `habit.skipped` — user explicitly skipped (counts as awareness, not failure)
- `habit.snoozed` — deferred to a specific time
- `habit.archived` — soft-removed from active list

> **Shame-free Design Rule:** A "missed" habit emits no event and leaves no visible gap. The absence of a `completion` event is not displayed negatively. Skips are celebrated as intentional choices.

---

## Module 2: Check-in

*Daily + weekly self-awareness.*

Check-ins are brief, low-friction snapshots of how a person is doing. They are the primary input signal for the pattern awareness engine.

### Schema

| Field | Type | Description |
|---|---|---|
| `mood` | `1–5 scale` | Emoji-anchored (😞 → 😊) |
| `energy` | `1–5 scale` | Low to high energy level |
| `flags` | `string[]` | Quick tags: anxious, grateful, overwhelmed, calm... |
| `note` | `string?` | Optional free-text — private by default |
| `type` | `daily \| weekly` | Daily is brief; weekly prompts reflection questions |

### Weekly Check-in

Once per week, a structured prompt appears with 3 scaffolded questions:

1. What felt good this week?
2. What felt hard?
3. What do I want to carry into next week?

The AI may suggest an optional fourth question based on recent patterns, but the user can skip it entirely.

---

## Module 3: Finance

*Spending awareness, not judgment.*

Finance in Life OS is not a budgeting app. It is an awareness layer — helping the user notice patterns in their relationship with money without shame, urgency, or optimization pressure.

> **Key Principle:** "You spent more on takeout this week" is awareness. "You need to cut back" is judgment. Life OS only delivers the former.

### Envelopes

Envelopes are flexible spending buckets — not rigid budget categories. A user can have "eating out", "self-care", and "unexpected" envelopes, each with a soft monthly ceiling.

| Field | Type | Notes |
|---|---|---|
| `name` | `string` | User-defined label |
| `softCeiling` | `number?` | Optional monthly awareness threshold |
| `emoji` | `string?` | Visual identifier |
| `isPrivate` | `boolean` | Hides from summaries if sensitive |

### Transactions

| Field | Type | Notes |
|---|---|---|
| `amount` | `number (cents)` | Always stored as integer cents |
| `envelopeId` | `Id<"envelopes">?` | Optional — can be uncategorized |
| `source` | `manual \| imported` | AI never creates transactions |
| `merchantHint` | `string?` | For pattern matching — not required |
| `note` | `string?` | User-added context |

### Account Linking (Optional)

Users can optionally connect a Plaid-linked bank account. Imported transactions appear in an **inbox requiring user confirmation** before they become part of the event log. AI never auto-categorizes — it suggests and the user confirms.

### Events

- `finance.envelopeCreated`
- `finance.transactionLogged`
- `finance.transactionImported` — staged, awaiting confirmation
- `finance.transactionConfirmed` — user accepted an import
- `finance.transactionVoided`
- `finance.envelopeCeilingUpdated`

### Queries

- `envelopeSummary(month)` — spending per envelope vs ceiling
- `spendingTrend(weeks)` — week-over-week totals
- `transactionInbox` — imported transactions awaiting confirmation
- `uncategorizedTransactions` — transactions without an envelope

---

## Module 4: Pattern Awareness

*AI-detected behavioral correlations.*

Pattern Awareness is the AI layer of Life OS. It observes cross-module signals and surfaces meaningful correlations — without judgment, without urgency, and with strict sparsity limits.

### How Patterns Work

A pattern is a statistically notable correlation between two or more event streams, surfaced when it crosses a confidence threshold and is likely to be *useful* — not just interesting.

| Pattern Type | Example |
|---|---|
| Mood × Habit | "Your mood scores are 0.8 points higher on days you log a walk" |
| Energy × Sleep | "Energy tends to drop on days after late check-ins" |
| Spending × Mood | "Impulse food spend is 2x higher on low-mood days" |
| Habit × Time | "You complete morning habits 80% more on weekdays" |
| Review consistency | "Weeks with a check-in on Sunday tend to start stronger" |

### Sparsity Rules

> **Hard Limits:** At most 3 patterns visible at any time. A new pattern replaces the lowest-confidence existing one. Patterns expire after 30 days if not interacted with. Users can pin a pattern to preserve it.

### Events

- `pattern.detected` — AI emitted a new pattern candidate
- `pattern.surfaced` — moved to visible state after threshold check
- `pattern.dismissed` — user said "not useful"
- `pattern.pinned` — user marked as important
- `pattern.expired` — 30-day TTL elapsed without interaction

### AI Constraints

- Patterns are **read-only suggestions** — they never trigger automated actions
- Pattern generation runs as a scheduled Convex action, not inline with writes
- All pattern text is generated by AI but reviewed against a **tone policy** before surfacing
- Negative framing ("you failed to...") is rejected at the policy layer

---

## Module 5: Weekly Review

*Structured reflection with AI scaffolding.*

The Weekly Review is a guided, asynchronous session that helps the user close out the week and set light intentions for the next. It draws on all modules to provide context.

### Review Structure

| Step | Phase | Description |
|---|---|---|
| 1 | **Look Back** | AI-generated summary of the week: habits completed, mood trend, notable finance events, patterns detected |
| 2 | **Reflect** | Three fixed prompts + up to one AI-suggested prompt based on the week's patterns |
| 3 | **Intentions** | User sets 1–3 focus areas for next week — loose intentions, not commitments |
| 4 | **Close** | Review is sealed. A summary card is stored for future reference. |

### Events

- `review.started` — user opened the weekly review flow
- `review.summaryViewed` — look-back summary was displayed
- `review.reflectionSubmitted` — user answered reflection prompts
- `review.intentionsSet` — forward intentions recorded
- `review.completed` — review sealed and summary stored
- `review.skipped` — user explicitly skipped the week

### AI Summary Generation

The look-back summary is generated by a Convex AI action reading the past 7 days of events across all modules. Rules:

- Max 5 bullet points — no walls of text
- Positive framing only (mentions skips neutrally, never negatively)
- Highlights one **"bright spot"** — the highest-positive signal of the week
- Flags one **"worth noticing"** — a pattern or anomaly worth attention
- No recommendations in the summary phase — those come in Intentions

---

## Module 6: Tasks

*Capture and triage without overload.*

Tasks in Life OS are intentionally lightweight. The system is not a project manager. It is a low-friction inbox for things the user wants to hold onto, with a daily focus view that surfaces at most 3 items.

### Inbox vs Focus

All captured tasks land in the **Inbox**. The user triages them into **Focus** (today), **Later** (deferred), or **Done**. At any moment, the Today Focus view shows at most 3 tasks — chosen by the user, not the AI.

### Events

- `task.captured` — quick capture from any context
- `task.focused` — moved to today's focus
- `task.deferred` — pushed to a future date or "later"
- `task.completed`
- `task.abandoned` — explicitly dropped (not failed)

> **Anti-overload Rule:** The Focus view shows max 3 tasks. If the user tries to add a fourth, they are asked to defer or drop an existing one first. The AI never adds tasks to Focus automatically.

---

## Policy Engine

*Suggestions, not commands.*

The policy engine is a collection of pure functions that read current state and emit Suggestions — the only mechanism by which the system proactively communicates with the user.

### Suggestion Shape

```ts
type Suggestion = {
  id: string;
  module: Module;
  type: SuggestionType;
  priority: "low" | "medium" | "high";
  headline: string;        // max 60 chars
  subtext?: string;        // max 120 chars
  action?: SuggestedCommand; // optional one-tap action
  expiresAt?: number;
}
```

### Active Policies

| Policy | Triggers When |
|---|---|
| `MorningHabitPrompt` | No habits logged by 10am on a habit day |
| `CheckinPrompt` | No daily check-in by 8pm |
| `WeeklyReviewReady` | Sunday evening, last review was >6 days ago |
| `EnvelopeApproaching` | Spending reaches 80% of soft ceiling mid-month |
| `PatternSurface` | New pattern detected with confidence > threshold |
| `FocusEmpty` | Focus list is empty and inbox has 3+ items |
| `RestPermission` | User has been highly active for 5+ consecutive days |

> **Sparsity Enforcement:** The policy runner collects all triggered suggestions, then applies a hard limit of 3 visible at any time, ranked by priority and recency. Lower-priority suggestions are queued and surface as others expire.

---

## Data Flow & Security

### Write Path

1. Commands carry `idempotencyKey` and `payload`
2. Convex mutation validates input shape via Zod
3. Idempotency check: if key exists, return cached result without re-executing
4. Kernel validates business rules (`domain-kernel` layer)
5. Events appended to the `events` table with `occurredAt` timestamp
6. Reducer runs synchronously to update derived state documents
7. Policy engine runs as a follow-up action (non-blocking)

### Read Path

1. UI subscribes to Convex reactive queries
2. Queries read from derived state documents (not raw events)
3. Events are accessible via audit queries but not primary UI reads
4. Sensitive fields (finance notes, check-in notes) are stored encrypted at rest

### AI Action Boundaries

| ✅ AI CAN | ❌ AI CANNOT |
|---|---|
| Read events and derived state | Write events directly |
| Generate suggestion text | Mutate derived state |
| Produce pattern insights | Create or categorize transactions |
| Scaffold weekly review summaries | Execute commands without confirmation |
| Propose (not execute) commands | Act outside the current Hard Mode scope |

---

## Hard Mode

*You hand the wheel to the AI. You keep the brake.*

Hard Mode is an **opt-in, time-bounded, scoped delegation layer**. The user surrenders planning authority to the AI for a defined window across chosen modules. The AI makes the calls; the user flags misalignments. Flags are never failures — they are signal.

This is the only place in Life OS where the principle "AI proposes; humans decide" is intentionally inverted. The inversion is bounded, consensual, and reversible at any moment.

---

### Why It Exists

Decision fatigue is real — especially in recovery. Choosing what to do, when to do it, and how much to commit to can itself be exhausting. Hard Mode gives users a way to step back from that cognitive load entirely, trusting the system to hold structure while they focus on showing up.

---

### The Three Constraints

Every Hard Mode session is governed by three parameters the user sets at activation. The AI operates only within these bounds.

#### 1. Time Window
The AI holds authority for a fixed duration. When it ends, the system automatically returns to standard mode with no action required.

| Option | Use case |
|---|---|
| **One day** | High-stress day, decision fatigue spike |
| **One week** | Structured recovery push, new routine formation |
| **Custom** | User-defined end date/time |

There is no indefinite Hard Mode. The window must be set. It can be extended, but extension requires a fresh, explicit opt-in — not a default renewal.

#### 2. Module Scope
The user chooses which modules the AI controls. Unselected modules continue operating in standard mode.

| Module | What AI controls in Hard Mode |
|---|---|
| **Habits** | Selects which habits to schedule each day and at what anchor time |
| **Tasks** | Populates today's Focus from the inbox (still max 3) |
| **Check-in** | Schedules check-in timing and selects the reflection prompt |
| **Finance** | Proposes envelope adjustments and flags anomalies proactively |
| **Weekly Review** | Initiates and structures the review without waiting for user to start |

> **Finance Hard Mode note:** The AI can propose envelope changes and surface spending observations more aggressively, but it **never** moves money, changes ceilings, or confirms imported transactions. Those remain user-gated regardless of mode.

#### 3. Preference Anchors
Before activating, the user sets a small number of non-negotiable constraints the AI must respect. These are not preferences — they are hard limits the AI will not cross.

Examples:
- "No tasks before 9am"
- "Don't schedule habits on Sundays"
- "Keep finance suggestions private"
- "Max 2 habits per day"

Anchors are stored as `HardModeConstraint` events and checked by the policy engine before every AI decision. Violating an anchor is treated as a kernel validation error, not a soft suggestion.

---

### The Flag Mechanism

Flagging is the user's only real-time input during Hard Mode. It is intentionally lightweight — one tap, no explanation required.

```ts
type Flag = {
  targetId: string;          // the planned item being flagged
  targetType: FlagTarget;    // "habit" | "task" | "checkin" | "finance" | "review"
  reason?: FlagReason;       // optional: "not_now" | "not_aligned" | "too_much"
  occurredAt: number;
}
```

#### Flag behaviours

| Flag | Immediate effect | Learning effect |
|---|---|---|
| **Not now** | Item deferred to later in the day | AI adjusts timing preference for this type |
| **Not aligned** | Item removed from today entirely | AI down-weights this item category for this user |
| **Too much** | Day's plan trimmed by one item | AI recalibrates volume preference |

Flags never produce a visible consequence to the user beyond the item changing. No "are you sure?", no explanation prompt, no streak broken. The flag is silent signal, not a conversation starter.

> **Shame-free Flag Rule:** Flags are not overrides. They are not failures. They are not tracked or displayed anywhere. The user cannot see how many times they have flagged. The AI sees them only as calibration data.

---

### AI Planning Behaviour

When Hard Mode is active, the AI runs a planning action at the start of each day (or week, for weekly scope) that produces a `HardModePlan` — a structured set of proposed events across the active modules.

```ts
type HardModePlan = {
  sessionId: string;
  window: { start: number; end: number };
  modules: Module[];
  constraints: HardModeConstraint[];
  plannedItems: PlannedItem[];
  generatedAt: number;
}

type PlannedItem = {
  module: Module;
  itemId: string;
  scheduledFor: number;      // ms epoch
  rationale: string;         // max 80 chars, shown on long-press
  confidence: "low" | "medium" | "high";
}
```

The `rationale` field is surfaced on long-press only — the user is not bombarded with AI justifications. It exists for transparency when they want it.

Low-confidence items are scheduled last and are the first to be dropped if the plan exceeds the user's stated capacity.

---

### Hard Mode Events

- `hardmode.activated` — session started with window, scope, and constraints
- `hardmode.planGenerated` — daily/weekly plan produced by AI
- `hardmode.itemFlagged` — user flagged a planned item
- `hardmode.itemDeferred` — item pushed to later (from "not now" flag)
- `hardmode.itemDropped` — item removed (from "not aligned" flag)
- `hardmode.planTrimmed` — volume reduced (from "too much" flag)
- `hardmode.deactivated` — session ended (by timer or manual exit)
- `hardmode.extendRequested` — user opted to extend the window

---

### Exiting Hard Mode

The user can exit at any time with no friction. There is no confirmation dialog, no summary of how many times they flagged, no "are you sure you want to give up?" The exit is instant and silent.

On exit:
- All unexecuted planned items are cleared
- Modules return to standard mode immediately
- A `hardmode.deactivated` event is written with `exitedEarly: true`
- Nothing is shown to the user beyond the mode indicator switching off

---

### What the AI Never Does in Hard Mode

Even with full delegation, these constraints are absolute:

- Does not confirm financial transactions
- Does not change envelope ceilings
- Does not add tasks beyond the 3-item Focus limit
- Does not override a Preference Anchor
- Does not plan into the past
- Does not generate plans that violate the Shame-free Design Rule (no negative framing, no missed-item tracking)
- Does not prevent the user from exiting

---

### UX Surface

Hard Mode has a distinct visual state — a persistent, low-key indicator that the mode is active (e.g. a subtle border or badge on the home screen). It is noticeable but not alarming.

The daily plan is presented as a **read-only card sequence**, not a checklist. Items appear in the order the AI scheduled them. Completion is still logged via the standard command path — Hard Mode only changes who scheduled the item, not how it's recorded.

Long-pressing any item reveals its `rationale`. Tapping the flag icon triggers the flag sheet (three options: Not now / Not aligned / Too much).

---

## Hard Mode

*Surrender the wheel. Flag what doesn't fit.*

Hard Mode is an opt-in state where the AI becomes the sole architect of the user's plans. The user gives up the right to choose — and gains the right to flag anything that doesn't feel aligned. No streaks, no failure, no guilt about the flag.

> **Principle shift:** Normally "AI proposes; humans decide." In Hard Mode: "AI decides; humans react." The veto always exists — it just isn't the default move anymore.

### Activation

Hard Mode is **time-bounded** and **scoped** at the point of opt-in. The user never hands over everything forever.

- **Duration:** 1 day, 3 days, or 1 week — chosen at activation, auto-exits when elapsed
- **Scope:** User selects which modules the AI controls — e.g. "own my morning routine but not my finances"
- **Renewal:** At expiry the user is asked if they want to continue — silence means exit, not renewal

```ts
type HardModeScope = {
  habits: boolean;
  tasks: boolean;
  checkin: boolean;
  finance: boolean;
  weeklyReview: boolean;
}

type HardModeSession = {
  scope: HardModeScope;
  startedAt: number;
  expiresAt: number;      // max 7 days from start
  flags: Flag[];
}
```

### What the AI Owns (Within Scope)

| Module | What the AI Controls |
|---|---|
| **Habits** | Selects which habits appear today based on energy trend, day of week, and recent load |
| **Tasks** | Fills the Focus view (up to 3) from the inbox, ranked by inferred priority |
| **Check-in** | Chooses timing and prompts of the daily check-in |
| **Finance** | Sets envelope soft ceilings based on recent spending patterns |
| **Weekly Review** | Schedules the review window and selects reflection prompts |
| **Patterns** | Surfaces and pins patterns without waiting for user triage |

### What the User Always Keeps

Hard Mode is **asymmetric** — the AI plans forward, the user reacts backward with no penalty.

- The **flag** — one tap to signal misalignment, no explanation required
- The **exit** — Hard Mode can be paused or ended at any moment, zero friction
- **Privacy controls** — modules marked private are never touched
- **Crisis override** — a single "not today" gesture clears all AI plans for the day and cannot be questioned by the system

### Flagging

A flag is not a complaint. It is signal. The user can flag anything the AI chose — a habit, a task, a prompt, a pattern — with a single gesture.

- **No "why?" prompt** — the UI never asks for an explanation unless the user volunteers one
- **Cumulative learning** — repeated flags on a class of decision soften or suppress that class in future plans
- **Never penalized** — flagging frequently does not degrade plan quality or generate warnings

```ts
type Flag = {
  targetId: string;
  targetType: FlagTarget;   // habit | task | pattern | suggestion | review_prompt
  reason?: string;          // optional, owner-supplied
  context: {
    energy?: number;        // from most recent check-in
    mood?: number;
    dayOfWeek: number;
  };
}
```

### AI Planning Rules

A Hard Mode plan is a structured `Suggestion` batch that the system auto-confirms on the user's behalf. Flags roll back the confirmation and emit a correction event. The AI reads all events and derived state but never writes events directly — the architecture is unchanged.

- Plans generate once per day (morning) and once per week (Sunday evening)
- The AI never re-plans mid-day unless the user explicitly requests it
- Plans are **conservative by default** — the AI under-schedules rather than over-schedules
- On low-energy days (mood/energy ≤ 2) the AI automatically drops to a minimal plan: one habit, one task, one check-in

### Events

- `hardMode.enabled` — user opted in, scope and duration recorded
- `hardMode.planGenerated` — AI produced the day's or week's plan
- `hardMode.itemFlagged` — user flagged a specific AI decision
- `hardMode.overrideApplied` — user cleared all plans for the day
- `hardMode.paused` — user temporarily stepped out
- `hardMode.expired` — session elapsed naturally
- `hardMode.disabled` — user manually exited

---

## Build Roadmap

| Phase | Focus | Deliverables |
|---|---|---|
| **α Alpha** | Core Loop | Monorepo setup, auth, Habits module, Check-in module, basic policy engine |
| **β Beta** | AI Layer | Pattern detection, Weekly Review with AI summary, Finance module (manual) |
| **1.0** | Complete | Finance account linking (Plaid), Tasks module, full policy suite, audit log UI |
| **1.1** | Hard Mode | Hard Mode activation flow, AI planner action, flag mechanism, preference anchors |
| **1.x** | Depth | Cross-module dashboards, export (events as JSON), notification personalization |
| **2.0** | Hard Mode | AI planner, flag system, scoped Hard Mode, low-energy auto-downgrade |

---

*Life OS is not productivity software. It's a system that holds space for being human — one event at a time.*
