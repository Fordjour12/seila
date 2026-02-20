import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

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

export default crons;
