# OpenRouter Provider Replacement

Date: 2026-02-26
Status: Approved

## Objective
Replace Gemini as the AI provider globally and route all backend agents through OpenRouter.

## Decision Summary
- Rollout mode: global replacement (no fallback).
- Integration point: shared model resolver in `packages/backend/convex/agent.ts`.
- Runtime provider: `@openrouter/ai-sdk-provider`.

## Architecture
- Keep all existing `Agent` definitions, tools, prompts, and maxSteps.
- Create one shared `defaultLanguageModel` in `agent.ts`.
- Make each agent consume `defaultLanguageModel` instead of local provider calls.

## Configuration
- Required env: `OPENROUTER_API_KEY`.
- Optional env: `OPENROUTER_MODEL` (default: `openai/gpt-4o-mini`).
- Missing API key behavior: throw explicit error at startup/runtime module load.

## Error Handling
- No silent fallback to Gemini.
- Existing agent/tool errors remain unchanged.
- Misconfiguration fails fast with a clear provider error.

## Testing & Verification
- Run backend typecheck: `cd packages/backend && bun run check-types`.
- Run Convex dev and trigger one agent flow to verify OpenRouter execution path.
- Confirm no schema, function contract, or tool shape changes.
