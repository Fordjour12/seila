import type { Command, LifeEvent } from "./index.js";

export type FinanceSource = "manual" | "imported";

export type FinanceCommand =
  | Command<
      "finance.setEnvelope",
      {
        envelopeId: string;
        name: string;
        softCeiling?: number;
        emoji?: string;
        isPrivate?: boolean;
      }
    >
  | Command<
      "finance.logTransaction",
      {
        transactionId: string;
        amount: number;
        envelopeId?: string;
        source: FinanceSource;
        merchantHint?: string;
        note?: string;
      }
    >
  | Command<
      "finance.importTransaction",
      {
        transactionId: string;
        amount: number;
        merchantHint?: string;
        note?: string;
      }
    >
  | Command<"finance.confirmTransaction", { transactionId: string; envelopeId?: string }>
  | Command<"finance.voidTransaction", { transactionId: string }>;

export type FinanceEvent =
  | LifeEvent<
      "finance.envelopeCreated",
      {
        envelopeId: string;
        name: string;
        softCeiling?: number;
        emoji?: string;
        isPrivate: boolean;
      }
    >
  | LifeEvent<
      "finance.transactionLogged",
      {
        transactionId: string;
        amount: number;
        envelopeId?: string;
        source: FinanceSource;
        merchantHint?: string;
        note?: string;
      }
    >
  | LifeEvent<
      "finance.transactionImported",
      {
        transactionId: string;
        amount: number;
        merchantHint?: string;
        note?: string;
      }
    >
  | LifeEvent<
      "finance.transactionConfirmed",
      {
        transactionId: string;
        envelopeId?: string;
      }
    >
  | LifeEvent<"finance.transactionVoided", { transactionId: string }>
  | LifeEvent<"finance.envelopeCeilingUpdated", { envelopeId: string; softCeiling?: number }>;

export type Envelope = {
  envelopeId: string;
  name: string;
  softCeiling?: number;
  emoji?: string;
  isPrivate: boolean;
};

export type Transaction = {
  transactionId: string;
  amount: number;
  envelopeId?: string;
  source: FinanceSource;
  merchantHint?: string;
  note?: string;
  occurredAt: number;
  pendingImport: boolean;
  voided: boolean;
};

export type FinanceState = {
  envelopes: Record<string, Envelope>;
  recentTransactions: Transaction[];
  inbox: Transaction[];
};

export const initialFinanceState: FinanceState = {
  envelopes: {},
  recentTransactions: [],
  inbox: [],
};

function upsertTransaction(transactions: Transaction[], next: Transaction): Transaction[] {
  const index = transactions.findIndex(
    (transaction) => transaction.transactionId === next.transactionId,
  );

  if (index === -1) {
    return [next, ...transactions];
  }

  const updated = transactions.slice();
  updated[index] = next;
  return updated;
}

