# Tabbar Search Hybrid Mobile Design

Date: 2026-02-25
Status: Approved and implemented

## Goal
Create a mobile-first hybrid search experience for the bottom tab bar:
- anchored dropdown for short/simple result sets
- automatic full-screen search sheet for larger result sets

## UX Decision Summary
- Interaction model: Hybrid (anchored + full-screen)
- Auto-expand trigger: when results count >= 3 or dropdown content would exceed height cap
- Full-screen behavior: covers tab bar fully

## Architecture
- Search data remains in `useSearchResults`.
- New controller hook (`useTabSearchController`) orchestrates:
  - query and focus state
  - dropdown visibility
  - full-screen visibility
  - close/reset behavior
- `TabBar` renders:
  - compact search input (base)
  - anchored dropdown when focused and not auto-expanded
  - full-screen overlay when auto-expanded

## Data and Navigation Contracts
- Correct query/shape usage:
  - habits query requires `dayKey` and returns `habitId`
  - tasks uses `inbox`
  - account summary uses `accounts[]` with `accountId`
  - envelopes use `envelopeId`
  - savings goals use `goalId`
- Route param contract:
  - `id`: habits/tasks/budget/savings edit routes
  - `transactionId`: finance transaction edit route
- Accounts navigate to existing `/(tabs)/finance/accounts` screen.

## Mobile UX Details
- Enter key submits first result
- Selection haptic feedback
- Larger list-row touch targets
- Grouped sections in full-screen results with optional show more/less

## Verification
- Manually verify:
  - short query -> anchored dropdown
  - broad query -> full-screen sheet
  - selection closes search and navigates correctly
  - query clear collapses sheet/dropdown
- Typecheck currently has unrelated pre-existing errors in workspace; this feature avoids changing those paths.
