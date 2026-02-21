import { describe, expect, test } from "../test-compat.js";

import {
  financeReducer,
  handleFinanceCommand,
  initialFinanceState,
  type FinanceCommand,
  type FinanceEvent,
  type FinanceState,
} from "../finance.js";
import { createTraceHarness } from "../trace-harness.js";

const NOW = Date.now();

const financeTrace = createTraceHarness<FinanceState, FinanceEvent, FinanceCommand>({
  initialState: initialFinanceState,
  reduce: financeReducer,
  handleCommand: handleFinanceCommand,
});

describe("finance reducer", () => {
  test("setEnvelope creates envelope", () => {
    const trace = financeTrace
      .given([])
      .when({
        type: "finance.setEnvelope",
        idempotencyKey: "env-1",
        requestedAt: NOW,
        payload: {
          envelopeId: "env-food",
          name: "Food",
          softCeiling: 25000,
        },
        meta: {},
      })
      .expect({
        envelopes: {
          "env-food": {
            envelopeId: "env-food",
            name: "Food",
            softCeiling: 25000,
            emoji: undefined,
            isPrivate: false,
          },
        },
        recentTransactions: [],
        inbox: [],
      });

    expect(trace.pass).toBe(true);
  });

  test("logTransaction records manual transaction", () => {
    const trace = financeTrace.given([]).when({
      type: "finance.logTransaction",
      idempotencyKey: "tx-1",
      requestedAt: NOW,
      payload: {
        transactionId: "tx-1",
        amount: 1299,
        envelopeId: "env-food",
        source: "manual",
        merchantHint: "Cafe",
      },
      meta: {},
    });

    expect(trace.state.recentTransactions[0]?.transactionId).toBe("tx-1");
    expect(trace.state.recentTransactions[0]?.pendingImport).toBe(false);
    expect(trace.state.inbox).toHaveLength(0);
  });

  test("import -> confirm flow removes transaction from inbox", () => {
    const importedEvents = handleFinanceCommand([], {
      type: "finance.importTransaction",
      idempotencyKey: "import-1",
      requestedAt: NOW,
      payload: {
        transactionId: "imp-1",
        amount: 4200,
        merchantHint: "Market",
      },
      meta: {},
    });

    const importState = importedEvents.reduce(financeReducer, initialFinanceState);
    expect(importState.inbox).toHaveLength(1);
    expect(importState.inbox[0]?.pendingImport).toBe(true);

    const confirmEvents = handleFinanceCommand(importedEvents, {
      type: "finance.confirmTransaction",
      idempotencyKey: "confirm-1",
      requestedAt: NOW + 1000,
      payload: {
        transactionId: "imp-1",
        envelopeId: "env-food",
      },
      meta: {},
    });

    const finalState = [...importedEvents, ...confirmEvents].reduce(
      financeReducer,
      initialFinanceState,
    );

    expect(finalState.inbox).toHaveLength(0);
    expect(finalState.recentTransactions[0]?.pendingImport).toBe(false);
    expect(finalState.recentTransactions[0]?.envelopeId).toBe("env-food");
  });

  test("voidTransaction marks transaction voided", () => {
    const state = [
      ...handleFinanceCommand([], {
        type: "finance.logTransaction",
        idempotencyKey: "tx-void",
        requestedAt: NOW,
        payload: {
          transactionId: "tx-void",
          amount: 555,
          source: "manual",
        },
        meta: {},
      }),
      ...handleFinanceCommand([], {
        type: "finance.voidTransaction",
        idempotencyKey: "void-1",
        requestedAt: NOW + 1000,
        payload: {
          transactionId: "tx-void",
        },
        meta: {},
      }),
    ].reduce(financeReducer, initialFinanceState);

    expect(state.recentTransactions[0]?.voided).toBe(true);
  });
});