export function financeReducer(state: FinanceState, event: FinanceEvent): FinanceState {
  if (event.type === "finance.envelopeCreated") {
    return {
      ...state,
      envelopes: {
        ...state.envelopes,
        [event.payload.envelopeId]: {
          envelopeId: event.payload.envelopeId,
          name: event.payload.name,
          softCeiling: event.payload.softCeiling,
          emoji: event.payload.emoji,
          isPrivate: event.payload.isPrivate,
        },
      },
    };
  }

  if (event.type === "finance.envelopeCeilingUpdated") {
    const envelope = state.envelopes[event.payload.envelopeId];
    if (!envelope) {
      return state;
    }

    return {
      ...state,
      envelopes: {
        ...state.envelopes,
        [envelope.envelopeId]: {
          ...envelope,
          softCeiling: event.payload.softCeiling,
        },
      },
    };
  }

  if (event.type === "finance.transactionLogged") {
    const transaction: Transaction = {
      transactionId: event.payload.transactionId,
      amount: event.payload.amount,
      envelopeId: event.payload.envelopeId,
      source: event.payload.source,
      merchantHint: event.payload.merchantHint,
      note: event.payload.note,
      occurredAt: event.occurredAt,
      pendingImport: false,
      voided: false,
    };

    return {
      ...state,
      recentTransactions: upsertTransaction(state.recentTransactions, transaction),
      inbox: state.inbox.filter((item) => item.transactionId !== transaction.transactionId),
    };
  }

  if (event.type === "finance.transactionImported") {
    const transaction: Transaction = {
      transactionId: event.payload.transactionId,
      amount: event.payload.amount,
      source: "imported",
      merchantHint: event.payload.merchantHint,
      note: event.payload.note,
      occurredAt: event.occurredAt,
      pendingImport: true,
      voided: false,
    };

    return {
      ...state,
      recentTransactions: upsertTransaction(state.recentTransactions, transaction),
      inbox: upsertTransaction(state.inbox, transaction),
    };
  }

  if (event.type === "finance.transactionConfirmed") {
    const existing = state.recentTransactions.find(
      (transaction) => transaction.transactionId === event.payload.transactionId,
    );

    if (!existing) {
      return state;
    }

    const next: Transaction = {
      ...existing,
      envelopeId: event.payload.envelopeId,
      pendingImport: false,
      source: "imported",
    };

    return {
      ...state,
      recentTransactions: upsertTransaction(state.recentTransactions, next),
      inbox: state.inbox.filter((item) => item.transactionId !== next.transactionId),
    };
  }

  if (event.type === "finance.transactionVoided") {
    const recentTransactions = state.recentTransactions.map((transaction) =>
      transaction.transactionId === event.payload.transactionId
        ? {
            ...transaction,
            voided: true,
            pendingImport: false,
          }
        : transaction,
    );

    return {
      ...state,
      recentTransactions,
      inbox: state.inbox.filter((item) => item.transactionId !== event.payload.transactionId),
    };
  }

  return state;
}

export function handleFinanceCommand(
  _events: ReadonlyArray<FinanceEvent>,
  command: FinanceCommand,
): ReadonlyArray<FinanceEvent> {
  if (command.type === "finance.setEnvelope") {
    return [
      {
        type: "finance.envelopeCreated",
        occurredAt: command.requestedAt,
        idempotencyKey: command.idempotencyKey,
        payload: {
          envelopeId: command.payload.envelopeId,
          name: command.payload.name,
          softCeiling: command.payload.softCeiling,
          emoji: command.payload.emoji,
          isPrivate: command.payload.isPrivate ?? false,
        },
        meta: {},
      },
    ];
  }

  if (command.type === "finance.logTransaction") {
    return [
      {
        type: "finance.transactionLogged",
        occurredAt: command.requestedAt,
        idempotencyKey: command.idempotencyKey,
        payload: {
          transactionId: command.payload.transactionId,
          amount: command.payload.amount,
          envelopeId: command.payload.envelopeId,
          source: command.payload.source,
          merchantHint: command.payload.merchantHint,
          note: command.payload.note,
        },
        meta: {},
      },
    ];
  }

  if (command.type === "finance.importTransaction") {
    return [
      {
        type: "finance.transactionImported",
        occurredAt: command.requestedAt,
        idempotencyKey: command.idempotencyKey,
        payload: {
          transactionId: command.payload.transactionId,
          amount: command.payload.amount,
          merchantHint: command.payload.merchantHint,
          note: command.payload.note,
        },
        meta: {},
      },
    ];
  }

  if (command.type === "finance.confirmTransaction") {
    return [
      {
        type: "finance.transactionConfirmed",
        occurredAt: command.requestedAt,
        idempotencyKey: command.idempotencyKey,
        payload: {
          transactionId: command.payload.transactionId,
          envelopeId: command.payload.envelopeId,
        },
        meta: {},
      },
    ];
  }

  if (command.type === "finance.voidTransaction") {
    return [
      {
        type: "finance.transactionVoided",
        occurredAt: command.requestedAt,
        idempotencyKey: command.idempotencyKey,
        payload: {
          transactionId: command.payload.transactionId,
        },
        meta: {},
      },
    ];
  }

  return [];
}
