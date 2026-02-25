import "./__tests__/checkin.test.js";
import "./__tests__/finance.test.js";
import "./__tests__/habits.test.js";
import "./__tests__/hard-mode.test.js";
import "./__tests__/patterns.test.js";
import "./__tests__/policies.test.js";
import "./__tests__/tasks.test.js";
import "./__tests__/trace-harness.test.js";
import "./__tests__/weekly-review.test.js";
import { runRegisteredTests } from "./test-compat.js";

void runRegisteredTests();
