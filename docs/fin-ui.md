### Finance Tab Refactor Plan: Hub + Focused Subroutes

#### Summary

Refactor apps/native/app/(tabs)/finance/index.tsx from a monolithic 1,250-
line screen into:

1. A lightweight finance hub route (finance/index) for summary + entry
   points.
2. Focused finance detail routes for high-frequency flows (transactions,
   recurring, accounts).
3. Shared domain hooks/components organized by feature so each screen owns
   only its required data.

This preserves current behavior while reducing cognitive and code
complexity, improving maintainability, and preventing overfetch on the hub.

———

### Route Architecture (Decision Complete)

Create a nested stack under the finance tab:

- apps/native/app/(tabs)/finance/\_layout.tsx
- apps/native/app/(tabs)/finance/index.tsx (hub)
- apps/native/app/(tabs)/finance/transactions.tsx
- apps/native/app/(tabs)/finance/recurring.tsx
- apps/native/app/(tabs)/finance/accounts.tsx

Routing behavior:

- /(tabs)/finance opens hub.
- Hub cards navigate via router.push("/(tabs)/finance/transactions"), .../
  recurring, .../accounts.
- The tabs config in apps/native/app/(tabs)/\_layout.tsx remains finance/
  index (no tab URL changes).

finance/\_layout.tsx:

- Use <Stack screenOptions={{ headerShown: false, animation:
  "slide_from_right" }} />.
- This matches existing settings/\_layout.tsx behavior and app navigation
  style.

———

### Screen Responsibilities

#### 1) finance/index.tsx (Hub only)

Keep:

- Header/title/subtitle.
- Compact “Monthly Snapshot”.
- Compact “Monthly Close”.
- Compact “Advanced Overview” teaser.
- CTA cards/buttons linking to:
  - Transactions
  - Recurring
  - Accounts
- AddAccountSheet stays on hub as global quick-create entry point.

Remove from hub (move out):

- Pending imports workflows.
- Search & bulk edit workflows.
- Recurring scheduling/edit/cancel workflows.
- Merchant hint review editor.
- Full recent transactions list.
- Full accounts/savings management views.

#### 2) finance/transactions.tsx

Own:

- Pending imports (confirm/void + suggested envelopes).
- Recent transactions list.
- Search + bulk edit.
- Receipt attach stub action.
- Merchant hint review actions (keep coupled with import classification
  flow).

#### 3) finance/recurring.tsx

Own:

- Recurring scheduler form.
- Existing recurring list.
- Delay (+7d) and cancel actions.

#### 4) finance/accounts.tsx

Own:

- Accounts list.
- Cashflow/runway.
- Savings goals + quick contribute.

———

### Component & Hook Breakdown

Create feature-local modules:

- apps/native/components/finance/hub/FinanceHubSummary.tsx
- apps/native/components/finance/hub/FinanceHubQuickLinks.tsx
- apps/native/components/finance/transactions/PendingImportsSection.tsx
- apps/native/components/finance/transactions/
  TransactionSearchBulkSection.tsx
- apps/native/components/finance/transactions/MerchantHintReviewSection.tsx
- apps/native/components/finance/recurring/RecurringSchedulerSection.tsx
- apps/native/components/finance/recurring/RecurringListSection.tsx
- apps/native/components/finance/accounts/AccountsOverviewSection.tsx
- apps/native/components/finance/accounts/SavingsGoalsSection.tsx

Shared logic hooks:

- apps/native/hooks/finance/useFinanceHubData.ts
- apps/native/hooks/finance/useTransactionsData.ts
- apps/native/hooks/finance/useRecurringData.ts
- apps/native/hooks/finance/useAccountsData.ts
- apps/native/hooks/finance/usePendingImportActions.ts
- apps/native/hooks/finance/useRecurringActions.ts

Rules:

- Screen-owned data fetching (selected approach): each route calls only
  needed Convex refs.
- Keep mutation handlers in hooks, not JSX files.
- Share utility fns (normalizeMerchant, formatDueDate, confidence label) in
  apps/native/lib/finance-utils.ts.

———

### Public Interfaces / Type Changes

No backend contract change required.

Frontend interface additions:

- New route paths:
  - /(tabs)/finance/transactions
  - /(tabs)/finance/recurring
  - /(tabs)/finance/accounts
- New component props contracts (explicit and typed):
  - PendingImportsSectionProps
  - TransactionSearchBulkSectionProps
  - RecurringSchedulerSectionProps
  - AccountsOverviewSectionProps
- New hook return types:
  - UseTransactionsDataResult
  - UseRecurringDataResult
  - UseAccountsDataResult

Keep all existing makeFunctionReference contracts in apps/native/lib/
finance-refs.ts unchanged.

———

### Styling Plan

- Extract finance-only style tokens to feature style modules:
  - apps/native/components/finance/styles.ts
- Reuse existing theme primitives (Colors, Spacing, Typography, Radius).
- Keep current visual language; no redesign in this refactor.

———

### Migration Sequence (Low-Risk)

1. Add finance/\_layout.tsx and new empty route files.
2. Extract shared utility functions to finance-utils.ts.
3. Move transactions-related JSX + handlers into transactions components/
   hooks.
4. Move recurring-related JSX + handlers into recurring components/hooks.
5. Move accounts/goals/cashflow sections into accounts components/hooks.
6. Reduce hub to summary + links + AddAccountSheet.
7. Remove dead state/query/mutation from hub and delete duplicated styles.
8. Run typecheck and app smoke flow.

———

### Test Cases & Scenarios

Functional navigation:

1. Finance tab opens hub with summary cards and links.
2. Hub link opens each detail route with correct animation and back
   behavior.

Transactions flow:

1. Pending import confirm/void still works.
2. “Apply Suggested” still maps envelopes correctly.
3. Bulk select + void works.
4. Bulk assign first envelope works.
5. Receipt stub attach still succeeds.
6. Merchant hint update still works.

Recurring flow:

1. Schedule recurring transaction works.
2. Delay +7d works.
3. Cancel recurring works.

Accounts flow:

1. Accounts render correctly.
2. Income preset logging works.
   Data/perf checks:
3. Hub no longer requests transaction-heavy datasets.
4. Transactions route loads required datasets only.
5. Recurring route loads required datasets only.
6. Accounts route loads required datasets only.

Regression checks:

1. AddAccountSheet still accessible from finance hub.
2. No broken imports from finance-refs.
3. No route conflicts in (tabs) layout.

———

### Assumptions and Defaults Chosen

- Selected navigation model: Hub + detail screens.
- First-class screens: Transactions + Recurring + Accounts.
- Data architecture: Screen-owned hooks (no global provider).
- Keep backend API and Convex function identifiers unchanged.
- Keep finance tab entrypoint unchanged at finance/index to avoid tab nav
  churn.
