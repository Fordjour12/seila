import { makeFunctionReference } from "convex/server";
import type { Id } from "@seila/backend/convex/_generated/dataModel";

export const monthlyCloseSummaryRef = makeFunctionReference<
  "query",
  {},
  {
    monthStart: number;
    totalSpent: number;
    totalBudget: number;
    overspendAreas: string[];
    win: string;
    focus: string;
  }
>("queries/monthlyCloseSummary:monthlyCloseSummary");

export const recurringTransactionsRef = makeFunctionReference<
  "query",
  { limit?: number },
  Array<{
    recurringId: string;
    amount: number;
    cadence: "weekly" | "biweekly" | "monthly";
    nextDueAt: number;
    kind: "regular" | "subscription";
    category?: string;
    envelopeId?: string;
    merchantHint?: string;
    note?: string;
    createdAt: number;
  }>
>("queries/recurringTransactions:recurringTransactions");

export const recurringOverviewRef = makeFunctionReference<
  "query",
  { limit?: number },
  {
    items: Array<{
      recurringId: string;
      amount: number;
      cadence: "weekly" | "biweekly" | "monthly";
      nextDueAt: number;
      kind: "regular" | "subscription";
      category?: string;
      envelopeId?: string;
      merchantHint?: string;
      note?: string;
      createdAt: number;
    }>;
    summary: {
      activeCount: number;
      dueSoonCount: number;
      monthlyEquivalentTotal: number;
      subscriptionCount: number;
      subscriptionMonthlyEquivalent: number;
      regularCount: number;
      regularMonthlyEquivalent: number;
    };
  }
>("queries/recurringOverview:recurringOverview");

export const scheduleRecurringTransactionRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    amount: number;
    cadence: "weekly" | "biweekly" | "monthly";
    nextDueAt: number;
    envelopeId?: Id<"envelopes">;
    merchantHint?: string;
    note?: string;
    kind?: "regular" | "subscription";
    category?: string;
  },
  { recurringId?: string; deduplicated: boolean }
>("commands/recurring/scheduleRecurringTransaction:scheduleRecurringTransaction");

export const updateRecurringTransactionRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    recurringId: string;
    amount?: number;
    cadence?: "weekly" | "biweekly" | "monthly";
    nextDueAt?: number;
    envelopeId?: Id<"envelopes">;
    clearEnvelope?: boolean;
    merchantHint?: string;
    note?: string;
    kind?: "regular" | "subscription";
    category?: string;
    clearCategory?: boolean;
  },
  { recurringId?: string; deduplicated: boolean }
>("commands/recurring/updateRecurringTransaction:updateRecurringTransaction");

export const cancelRecurringTransactionRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; recurringId: string },
  { recurringId?: string; deduplicated: boolean }
>("commands/recurring/cancelRecurringTransaction:cancelRecurringTransaction");

export const setAccountRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    accountId?: Id<"accounts">;
    name: string;
    type: "checking" | "savings" | "cash" | "credit" | "other";
    balance?: number;
    currency?: string;
    institution?: string;
  },
  { accountId?: Id<"accounts">; deduplicated: boolean }
>("commands/setAccount:setAccount");

export const accountSummaryRef = makeFunctionReference<
  "query",
  {},
  {
    accounts: Array<{
      accountId: string;
      name: string;
      type: "checking" | "savings" | "cash" | "credit" | "other";
      balance: number;
      currency?: string;
      institution?: string;
    }>;
    totalBalance: number;
    byType: Record<string, number>;
  }
>("queries/accountSummary:accountSummary");

export const cashflowSummaryRef = makeFunctionReference<
  "query",
  {},
  {
    monthIncome: number;
    monthExpense: number;
    netCashflow: number;
    totalBalance: number;
    dailyBurn: number;
    runwayDays: number | null;
  }
>("queries/cashflowSummary:cashflowSummary");

export const logIncomeRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    amount: number;
    source?: string;
    note?: string;
    occurredAt?: number;
  },
  { incomeId?: Id<"incomes">; deduplicated: boolean }
>("commands/logIncome:logIncome");

export const savingsGoalsRef = makeFunctionReference<
  "query",
  {},
  Array<{
    goalId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    envelopeId?: string;
    deadlineAt?: number;
    progress: number;
  }>
>("queries/savingsGoals:savingsGoals");

export const setSavingsGoalRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    goalId?: Id<"savingsGoals">;
    name: string;
    targetAmount: number;
    currentAmount?: number;
    envelopeId?: Id<"envelopes">;
    deadlineAt?: number;
  },
  { goalId?: Id<"savingsGoals">; deduplicated: boolean }
