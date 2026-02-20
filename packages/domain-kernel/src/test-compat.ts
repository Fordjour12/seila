type TestFn = () => void | Promise<void>;

type RegisteredTest = {
  fullName: string;
  fn: TestFn;
};

const suiteStack: string[] = [];
const registeredTests: RegisteredTest[] = [];

function formatValue(value: unknown): string {
  return typeof value === "string" ? `"${value}"` : String(value);
}

function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export function describe(name: string, fn: () => void): void {
  suiteStack.push(name);
  try {
    fn();
  } finally {
    suiteStack.pop();
  }
}

export function test(name: string, fn: TestFn): void {
  const prefix = suiteStack.length > 0 ? `${suiteStack.join(" > ")} > ` : "";
  registeredTests.push({ fullName: `${prefix}${name}`, fn });
}

export function expect<T>(actual: T) {
  const baseMatchers = {
    toBe(expected: T): void {
      assertCondition(
        Object.is(actual, expected),
        `Expected ${formatValue(actual)} to be ${formatValue(expected)}`,
      );
    },
    toEqual(expected: unknown): void {
      const left = JSON.stringify(actual);
      const right = JSON.stringify(expected);
      assertCondition(
        left === right,
        `Expected ${left} to deeply equal ${right}`,
      );
    },
    toHaveLength(expectedLength: number): void {
      assertCondition(
        actual !== null &&
          actual !== undefined &&
          "length" in (actual as unknown as object) &&
          typeof (actual as unknown as { length: unknown }).length === "number",
        "Expected value to have a numeric length property",
      );
      const length = (actual as unknown as { length: number }).length;
      assertCondition(
        length === expectedLength,
        `Expected length ${length} to be ${expectedLength}`,
      );
    },
    toBeDefined(): void {
      assertCondition(
        actual !== undefined,
        "Expected value to be defined",
      );
    },
    toBeNull(): void {
      assertCondition(actual === null, `Expected ${formatValue(actual)} to be null`);
    },
    toBeUndefined(): void {
      assertCondition(
        actual === undefined,
        `Expected ${formatValue(actual)} to be undefined`,
      );
    },
    toBeGreaterThanOrEqual(expected: number): void {
      assertCondition(
        typeof actual === "number",
        "Expected value to be a number",
      );
      const value = actual as unknown as number;
      assertCondition(
        value >= expected,
        `Expected ${value} to be greater than or equal to ${expected}`,
      );
    },
    toThrow(expected?: string | RegExp): void {
      assertCondition(
        typeof actual === "function",
        "toThrow requires a function value",
      );
      let threw = false;
      let thrownMessage = "";
      try {
        (actual as unknown as () => unknown)();
      } catch (error) {
        threw = true;
        thrownMessage = error instanceof Error ? error.message : String(error);
      }
      assertCondition(threw, "Expected function to throw");
      if (typeof expected === "string") {
        assertCondition(
          thrownMessage.includes(expected),
          `Expected thrown message "${thrownMessage}" to include "${expected}"`,
        );
      }
      if (expected instanceof RegExp) {
        assertCondition(
          expected.test(thrownMessage),
          `Expected thrown message "${thrownMessage}" to match ${expected.toString()}`,
        );
      }
    },
  };

  const notMatchers = {
    toBe(expected: T): void {
      assertCondition(
        !Object.is(actual, expected),
        `Expected ${formatValue(actual)} not to be ${formatValue(expected)}`,
      );
    },
    toBeNull(): void {
      assertCondition(actual !== null, "Expected value not to be null");
    },
    toBeUndefined(): void {
      assertCondition(actual !== undefined, "Expected value not to be undefined");
    },
    toEqual(expected: unknown): void {
      const left = JSON.stringify(actual);
      const right = JSON.stringify(expected);
      assertCondition(left !== right, `Expected ${left} not to deeply equal ${right}`);
    },
  };

  return {
    ...baseMatchers,
    not: notMatchers,
  };
}

export async function runRegisteredTests(): Promise<void> {
  let passed = 0;
  let failed = 0;

  for (const entry of registeredTests) {
    try {
      await entry.fn();
      passed += 1;
      console.log(`PASS ${entry.fullName}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${entry.fullName}`);
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(String(error));
      }
    }
  }

  console.log(`\nTests: ${passed} passed, ${failed} failed, ${registeredTests.length} total`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}
