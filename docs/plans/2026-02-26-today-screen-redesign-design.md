# Today Screen Redesign (Executive Dashboard)

Date: 2026-02-26
Status: Approved

## Objective
Redesign `apps/native/app/(tabs)/index.tsx` into a high-signal executive Today dashboard that emphasizes:
- overviews
- today's tasks
- prioritized actions
- polished suggestion cards

## Scope
- Visual and UX redesign using existing data sources.
- Lightweight personalization with deterministic local heuristics.
- No backend query or schema changes in this phase.

## Architecture
- `index.tsx` becomes the orchestration + rendering layer for a composed dashboard.
- Core sections:
  - `Today Brief` hero narrative
  - KPI rail (`Focus`, `Habits`, `Mood`)
  - `Primary Actions` (top 3 personalized)
  - `Today's Tasks` (focus and urgent inbox)
  - `Suggestion Studio` (ranked recommendation cards)

## Data Sources
- `tasksFocusRef`
- `tasksInboxRef`
- `todayHabitsRef({ dayKey })`
- `quietTodayRef`
- `todayScratchpadRef`
- `api.queries.lastCheckin.lastCheckin`
- `api.queries.activeSuggestions.activeSuggestions`

## Personalization Heuristics
Action candidates are scored and ranked by urgency + impact + momentum:
- Missing check-in => high priority
- Low capacity (`mood<=2 || energy<=2`) => recommend quiet mode
- Overdue tasks => prioritize tasks
- No focus tasks but inbox present => prioritize setting focus
- Pending habits => streak-protection action
- Scratchpad backlog => triage action
- Quiet day active => resume-day action

Output constraints:
- max 3 primary actions
- deterministic sort and stable behavior

## UX Behavior
- Hero text adapts to quiet-day and top-ranked action.
- KPI rail gives immediate status at a glance.
- Task section surfaces focus first, then inbox urgency.
- Suggestion studio merges backend suggestions + local top actions and ranks by score.

## Success Criteria
- Today screen reads as a coherent dashboard, not a feed.
- First actionable decision is visible without scrolling much.
- Suggestions are visibly prioritized and relevant to current state.
- Navigation to related areas is one tap from each section.