>("commands/setSavingsGoal:setSavingsGoal");

export const contributeSavingsGoalRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; goalId: Id<"savingsGoals">; amount: number },
  { goalId?: Id<"savingsGoals">; deduplicated: boolean }
>("commands/setSavingsGoal:contributeSavingsGoal");

export const deleteSavingsGoalRef = makeFunctionReference<
  "mutation",
  { goalId: Id<"savingsGoals"> },
  { success: boolean }
>("commands/setSavingsGoal:deleteSavingsGoal");

export const transactionSearchRef = makeFunctionReference<
  "query",
  {
    q?: string;
    envelopeId?: Id<"envelopes">;
    minAmount?: number;
    maxAmount?: number;
    includeVoided?: boolean;
    limit?: number;
  },
  Array<{
    _id: Id<"transactions">;
    amount: number;
    envelopeId?: Id<"envelopes">;
    merchantHint?: string;
    note?: string;
    occurredAt: number;
    pendingImport: boolean;
    voidedAt?: number;
  }>
>("queries/transactionSearch:transactionSearch");

export const bulkUpdateTransactionsRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    transactionIds: Id<"transactions">[];
    action: "void" | "assign_envelope";
    envelopeId?: Id<"envelopes">;
  },
  { deduplicated: boolean; updated: number }
>("commands/bulkUpdateTransactions:bulkUpdateTransactions");

export const attachReceiptRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    transactionId: Id<"transactions">;
    storageId: string;
    fileName?: string;
    mimeType?: string;
  },
  { receiptId?: Id<"receiptAttachments">; deduplicated: boolean }
>("commands/attachReceipt:attachReceipt");

export const debtStrategyRef = makeFunctionReference<
  "query",
  { strategy?: "snowball" | "avalanche" },
  {
    strategy: "snowball" | "avalanche";
    totalBalance: number;
    totalMinPayment: number;
    nextFocus: { debtId: string; name: string; balance: number; aprBps: number } | null;
    debts: Array<{
      debtId: string;
      name: string;
      balance: number;
      aprBps: number;
      minPayment: number;
    }>;
  }
>("queries/debtStrategy:debtStrategy");

export const investmentSummaryRef = makeFunctionReference<
  "query",
  {},
  {
    totalValue: number;
    totalCostBasis: number;
    unrealizedPnl: number;
    items: Array<{
      investmentId: string;
      name: string;
      type: "stock" | "fund" | "crypto" | "cash" | "other";
      currentValue: number;
      costBasis: number;
    }>;
  }
>("queries/investmentSummary:investmentSummary");

export const taxEstimateRef = makeFunctionReference<
  "query",
  {},
  { ytdIncome: number; estimatedTax: number; effectiveRateBps: number }
>("queries/taxEstimate:taxEstimate");

export const sharedBudgetSummaryRef = makeFunctionReference<
  "query",
  {},
  {
    totalBudget: number;
    totalSpent: number;
    utilization: number;
    items: Array<{
      sharedBudgetId: string;
      name: string;
      budgetAmount: number;
      spentAmount: number;
      members: string[];
    }>;
  }
>("queries/sharedBudgetSummary:sharedBudgetSummary");

export const cashflowForecastRef = makeFunctionReference<
  "query",
  {},
  {
    dailyIncome: number;
    dailyExpense: number;
    forecast30Net: number;
    expectedIncome30: number;
    expectedExpense30: number;
  }
>("queries/cashflowForecast:cashflowForecast");

export const setDebtRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    debtId?: Id<"debts">;
    name: string;
    balance: number;
    aprBps: number;
    minPayment: number;
    isActive?: boolean;
  },
  { debtId?: Id<"debts">; deduplicated: boolean }
>("commands/setDebt:setDebt");

export const setInvestmentRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    investmentId?: Id<"investments">;
    name: string;
    type: "stock" | "fund" | "crypto" | "cash" | "other";
    currentValue: number;
    costBasis: number;
  },
  { investmentId?: Id<"investments">; deduplicated: boolean }
>("commands/setInvestment:setInvestment");

export const setSharedBudgetRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    sharedBudgetId?: Id<"sharedBudgets">;
    name: string;
    budgetAmount: number;
    spentAmount?: number;
    members: string[];
  },
  { sharedBudgetId?: Id<"sharedBudgets">; deduplicated: boolean }
>("commands/setSharedBudget:setSharedBudget");

export const hideAccountRef = makeFunctionReference<
  "mutation",
  { accountId: Id<"accounts">; hidden: boolean },
  void
