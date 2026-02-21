# What `@convex-dev/agent` actually gives you\*\*

Three things you'd otherwise build yourself:

- **Thread management** — persistent conversation context across multiple AI calls without you managing message arrays
- **Tool calling** — structured way for the AI to call your Convex queries mid-generation
- **Message history** — the AI can look back at what it said before in the same thread

For Life OS, threads map naturally to **sessions** — a Hard Mode session is a thread, a weekly review is a thread, a day's worth of conversational captures is a thread. The AI builds context within the session without you manually assembling it.

---

**Where it plugs into your existing flow**

Your current flow per action:

```
Convex action fires
    ↓
Reads events/state directly
    ↓
Calls LLM with assembled prompt
    ↓
Returns text
    ↓
tonePolicy filters
    ↓
Writes to aiContext
```

With `@convex-dev/agent`, the middle becomes:

```
Convex action fires
    ↓
Agent picks up the thread (or creates one)
    ↓
Agent calls tools to gather what it needs
    ↓
LLM reasons over tool results
    ↓
Returns structured output
    ↓
tonePolicy filters
    ↓
Writes to aiContext
```

The difference is the AI decides what to fetch via tools rather than you pre-assembling everything. For simple actions this doesn't matter much. For Hard Mode planning and Weekly Review it matters a lot — the AI can ask for more data mid-generation if what it got first wasn't enough.

---

**Concrete integration per feature**

**Pattern Detection** — minimal change

This one barely needs the agent. It's a scheduled action that runs correlation logic and generates a human-readable explanation. The rule-based detection stays as-is. The agent only touches the explanation step:

```ts
// convex/agents/patternAgent.ts
export const patternAgent = new Agent(components.agent, {
  chat: google("gemini-1.5-flash"),
  system: BASE_SYSTEM + PATTERN_SYSTEM,
  tools: {
    getPatternData: tool({
      args: { patternId: v.string() },
      handler: async (ctx, { patternId }) => {
        // returns the raw correlation data the rule engine found
        return await ctx.runQuery(api.queries.patternData, { patternId });
      },
    }),
    getAiContext: tool({
      args: {},
      handler: async (ctx) => {
        return await ctx.runQuery(api.queries.aiContext);
      },
    }),
  },
});

// convex/actions/explainPattern.ts
export const explainPattern = internalAction(async (ctx, { patternId }) => {
  const { thread } = await patternAgent.createThread(ctx);
  const result = await thread.generateText(ctx, {
    prompt: `Explain this pattern in plain language. 
             Max 2 sentences. Neutral framing only.`,
  });
  return tonePolicy(result.text);
});
```

**Weekly Summary** — moderate change, high value

This is where agent tool calling earns its keep. Instead of you pre-assembling 7 days of events into a prompt, the agent fetches exactly what it needs:

```ts
// convex/agents/summaryAgent.ts
export const summaryAgent = new Agent(components.agent, {
  chat: google("gemini-1.5-flash"),
  system: BASE_SYSTEM + WEEKLY_SUMMARY_SYSTEM,
  tools: {
    getWeekEvents: tool({
      args: { module: v.string() },
      handler: async (ctx, { module }) => {
        return await ctx.runQuery(api.queries.weekEvents, { module });
      },
    }),
    getMoodTrend: tool({
      args: {},
      handler: async (ctx) => {
        return await ctx.runQuery(api.queries.moodTrend, { days: 7 });
      },
    }),
    getAiContext: tool({
      args: {},
      handler: async (ctx) => {
        return await ctx.runQuery(api.queries.aiContext);
      },
    }),
  },
  maxSteps: 5, // agent can call up to 5 tools before generating final output
});

// convex/actions/generateWeeklySummary.ts
export const generateWeeklySummary = internalAction(async (ctx, { reviewId }) => {
  const { thread } = await summaryAgent.createThread(ctx);

  const result = await thread.generateText(ctx, {
    prompt: `Generate this week's summary. 
             Use your tools to gather what you need.
             Output: max 5 bullets, one bright spot, one worth-noticing.
             No recommendations.`,
  });

  const filtered = tonePolicy(result.text);

  // write observation to aiContext after
  await writeAiContext(ctx, {
    observations: [{ source: "weeklySummary", observation: "Summary generated" }],
  });

  return filtered;
});
```

The key thing here: `maxSteps: 5` lets the agent call `getWeekEvents` for habits, then for check-ins, then `getMoodTrend`, then `getAiContext` — building up a complete picture before writing a single word of output. You don't pre-determine what it fetches.

**Hard Mode Planning** — biggest change, biggest payoff

This is the one that most benefits from agent tool calling because the plan quality directly depends on the quality of context gathered. Your current `generateHardModePlan.ts` assembles context upfront and hopes it picked the right things. The agent asks for what it needs:

```ts
// convex/agents/plannerAgent.ts
export const plannerAgent = new Agent(components.agent, {
  chat: google("gemini-1.5-flash"),
  system: BASE_SYSTEM + HARD_MODE_PLANNER_SYSTEM,
  tools: {
    getActiveHabits: tool({
      args: {},
      handler: async (ctx) => ctx.runQuery(api.queries.activeHabits),
    }),
    getInboxTasks: tool({
      args: {},
      handler: async (ctx) => ctx.runQuery(api.queries.inbox),
    }),
    getLastCheckin: tool({
      args: {},
      handler: async (ctx) => ctx.runQuery(api.queries.lastCheckin),
    }),
    getHardModeConstraints: tool({
      args: {},
      handler: async (ctx) => ctx.runQuery(api.queries.hardModeConstraints),
    }),
    getAiContext: tool({
      args: {},
      handler: async (ctx) => ctx.runQuery(api.queries.aiContext),
    }),
    getDayHistory: tool({
      // agent can look back at recent days if it needs calibration signal
      args: { days: v.number() },
      handler: async (ctx, { days }) => ctx.runQuery(api.queries.recentDays, { days }),
    }),
  },
  maxSteps: 6,
});

// convex/actions/generateHardModePlan.ts
export const generateHardModePlan = internalAction(async (ctx, { sessionId }) => {
  const session = await ctx.runQuery(api.queries.hardModeSession, { sessionId });

  // reuse the thread for the whole session — agent remembers yesterday's plan
  const { thread } = await plannerAgent.createThread(ctx, {
    threadId: `hardmode-${sessionId}`, // stable ID = persistent thread
  });

  const result = await thread.generateText(ctx, {
    prompt: `Generate today's Hard Mode plan.
             Session scope: ${JSON.stringify(session.scope)}
             Use tools to check constraints, last check-in, inbox, and AI context.
             Be conservative. Under-schedule rather than over.
             Return structured JSON: { plannedItems: PlannedItem[] }`,
  });

  // existing guards — these do not change regardless of agent
  const plan = JSON.parse(result.text);
  validateHardModePlan(plan, session.constraints); // kernel validation
  applyLowEnergyFailsafe(plan, await getLastCheckin(ctx)); // energy check

  await ctx.runMutation(api.mutations.savePlan, { sessionId, plan });
});
```

The critical line is `threadId: \`hardmode-${sessionId}\``. Using a stable thread ID means the agent has memory of every plan it generated in this session. When you flag something on day 3, and day 4's plan runs, the agent can look back at the thread history and see "day 3 had two `not_aligned` flags on afternoon habits" without you explicitly passing that. The thread is the memory.

**Day-Close Agent Loop** — new, uses thread history

This is where thread persistence pays off most clearly:

```ts
// convex/actions/closeHardModeDay.ts
export const closeHardModeDay = internalAction(async (ctx, { sessionId }) => {
  const todayEvents = await ctx.runQuery(api.queries.todayEvents);
  const flags = todayEvents.filter((e) => e.type === "hardmode.itemFlagged");
  const completions = todayEvents.filter((e) => isCompletionEvent(e));

  // same thread as the plan — agent sees what it planned AND what happened
  const { thread } = await plannerAgent.createThread(ctx, {
    threadId: `hardmode-${sessionId}`, // same stable ID
  });

  const result = await thread.generateText(ctx, {
    prompt: `The day is done. Here is what happened:
             Completions: ${JSON.stringify(completions)}
             Flags: ${JSON.stringify(flags)}
             
             What did you learn? Update your understanding of this person's patterns.
             Output structured JSON: { observations: string[], workingModelPatch: object }`,
  });

  const { observations, workingModelPatch } = JSON.parse(result.text);
  await writeAiContext(ctx, { observations, workingModelPatch });
});
```

The agent sees its own plan (in thread history) and what actually happened (in the prompt). It reasons over the gap. No manual context assembly required.

**Conversational Capture** — one thread per day

```ts
// convex/actions/processCapture.ts
export const processCapture = action(async (ctx, { text }) => {
  // thread scoped to today — captures within a day build on each other
  const today = new Date().toISOString().split("T")[0];
  const { thread } = await captureAgent.createThread(ctx, {
    threadId: `capture-${today}`,
  });

  const result = await thread.generateText(ctx, {
    prompt: text, // raw input — agent has today's prior captures in thread history
  });

  // raw text never stored — only the reply and any inferred signal
  return { reply: tonePolicy(result.text) };
});
```

If you type "rough morning" at 8am and then "feeling a bit better now" at 2pm, the afternoon capture lands in the same thread. The agent knows both. You never have to connect them yourself.

---

**What doesn't change**

- The event log — untouched, agents only read it via tools
- `tonePolicy.ts` — still runs on every output, agents don't bypass it
- Kernel validation — `validateHardModePlan`, `applyLowEnergyFailsafe` still run as guards after agent output
- `aiContext` — still written via `writeAiContext`, agents just also read it as a tool
- The command/event architecture — agents propose, you still confirm

---

**The one file to write first**

Before any agent, write `convex/agent.ts` — the shared initialization:

```ts
import { Agent } from "@convex-dev/agent";
import { google } from "@ai-sdk/google";
import { components } from "./_generated/api";

export const BASE_SYSTEM = `...`; // your tone rules, hard limits

// shared tools available to all agents
export const sharedTools = {
  getAiContext: tool({
    args: {},
    handler: async (ctx) => ctx.runQuery(api.queries.aiContext),
  }),
};

// each feature agent imports this and extends it
export { Agent, google, components };
```

Then build one agent at a time. Pattern agent first — it's the simplest. Weekly summary second. Hard Mode planner last — it's the most complex and benefits most from the thread persistence that the simpler agents will have already proven out.
