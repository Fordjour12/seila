# AI Integration Plan

## Overview

LifeOS uses AI to provide personalized insights, summaries, and adaptive planning. All AI features are designed with:
- **Neutral tone**: No urgency, guilt, or failure language
- **User privacy**: Data isolated per-user via RAG namespaces
- **Recovery-first**: AI adapts to user energy/mood, never pushes harder

## Tech Stack

| Component | Technology |
|-----------|------------|
| Agent Framework | @convex-dev/agent |
| LLM | Google Gemini Flash (fast, cheap, ~$0.0001/1K tokens) |
| Embeddings | Google Gemini Embeddings |
| RAG | @convex-dev/rag |

## Current State

The app currently uses **rule-based AI** (no LLM):
- Pattern detection: Correlation logic in `detectPatterns.ts`
- Weekly summary: Template-based in `generateWeeklySummary.ts`
- Hard Mode planning: Rule-based template in `generateHardModePlan.ts`

## Architecture

### Convex Agents Integration

```
┌─────────────────────────────────────────────────────────────┐
│                     Agent Component                         │
│  - Manages threads & messages                                │
│  - Coordinates tools                                         │
│  - Handles RAG context                                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   RAG Component   │    │   Tool Definitions  │    │  Message History  │
│  Per-user namespace  │    │  (habits, tasks,   │    │   (threads)       │
│  Check-ins, reviews, │    │   checkins, etc.)  │    │                   │
│  recovery context   │    │                    │    │                   │
└───────────────┘    └───────────────┘    └───────────────┘
```

### RAG (Retrieval-Augmented Generation)

```
Namespace: {userId}

Documents:
  - Check-ins (last 30 days, summarized)
  - Weekly reviews
  - Recovery context
  - Active patterns
  - Habit history
  - Task completion patterns
```

### Agent Tools

Defined per feature:

**Hard Mode Agent:**
- `getTodayHabits` - Query today's habits
- `getInboxTasks` - Query inbox tasks  
- `getLastCheckin` - Get latest mood/energy
- `getRecoveryContext` - Get user's hard day definitions
- `logHabit` - Mark habit complete
- `focusTask` - Add task to focus
- `submitCheckin` - Submit a check-in
- `getPatterns` - Get active user patterns

**Insight Agents:**
- `searchHistory` - RAG search user's historical context
- `getWeeklyEvents` - Get past week's events for summary
- `getMoodTrend` - Get mood/energy trends

## Features

### 1. Weekly Summary AI (Priority: HIGH)

**Flow:**
1. Agent receives thread context with user ID
2. Tool: `getWeeklyEvents` queries habits, check-ins, tasks, reviews
3. Tool: `searchHistory` retrieves RAG context
4. Agent generates:
   - Max 5 bullets of what happened
   - 1 bright spot
   - 1 worth-noticing observation
5. Tone policy filters output before returning

**Implementation:**
- Use Agent's `generateText()` with structured output
- Stream response to UI for real-time feedback
- Persist to `reviews` table

**Output example:**
```
- 5 habit completions logged
- 4 check-ins completed
- 2 tasks completed
- Mood trending positive

Bright spot: You felt best on Wednesday
Worth noticing: Energy varied but stayed manageable
```

### 2. Pattern Insights Generation (Priority: HIGH)

**Flow:**
1. Rule-based `detectPatterns.ts` runs (existing)
2. When pattern surfaces, trigger Agent
3. Tool: `searchHistory` retrieves related context
4. Tool: `getMoodTrend`, `getHabitHistory` for data
5. Agent generates human-readable explanation

**Implementation:**
- Add `explainPattern` tool to Agent
- Use Agent's structured output for consistency
- Pass through existing `tonePolicy.ts`

**Example:**
> "You tend to complete more habits on days when you check in earlier. The data shows a 0.4 point mood increase on days with habit completion before 10am."

### 3. Hard Mode Adaptive Planning (Priority: MEDIUM)

**Current:** Rule-based template in `generateHardModePlan.ts`

