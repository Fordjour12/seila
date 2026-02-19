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

export default crons;
