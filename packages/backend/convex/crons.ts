import { cronJobs } from "convex/server";
import { makeFunctionReference } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();
const processRecurringTransactionsRef = makeFunctionReference<
  "action",
  {},
  { processed: number }
>("actions/processRecurringTransactions:processRecurringTransactions");

crons.interval(
  "run policy engine",
  { hours: 1 },
  internal.policies.runner.runPolicyEngine,
  {},
);

crons.cron(
  "detect patterns nightly",
  "0 2 * * *",
  internal.actions.detectPatterns.detectPatterns,
  {},
);

crons.cron(
  "close hard mode day",
  "0 23 * * *",
  internal.actions.closeHardModeDay.closeHardModeDay,
  {},
);

crons.interval(
  "process recurring transactions",
  { minutes: 30 },
  processRecurringTransactionsRef,
  {},
);

export default crons;
