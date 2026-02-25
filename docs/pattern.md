Based on my analysis, here's the current state and plan:
Current State
Backend is complete:

- Schema: patterns table (schema.ts:139-159)
- Query: activePatterns returns up to 3 active patterns sorted by pinned → confidence (queries/activePatterns.ts:5-36)
- Mutations: dismissPattern, pinPattern (commands/patterns/)
- Detection action: Runs nightly at 2 AM, detects 3 pattern types:
  - mood_habit - mood correlation with habit completions
  - energy_checkin_timing - energy vs check-in timing  
  - spending_mood - spending on low-mood days
Frontend is incomplete:
- UI is fully built with animations, dismiss, pin, expand
- Currently uses hardcoded MOCK_PATTERNS (index.tsx:30-64)
What Needs to Be Done

1. Replace mock data with query - Call api.queries.activePatterns.activePatterns
2. Wire up mutations - Replace local state handlers with:
   - api.commands.dismissPattern.dismissPattern
   - api.commands.pinPattern.pinPattern
3. Data shape mismatch - Backend returns subtext (not detail), needs mapping
The UI already handles the max-3 display, pinned filtering, and animations correctly. Just needs backend integration.
Would you like me to proceed with implementing this connection?
