# Life OS — Phase 10: AI Memory & Agent Loop

> Addendum to the core development plan. All previous phases must be complete before starting this one. The features here require a working event log, functioning Hard Mode, and at least 2–3 weeks of real usage data to be meaningful.

---

## What This Phase Builds

Right now every AI action in Life OS starts cold. It reads the event log, does its job, and forgets everything. It has no memory of what it noticed before, what you responded to, what it got wrong. This phase gives the AI continuity — a persistent context it reads before acting and writes to after. It also closes the Hard Mode feedback loop, turning it from a static daily plan into something that actually learns your rhythm over time.

Three things get built, in order:

1. **`aiContext` — the AI's persistent memory document**
2. **Day-close agent loop — Hard Mode learns from each day**
3. **Conversational capture — unstructured input that feeds structured state**

---

## 10.1 — `aiContext`: Persistent AI Memory

### What it is

A single Convex document the AI reads before every action and writes a structured observation to after. Not a log — a living model. The AI maintains it. You never edit it directly, but you can read it.

### Schema

```ts
// convex/schema.ts addition
aiContext: defineTable({
  lastUpdated: v.number(),

  workingModel: v.object({
    // Narrative strings — AI writes, AI reads, max ~200 chars each
    energyPatterns: v.string(),
    habitResonance: v.string(), // which habits actually get done
    flagPatterns: v.string(), // what Hard Mode flags revealed
    triggerSignals: v.string(), // inferred stress/difficulty patterns
    suggestionResponse: v.string(), // what kinds of suggestions land
    reviewEngagement: v.string(), // how you use the weekly review
    financeRelationship: v.string(), // spending patterns and mood correlation
  }),

  memory: v.array(
    v.object({
      occurredAt: v.number(),
      module: v.string(),
      observation: v.string(), // max 150 chars
      confidence: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
      source: v.string(), // which action wrote this
    }),
  ),

  calibration: v.object({
    preferredSuggestionVolume: v.union(
      v.literal("minimal"),
      v.literal("moderate"),
      v.literal("full"),
    ),
    hardModePlanAccuracy: v.number(), // 0–1, rolling average of non-flagged items
    patternDismissRate: v.number(), // 0–1, how often patterns get dismissed
    lastHardModeReflection: v.optional(v.number()),
  }),
});
```

### Tasks

**10.1.1 — Schema and seed**

- Add `aiContext` table to Convex schema
- Write `mutations/initAiContext.ts` — creates the document with empty defaults if it doesn't exist
- Call on first app launch (idempotent)

**10.1.2 — Context reader utility**

- Write `lib/readAiContext.ts` — shared utility all AI actions call at the start
- Returns the full context document or sensible defaults if empty
- Every existing AI action (`detectPatterns`, `generateWeeklySummary`, `generateHardModePlan`) gets updated to call this first

**10.1.3 — Context writer utility**

- Write `lib/writeAiContext.ts` — shared utility for appending a memory entry and updating the working model
- Takes a `patch` object — AI writes only the fields it has new signal on
- Enforces memory array cap (keep last 90 entries, drop oldest)
- Every existing AI action gets updated to call this after completing

**10.1.4 — Context viewer UI**

- Read-only screen in settings: "What the AI knows about me"
- Shows `workingModel` fields in plain language
- Shows last 10 memory entries with timestamps
- One button: "Clear AI memory" — writes a `aiContext.cleared` event, resets to defaults
- No editing. This is a window, not a control panel.

### Exit condition

Every AI action reads context before running and writes an observation after. The context viewer shows a working model that is visibly more accurate after 2 weeks of usage than it was on day one.

---

## 10.2 — Day-Close Agent Loop

### What it is

A Convex scheduled action that runs at the end of each Hard Mode day. It looks at what was planned, what was completed, what was flagged, and what was ignored — then writes structured learnings back to `aiContext`. Tomorrow's plan is shaped by today's signal without you having to do anything.

This is the feedback loop that makes Hard Mode get smarter over time rather than making the same calls every day.

### The loop

```
End of Hard Mode day
        ↓
readHardModePlan(today)        — what the AI scheduled
readCompletionEvents(today)    — what actually happened
readFlags(today)               — explicit signal
readIgnored(today)             — items that were neither done nor flagged
        ↓
analyzeDay()                   — AI reasons over the gap
        ↓
writeAiContext(observations)   — structured learnings stored
        ↓
tomorrow's generateHardModePlan() reads updated context
```

### Tasks

**10.2.1 — Day-close action**

Write `actions/closeHardModeDay.ts`:

