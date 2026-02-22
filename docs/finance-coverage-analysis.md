# Finance Application Coverage Analysis

## Overview

This document analyzes the coverage between `@apps/native/app/(tabs)/finance/` (frontend) and `@packages/backend/` (backend Convex functions) to identify what is implemented, what is missing, and what can be removed.

---

## Fully Covered Features

| Feature | Frontend Files | Backend Functions |
|---------|----------------|-------------------|
| Budget Envelopes | `add-envelope.tsx`, `edit-envelope.tsx` | `setEnvelope`, `envelopeSummary`, `budgetDepth` |
| Transactions | `transactions.tsx`, `add-transaction.tsx` | `logTransaction`, `importTransaction`, `confirmImportedTransaction`, `voidTransaction`, `transactionInbox`, `transactionSearch` |
| Accounts | `accounts.tsx`, `add-account.tsx` | `setAccount`, `accountSummary`, `hideAccount`, `logIncome` |
| Recurring | `recurring.tsx`, `add-recurring.tsx`, `edit-recurring.tsx` | `scheduleRecurringTransaction`, `updateRecurringTransaction`, `cancelRecurringTransaction`, `recurringTransactions` |
| Savings Goals | `savings/index.tsx`, `savings/add.tsx`, `savings/edit.tsx` | `setSavingsGoal`, `contributeSavingsGoal`, `deleteSavingsGoal`, `savingsGoals` |
| Merchant Hints | `merchant-hints.tsx` | `merchantEnvelopeHints`, `merchantHintReview`, `setMerchantEnvelopeHint` |
| Insights | `insights.tsx` | `spendingAnomalies`, `budgetDepth`, `debtStrategy`, `investmentSummary`, `taxEstimate`, `netWorthView`, `subscriptionsOverview` |
| Cashflow | `accounts.tsx` | `cashflowSummary`, `cashflowForecast` |
| Receipts | `transactions.tsx` | `attachReceipt`, `receiptsByTransaction` |
| Tags | `transactions.tsx` | `setTransactionTags` |
| FX Rates | `insights.tsx` | `setFxRate`, `multiCurrencySummary` |
| Security Settings | `insights.tsx` | `setFinanceSecuritySettings`, `financeSecuritySettings` |
| Weekly Check-in | `insights.tsx` | `upsertWeeklyMoneyCheckin`, `currentWeeklyMoneyCheckin` |
| Monthly Close | `insights.tsx` | `monthlyCloseSummary`, `monthlyCloseExport` |
| Low Spend Challenge | `insights.tsx` | `startLowSpendReset`, `lowSpendResets` table |

---

## Missing Features

### Critical (UI Cannot Function Properly)

All previously identified critical issues are now implemented.

### Missing Screens (Backend Exists, No UI)

All previously missing finance management screens are now available:
- `debt.tsx`
- `investments.tsx`
- `subscriptions.tsx`
- `shared-budgets.tsx`

### Nice-to-Have (Partial Implementation)

| Feature | Status |
|---------|--------|
| Edit Transaction | Implemented with dedicated `edit-transaction.tsx` flow |
| Delete/Archive Account | Archive UI implemented using `hideAccount` |
| Multi-currency | FX controls hidden in Insights for GHS-first UX |

---

## Can Do Away Without

These backend functions are unused by the frontend and can be removed:

| Function | Type | Recommendation |
|----------|------|----------------|
| `savingsSimulation` | Query | Remove — unused by UI |
| `billReminders` | Query | Remove — `subscriptionsOverview` covers this |
| `processCapture` | Action | Remove — AI chat feature not implemented in UI |
| `generateWeeklySummary` | Action | Remove — AI summary not implemented in UI |
| `recordRecurringTelemetry` | Mutation | Remove — internal telemetry |
| `updateAccountBalance` | Mutation | Remove — balance auto-calculates from transactions |
| Low-spend reset UI | Partial | Feature incomplete, can disable |

---

## Can't Do Away Without (Core Essentials)

These are the minimum required features for a functional finance app:

### Required Backend Functions

| Category | Required Queries | Required Mutations |
|----------|------------------|---------------------|
| **Envelopes** | `envelopeSummary` | `setEnvelope` |
| **Transactions** | `transactionInbox`, `transactionSearch` | `logTransaction`, `importTransaction`, `confirmImportedTransaction`, `voidTransaction` |
| **Accounts** | `accountSummary` | `setAccount`, `logIncome` |
| **Recurring** | `recurringTransactions` | `scheduleRecurringTransaction`, `updateRecurringTransaction`, `cancelRecurringTransaction` |
| **Savings Goals** | `savingsGoals` | `setSavingsGoal`, `contributeSavingsGoal` |
| **Cashflow** | `cashflowSummary` | — |
| **Spending Trends** | `spendingTrend` | — |
| **Insights** | `netWorthView`, `spendingAnomalies` | — |

---

## Recommended Actions

### Priority 1 (Critical) - Done

1. Fix `updateRecurringTransaction` to support `amount` and `merchantHint` updates
2. Implement `assign_envelope` action in `bulkUpdateTransactions`

### Priority 2 (Complete the Loop) - Done

3. Create debt management screen or remove `setDebt`, `debtStrategy`
4. Create investment management screen or remove `setInvestment`, `investmentSummary`
5. Create subscription management screen or remove `setSubscription`
6. Create shared budget management screen or remove `setSharedBudget`, `sharedBudgetSummary`

### Priority 3 (Cleanup) - Remaining

7. Remove unused backend functions listed in "Can Do Away Without"
8. Disable or fully complete low-spend reset flow

---

## Schema Tables Reference

| Table | Purpose |
|-------|---------|
| `accounts` | Bank accounts, credit cards, cash |
| `transactions` | Expense transactions |
| `incomes` | Income records |
| `envelopes` | Budget categories/envelopes |
| `savingsGoals` | Savings goals tracking |
| `subscriptions` | Recurring subscriptions |
| `debts` | Debt/loan tracking |
| `investments` | Investment holdings |
| `sharedBudgets` | Shared/group budgets |
| `fxRates` | Foreign exchange rates |
| `weeklyMoneyCheckins` | Weekly money check-ins |
| `lowSpendResets` | Low-spend challenge periods |
| `financeSecuritySettings` | Security settings |
| `receiptAttachments` | Receipt attachments |
| `events` | Audit/event log |

---

## Statistics

| Category | Count |
|----------|-------|
| Fully Covered Features | 14 |
| Missing Features (needs work) | 8 |
| Removable Backend Items | 8 |
| Core Essential Features | 8 |

---

*Generated: February 2026*