>("commands/setAccount:hideAccount");

export const transactionByIdRef = makeFunctionReference<
  "query",
  { transactionId: Id<"transactions"> },
  {
    _id: Id<"transactions">;
    amount: number;
    envelopeId?: Id<"envelopes">;
    source: "manual" | "imported";
    merchantHint?: string;
    note?: string;
    tags?: string[];
    occurredAt: number;
    pendingImport: boolean;
    voidedAt?: number;
    createdAt: number;
    updatedAt: number;
  }
>("queries/transactionById:transactionById");

export const updateTransactionRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    transactionId: Id<"transactions">;
    amount?: number;
    envelopeId?: Id<"envelopes">;
    clearEnvelope?: boolean;
    merchantHint?: string;
    note?: string;
  },
  { transactionId?: Id<"transactions">; deduplicated: boolean }
>("commands/updateTransaction:updateTransaction");

export const budgetDepthRef = makeFunctionReference<
  "query",
  {},
  Array<{
    envelopeId: string;
    name: string;
    ceiling: number;
    currentSpent: number;
    rollover: number;
    available: number;
  }>
>("queries/budgetDepth:budgetDepth");

export const spendingAnomaliesRef = makeFunctionReference<
  "query",
  {},
  {
    recent: number;
    baseline: number;
    anomalies: Array<{ type: string; headline: string; ratio: number }>;
  }
>("queries/spendingAnomalies:spendingAnomalies");

export const startLowSpendResetRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; durationDays?: number; reason?: string },
  { resetId?: Id<"lowSpendResets">; deduplicated: boolean }
>("commands/startLowSpendReset:startLowSpendReset");

export const currentWeeklyMoneyCheckinRef = makeFunctionReference<
  "query",
  {},
  {
    checkinId: string;
    weekStart: number;
    wins: string[];
    overspendAreas: string[];
    correction: string;
    focus: string;
  } | null
>("queries/weeklyMoneyCheckin:currentWeeklyMoneyCheckin");

export const upsertWeeklyMoneyCheckinRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    weekStart: number;
    wins: string[];
    overspendAreas: string[];
    correction: string;
    focus: string;
  },
  { checkinId?: Id<"weeklyMoneyCheckins">; deduplicated: boolean }
>("commands/weeklyMoneyCheckin:upsertWeeklyMoneyCheckin");

export const monthlyCloseExportRef = makeFunctionReference<
  "query",
  {},
  { shareText: string; csv: string }
>("queries/monthlyCloseExport:monthlyCloseExport");

export const billRemindersRef = makeFunctionReference<
  "query",
  {},
  { dueSoon: Array<{ subscriptionId: string; name: string; amount: number; nextDueAt: number }> }
>("queries/billReminders:billReminders");

export const netWorthViewRef = makeFunctionReference<
  "query",
  {},
  {
    assets: number;
    liabilities: number;
    netWorth: number;
    breakdown: { accounts: number; investments: number; debts: number };
  }
>("queries/netWorthView:netWorthView");

export const multiCurrencySummaryRef = makeFunctionReference<
  "query",
  {},
  {
    baseCurrency: string;
    estimatedTotalInBase: number;
    currencies: Array<{ currency: string; amount: number }>;
  }
>("queries/multiCurrencySummary:multiCurrencySummary");

export const setFxRateRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    baseCurrency: string;
    quoteCurrency: string;
    rateScaled: number;
    asOf?: number;
  },
  { recordId?: Id<"fxRates">; deduplicated: boolean }
>("commands/setFxRate:setFxRate");

export const setTransactionTagsRef = makeFunctionReference<
  "mutation",
  { idempotencyKey: string; transactionId: Id<"transactions">; tags: string[] },
  { transactionId?: Id<"transactions">; tags?: string[]; deduplicated: boolean }
>("commands/setTransactionTags:setTransactionTags");

export const financeSecuritySettingsRef = makeFunctionReference<
  "query",
  {},
  {
    biometricLockEnabled: boolean;
    offlineModeEnabled: boolean;
    conflictSafeSyncEnabled: boolean;
  }
>("queries/financeSecuritySettings:financeSecuritySettings");

export const setFinanceSecuritySettingsRef = makeFunctionReference<
  "mutation",
  {
    idempotencyKey: string;
    biometricLockEnabled: boolean;
    offlineModeEnabled: boolean;
    conflictSafeSyncEnabled: boolean;
  },
  { settingsId?: Id<"financeSecuritySettings">; deduplicated: boolean }
>("commands/setFinanceSecuritySettings:setFinanceSecuritySettings");