```ts
// Pseudocode — actual implementation will be more granular
export const closeHardModeDay = internalAction(async (ctx) => {
  const context = await readAiContext(ctx);
  const plan = await ctx.runQuery(api.queries.currentHardModePlan);
  const todayEvents = await ctx.runQuery(api.queries.todayEvents);
  const flags = todayEvents.filter((e) => e.type === "hardmode.itemFlagged");
  const completions = todayEvents.filter((e) => isCompletionEvent(e));

  // Items that were planned but neither completed nor flagged
  const ignored = plan.plannedItems.filter(
    (item) =>
      !completions.find((c) => c.payload.itemId === item.itemId) &&
      !flags.find((f) => f.payload.targetId === item.itemId),
  );

  // Ask the AI to reason over the gap
  const analysis = await callAI({
    system: DAY_CLOSE_SYSTEM_PROMPT,
    context,
    planned: plan.plannedItems,
    completed: completions,
    flagged: flags,
    ignored,
  });

  // Write structured observations back
  await writeAiContext(ctx, {
    observations: analysis.observations,
    calibrationPatch: {
      hardModePlanAccuracy: computeAccuracy(plan, completions, flags),
    },
    workingModelPatch: analysis.workingModelUpdates,
  });
});
```

**10.2.2 — Day-close system prompt**

The prompt that drives the analysis. Lives in `lib/prompts/dayClose.ts`. Key instructions:

- Reason about _why_ items were flagged, not just that they were
- Distinguish between "wrong item" (`not_aligned`) vs "wrong timing" (`not_now`) vs "too much" (`too_much`)
- Note patterns across multiple days — if mornings are consistently flagged, say so
- Update the relevant `workingModel` field with a revised narrative
- Keep each observation under 150 chars
- Never frame ignored items as failures — they are signal about capacity, not compliance

**10.2.3 — Schedule wiring**

- Schedule `closeHardModeDay` to run at 11pm daily when a Hard Mode session is active
- If Hard Mode ends mid-day (manual exit), trigger immediately on `hardmode.deactivated`

**10.2.4 — Accuracy metric**

- `hardModePlanAccuracy` = completed items / (planned items - `too_much` flags)
- `too_much` flags are excluded from the denominator — they signal the plan was overfull, not that you failed
- Displayed nowhere in the UI — used only by the AI to calibrate future plan volume

**10.2.5 — Plan calibration in `generateHardModePlan`**

- Update `generateHardModePlan` to read `hardModePlanAccuracy` from context
- If accuracy < 0.5 over last 3 days: reduce plan by one item
- If accuracy > 0.85 over last 3 days: AI may add one item (still respects module max)
- If `not_now` flags cluster around a time of day: shift scheduled times away from that window
- If `not_aligned` flags cluster around a module: down-weight that module's items for the next 3 days

### Exit condition

After 3 days of Hard Mode usage, `generateHardModePlan` produces a noticeably different plan than it did on day one — fewer items if you flagged a lot, different timing if you flagged by time, different modules if you flagged by category. The `aiContext` viewer shows observations that reflect what actually happened.

---

## 10.3 — Conversational Capture

### What it is

A single free-text input on the Today screen. Not a chatbot. Not a chat history. You type something — "rough morning", "feeling anxious about money", "really good day actually" — the AI reads it, responds in one or two sentences, and then does something useful with it in the background: updates its context, adjusts the suggestion queue, or surfaces a relevant pattern.

The response disappears after 30 seconds or on navigation. There is no chat history stored or displayed.

### Why it's not a chatbot

A chatbot implies a conversation. This is a drop box with a receipt. You drop something in, you get a brief acknowledgement, the system quietly uses the signal. It respects the principle that the app should do nothing unless you want it to — but it adds a path for unstructured input that doesn't require you to know which module it belongs to.

### Tasks

**10.3.1 — Capture input component**

- Floating input on Today screen — one tap to open, returns on submit or dismiss
- Placeholder: "How are you right now?" — never changes, never gets clever
- Max 280 chars
- No send button — submit on return key or tap outside

**10.3.2 — Capture action**

Write `actions/processCapture.ts`:

```ts
export const processCapture = action(async (ctx, { text }: { text: string }) => {
  const context = await readAiContext(ctx);
  const recentState = await ctx.runQuery(api.queries.recentDomainState);

  const result = await callAI({
    system: CAPTURE_SYSTEM_PROMPT,
    context,
    recentState,
    input: text,
  });

  // result shape:
  // {
  //   reply: string,              // 1–2 sentences, shown briefly to user
  //   contextPatch?: Partial<WorkingModel>,
  //   suggestedAction?: SuggestedCommand,  // optional — user still confirms
  //   moodSignal?: number,        // 1–5 inferred, used to update context
  //   energySignal?: number,
  // }

  // Write context patch if the input revealed something
  if (result.contextPatch) {
    await writeAiContext(ctx, {
      workingModelPatch: result.contextPatch,
      observations: [
        {
          source: "conversationalCapture",
          observation: `User input signal: ${result.moodSignal ? `mood ~${result.moodSignal}` : "unscored"}`,
          confidence: "low",
        },
      ],
    });
  }

  // If a suggested action comes back, surface it as a suggestion — not auto-executed
  if (result.suggestedAction) {
    await ctx.runMutation(api.mutations.createSuggestion, {
      source: "capture",
      action: result.suggestedAction,
      expiresAt: Date.now() + 1000 * 60 * 30, // 30 min TTL
    });
  }

  return { reply: result.reply };
});
```