**Migrate to Agent:**
1. User activates Hard Mode
2. Agent receives thread with session context
3. Tools query: habits, inbox tasks, last check-in, recovery context
4. Agent generates adaptive plan respecting:
   - User's allowed habit anchors (morning/afternoon/evening)
   - Max planned items constraint
   - Disallowed modules
   - Low-energy failsafe (reduces scope when mood/energy < 3)

**Safety features (existing, preserved):**
- Constraint validation before plan is applied
- Low-energy failsafe automatically reduces plan scope
- Crisis override available (drops all planned items)

**Implementation:**
- Convert `buildCandidates()` logic to Agent prompt
- Keep `validateHardModePlan()` and `applyLowEnergyFailsafe()` as guards
- Use Agent's tool calling for data gathering

### 4. Recovery Context Q&A (Priority: LOW)

**New feature - requires Agent:**

**Flow:**
1. User asks question about their patterns/recovery
2. Agent receives user message in thread
3. Tool: `searchHistory` queries RAG
4. Tool: `getMoodTrend`, `getPatterns`, `getRecoveryContext`
5. Agent answers with context

**Implementation:**
- Create new Agent for Q&A (separate from planning)
- Use existing threads or create new "insights" thread
- Stream responses to chat UI

**Example:**
> "You: Why do I feel worse on Sundays?"
> "AI: Looking at your data, Sundays show 0.5 lower energy on average. Your check-ins mention 'work anxiety' more on Sunday evenings. This aligns with your recovery context about work being a trigger."

### 5. Multi-Agent Workflows (Future)

```
┌──────────────────┐
│  Weekly Review  │────▶┌──────────────────┐
│     Trigger     │     │ Summary Agent   │
└──────────────────┘     │ (generate text) │
                         └────────┬─────────┘
                                  ▼
                         ┌──────────────────┐
                         │ Pattern Agent    │
                         │ (explain)        │
                         └──────────────────┘
```

## Tone Policy

All AI outputs pass through `tonePolicy.ts` (existing):

```typescript
const disallowedFragments = [
  "you failed",
  "failure",
  "bad",
  "you should",
  "must",
  "wrong",
  "lazy",
  "guilt",
  "shame",
];
```

**With Convex Agents:** Apply tone policy in Agent's post-processing or as a custom output validator.

## Installation

```bash
# Add to packages/backend/package.json:
bun add @convex-dev/agent @convex-dev/rag ai @ai-sdk/google
```

## Files to Create/Modify

| File | Purpose |
|------|---------|
| `convex/convex.config.ts` | Add agent + rag components |
| `convex/rag.ts` | Initialize RAG with Gemini |
| `convex/agent.ts` | Initialize Agent with tools |
| `convex/agents/summaryAgent.ts` | Weekly summary generation |
| `convex/agents/patternAgent.ts` | Pattern explanation |
| `convex/agents/plannerAgent.ts` | Hard Mode planning |
| `convex/agents/insightsAgent.ts` | Recovery Q&A |
| `convex/actions/generateWeeklySummary.ts` | Migrate to use Agent |
| `convex/actions/explainPattern.ts` | Migrate to use Agent |
| `convex/actions/generateHardModePlan.ts` | Migrate to use Agent |

## Convex Agents Feature Mapping

| Feature | Status | Notes |
|---------|--------|-------|
| Agent Component | New | Central orchestrator |
| Threads & Messages | New | For Q&A persistence |
| Tools | Existing → Convert | Move from `generateHardModePlan.ts` |
| RAG Context | New | Per-user namespace |
| Workflows | Future | Multi-agent orchestration |
| Streaming | New | Real-time UI feedback |
| Debugging/Playground | New | Iterate on prompts |
| Usage Tracking | Optional | For cost monitoring |
| Rate Limiting | New | Control LLM provider limits |

## Cost Estimation

| Feature | Tokens | Cost |
|---------|--------|------|
| Weekly summary | ~5K | $0.0005 |
| Pattern insight | ~3K | $0.0003 |
| Hard Mode plan | ~8K | $0.0008 |
| Recovery Q&A | ~4K | $0.0004 |

**Monthly estimate (30 daily users):**
- ~$0.05/month for all features combined

## Privacy

- All user data stored in Convex (user's own database)
- RAG uses per-user namespaces
- No data sent to third-party AI services without user action
- API keys stored in environment variables
- User can delete their data at any time
