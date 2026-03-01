import { api } from "@seila/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useState } from "react";

import {
  accountSummaryRef,
  savingsGoalsRef,
  transactionSearchRef,
} from "../lib/finance-refs";
import { getLocalDayKey } from "../lib/date";
import { HABITS_ENABLED } from "../lib/features";
import { tasksInboxRef, todayHabitsRef } from "../lib/productivity-refs";

type SearchableRoute = {
  name: string;
  label: string;
  icon: string;
};

type SearchResultBase = {
  key: string;
  label: string;
  subtitle?: string;
};

export type SearchResult =
  | (SearchResultBase & {
      type: "route";
      routeName: string;
      icon: string;
    })
  | (SearchResultBase & {
      type: "habit";
      id: string;
    })
  | (SearchResultBase & {
      type: "task";
      id: string;
    })
  | (SearchResultBase & {
      type: "transaction";
      id: string;
    })
  | (SearchResultBase & {
      type: "account";
      id: string;
    })
  | (SearchResultBase & {
      type: "envelope";
      id: string;
    })
  | (SearchResultBase & {
      type: "savingsGoal";
      id: string;
    })
  | (SearchResultBase & {
      type: "suggestion";
      screen?: string;
    });

function fuzzyMatch(query: string, text?: string) {
  if (!text) return false;
  return text.toLowerCase().includes(query.toLowerCase());
}

export function useSearchResults(
  query: string,
  routes: ReadonlyArray<SearchableRoute>,
): SearchResult[] {
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 120);
    return () => clearTimeout(timeout);
  }, [query]);

  const trimmedQuery = debouncedQuery;
  const shouldSearch = trimmedQuery.length >= 2;
  const dayKey = getLocalDayKey();

  const habits = useQuery(todayHabitsRef, HABITS_ENABLED ? { dayKey } : "skip");
  const tasks = useQuery(tasksInboxRef, {});
  const accountSummary = useQuery(accountSummaryRef, {});
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const savingsGoals = useQuery(savingsGoalsRef, {});
  const suggestions = useQuery(api.queries.activeSuggestions.activeSuggestions) as
    | Array<{
        _id: string;
        headline: string;
        subtext: string;
        action?: {
          type: "open_screen" | "run_command";
          payload?: Record<string, unknown>;
        };
      }>
    | undefined;
  const transactions = useQuery(
    transactionSearchRef,
    shouldSearch ? { q: trimmedQuery, limit: 12 } : "skip",
  );

  return useMemo(() => {
    if (!shouldSearch) {
      return [];
    }

    const results: SearchResult[] = [];

    for (const route of routes) {
      if (fuzzyMatch(trimmedQuery, route.label) || fuzzyMatch(trimmedQuery, route.name)) {
        results.push({
          type: "route",
          key: `route:${route.name}`,
          routeName: route.name,
          label: route.label,
          icon: route.icon,
        });
      }
    }

    if (HABITS_ENABLED) {
      for (const habit of habits || []) {
        if (!fuzzyMatch(trimmedQuery, habit.name)) continue;
        results.push({
          type: "habit",
          key: `habit:${habit.habitId}`,
          id: habit.habitId,
          label: habit.name,
          subtitle: habit.anchor ? `${habit.anchor} routine` : undefined,
        });
      }
    }

    for (const task of tasks || []) {
      if (!fuzzyMatch(trimmedQuery, task.title) && !fuzzyMatch(trimmedQuery, task.note)) continue;
      results.push({
        type: "task",
        key: `task:${task._id}`,
        id: task._id,
        label: task.title,
        subtitle: task.status,
      });
    }

    for (const account of accountSummary?.accounts || []) {
      if (!fuzzyMatch(trimmedQuery, account.name) && !fuzzyMatch(trimmedQuery, account.institution))
        continue;
      results.push({
        type: "account",
        key: `account:${account.accountId}`,
        id: account.accountId,
        label: account.name,
        subtitle: account.institution || account.type,
      });
    }

    for (const envelope of envelopes || []) {
      if (!fuzzyMatch(trimmedQuery, envelope.name) && !fuzzyMatch(trimmedQuery, envelope.emoji))
        continue;
      results.push({
        type: "envelope",
        key: `envelope:${envelope.envelopeId}`,
        id: envelope.envelopeId,
        label: envelope.name,
        subtitle: envelope.emoji || "Budget envelope",
      });
    }

    for (const goal of savingsGoals || []) {
      if (!fuzzyMatch(trimmedQuery, goal.name)) continue;
      results.push({
        type: "savingsGoal",
        key: `goal:${goal.goalId}`,
        id: goal.goalId,
        label: goal.name,
        subtitle: "Savings goal",
      });
    }

    for (const suggestion of suggestions || []) {
      if (!fuzzyMatch(trimmedQuery, suggestion.headline) && !fuzzyMatch(trimmedQuery, suggestion.subtext))
        continue;
      const payload = suggestion.action?.payload;
      const screen =
        payload && typeof payload.screen === "string" ? payload.screen : undefined;
      results.push({
        type: "suggestion",
        key: `suggestion:${suggestion._id}`,
        label: suggestion.headline,
        subtitle: suggestion.subtext,
        screen,
      });
    }

    for (const tx of transactions || []) {
      if (!fuzzyMatch(trimmedQuery, tx.merchantHint) && !fuzzyMatch(trimmedQuery, tx.note)) continue;
      results.push({
        type: "transaction",
        key: `transaction:${tx._id}`,
        id: tx._id,
        label: tx.merchantHint || tx.note || "Transaction",
        subtitle: tx.note || "Transaction",
      });
    }

    return results.slice(0, 8);
  }, [
    accountSummary?.accounts,
    envelopes,
    habits,
    routes,
    savingsGoals,
    shouldSearch,
    suggestions,
    tasks,
    transactions,
    trimmedQuery,
  ]);
}