**10.3.3 — Capture system prompt**

Lives in `lib/prompts/capture.ts`. Key instructions:

- Reply is warm, brief, and non-therapeutic — you are not a counselor
- Never repeat back what the user said verbatim
- Never ask a follow-up question in the reply
- If mood/energy signal is clear, note it in the patch — don't ask to confirm it
- If the input implies a need (e.g. "I have so much to do"), a suggested action is appropriate (e.g. open inbox triage) — but it surfaces as a dismissable suggestion, never auto-executed
- If the input is ambiguous, reply briefly and write nothing to context — do not guess
- Never store the raw input text anywhere

**10.3.4 — Reply display**

- Reply appears inline beneath the input, fades after 30 seconds
- No history of replies stored or displayed
- If a suggestion was generated, it appears in the normal suggestion strip — not inline
- Raw input text is never stored in the event log or anywhere else

### Exit condition

You type "rough morning" into the Today screen. The AI replies in one sentence. If a suggestion is generated it appears in the strip. After 30 seconds the reply is gone. Nothing in the app records what you typed.

---

## System Prompt Architecture

All three features share infrastructure. Centralise it before building any of them.

### `lib/prompts/` structure

```
lib/prompts/
  base.ts              — shared system preamble (principles, tone rules, hard limits)
  dayClose.ts          — day-close analysis prompt
  capture.ts           — conversational capture prompt
  patternDetect.ts     — updated pattern detection prompt (reads context)
  weeklySummary.ts     — updated weekly summary prompt (reads context)
  hardModePlan.ts      — updated Hard Mode planner prompt (reads context)
```

### `base.ts` — shared rules injected into every prompt

```ts
export const BASE_SYSTEM = `
You are the AI layer of a personal recovery-first operating system built for one person.

TONE RULES — non-negotiable:
- Never use the words: fail, missed, behind, should, need to, streak
- Never frame absence of action negatively
- Positive and neutral framing only
- If you cannot frame something positively or neutrally, say nothing

SPARSITY RULES:
- Suggest one thing at a time, never a list of actions
- Observations are more valuable than recommendations
- Silence is correct when you have nothing confident to say

MEMORY RULES:
- You have access to a working model of this person built over time
- Trust it, update it, do not contradict it without strong signal
- Low-confidence observations are still worth writing — label them clearly

HARD LIMITS:
- You never write to the event log directly
- You never execute a command — only propose one
- You never store raw user input
- You never ask how the person is feeling if they just told you
`;
```

### Tasks

**10.0.1 — Build prompt infrastructure before anything else**

- Write `lib/prompts/base.ts`
- Write `lib/callAI.ts` — shared wrapper around the Convex AI action, injects base prompt, handles errors
- Update all existing AI actions to use `callAI` instead of raw API calls
- This is the first task of Phase 10, not the last

---

## Build Order

Do these in strict order. Each one depends on the previous.

```
10.0  Prompt infrastructure + callAI wrapper
  ↓
10.1  aiContext schema, reader, writer, viewer UI
  ↓
10.1* Update all existing AI actions to read/write context
  ↓
10.2  Day-close action + schedule wiring
  ↓
10.2* Update generateHardModePlan to use calibration data
  ↓
10.3  Conversational capture action + UI
```

The `*` steps are updates to existing code, not new files. They are easy to forget and important not to.

---

## What the AI Still Cannot Do

These constraints do not change in Phase 10. More memory does not mean more authority.

- Cannot write events directly
- Cannot execute commands without user confirmation
- Cannot store raw user input
- Cannot surface more than 3 suggestions at once
- Cannot override a Hard Mode preference anchor
- Cannot prevent the user from exiting any mode
- Cannot access data it hasn't been explicitly given in the action context

---

## Exit Condition for Phase 10

After two weeks of usage post-Phase 10:

- The `aiContext` viewer shows a working model that is recognisably accurate about your patterns
- Hard Mode plans on day 10 look meaningfully different from day 1 in ways that reflect your actual flags and completions
- Conversational capture produces replies that feel like the system knows you, not like a generic chatbot
- No raw user input is stored anywhere
- The AI has never executed a command you didn't confirm

---

_The system now remembers. It still doesn't decide._
