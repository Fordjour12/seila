# TabBar Search Feature

## Overview

The tabbar at the bottom of the app contains a search input that can be extended to search routes and other data. Currently, the search input exists but only stores local state without performing any actions.

## Current State

The search input in `apps/native/lib/tabbar.tsx`:

- Line 63: `const [searchQuery, setSearchQuery] = useState("");`
- Line 178-184: TextInput component with placeholder "Search for actions, people, instruments"

The input currently does nothing - it only updates local state.

## Searchable Items

### High Priority (Recommended)

| Category | Data Source | Search Field | Navigation |
|----------|-------------|--------------|------------|
| Routes/Tabs | Hardcoded `TAB_CONFIG` | label, name | Direct navigate |
| Habits | `api.queries.todayHabits.todayHabits({ dayKey })` | name | `habits/edit?id=...` |
| Tasks | `api.queries.taskQueries` | title | `tasks/edit` |
| Transactions | `api.queries.transactionSearch` | merchantHint, note | `finance/transactions/edit` |

### Medium Priority

| Category | Data Source | Search Field | Navigation |
|----------|-------------|--------------|------------|
| Accounts | `api.queries.accountSummary.accountSummary` | name, institution | `finance/accounts` |
| Envelopes | `api.queries.envelopeSummary` | name, emoji | `finance/budget/edit` |
| Suggestions | `api.queries.activeSuggestions` | headline, subtext | Handle via action |
| Savings Goals | `api.queries.savingsGoals` | name | `finance/savings/edit` |

### Low Priority (Future)

| Category | Data Source | Search Field |
|----------|-------------|--------------|
| Debts | `api.queries.debtStrategy` | name |
| Investments | `api.queries.investmentSummary` | name |
| Checkins | `api.queries.lastCheckin` | note, flags |
| Scratchpad | `api.queries.scratchpad` | text |

### Not Searchable

These entities are internal/technical and not useful for search:

- `events`, `habitLogs` - system/granular data
- `reviews`, `hardModeSessions`, `recoveryContext` - rare access
- `fxRates`, `financeSecuritySettings` - technical config

## Implementation

### 1. Define Search Result Types

Create a new file `apps/native/hooks/useSearch.ts`:

```typescript
import type { Id } from "@seila/backend/convex/_generated/dataModel";

export type SearchResult =
  // Routes
  | { type: "route"; name: string; label: string; icon: string }
  // Habits
  | { type: "habit"; id: Id<"habits">; name: string; anchor?: string }
  // Tasks
  | { type: "task"; id: Id<"tasks">; title: string; status: string }
  // Transactions
  | { type: "transaction"; id: Id<"transactions">; merchant: string; amount: number }
  // Accounts
  | { type: "account"; id: Id<"accounts">; name: string; type: string }
  // Envelopes (budget categories)
  | { type: "envelope"; id: Id<"envelopes">; name: string; emoji?: string }
  // Savings goals
  | { type: "savingsGoal"; id: Id<"savingsGoals">; name: string; currentAmount: number }
  // Suggestions
  | { type: "suggestion"; id: Id<"suggestions">; headline: string };
```

### 2. Create Search Hook

```typescript
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@seila/backend/convex/_generated/api";

const TAB_CONFIG: Record<string, { label: string; icon: string }> = {
  index: { label: "Today", icon: "home-outline" },
  "habits/index": { label: "Habits", icon: "leaf-outline" },
  "checkin/index": { label: "Check-in", icon: "pulse-outline" },
  tasks: { label: "Tasks", icon: "checkbox-outline" },
  finance: { label: "Finance", icon: "wallet-outline" },
  "patterns/index": { label: "Patterns", icon: "analytics-outline" },
  "review/index": { label: "Review", icon: "document-text-outline" },
};

function fuzzyMatch(query: string, text: string): boolean {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  return lowerText.includes(lowerQuery);
}

export function useSearchResults(query: string): SearchResult[] {
  const dayKey = getLocalDayKey();
  const habits = useQuery(api.queries.todayHabits.todayHabits, { dayKey });
  const tasks = useQuery(api.queries.taskQueries.inbox);
  const accounts = useQuery(api.queries.accountSummary.accountSummary);
  const envelopes = useQuery(api.queries.envelopeSummary.envelopeSummary);
  const savingsGoals = useQuery(api.queries.savingsGoals.savingsGoals);
  const suggestions = useQuery(api.queries.activeSuggestions.activeSuggestions);
  
  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    
    const results: SearchResult[] = [];
    
    // Add matching routes (highest priority)
    for (const [name, config] of Object.entries(TAB_CONFIG)) {
      if (fuzzyMatch(query, config.label)) {
        results.push({ type: "route", name, ...config });
      }
    }
    
    // Add matching habits
    if (habits) {
      for (const habit of habits) {
        if (fuzzyMatch(query, habit.name)) {
          results.push({ type: "habit", id: habit.habitId, name: habit.name, anchor: habit.anchor });
        }
      }
    }
    
    // Add matching tasks
    if (tasks) {
      for (const task of tasks) {
        if (fuzzyMatch(query, task.title)) {
          results.push({ type: "task", id: task._id, title: task.title, status: task.status });
        }
      }
    }
    
    // Add matching accounts
    if (accounts?.accounts) {
      for (const account of accounts.accounts) {
        if (fuzzyMatch(query, account.name) || fuzzyMatch(query, account.institution ?? "")) {
          results.push({ type: "account", id: account.accountId, name: account.name, type: account.type });
        }
      }
    }
    
    // Add matching envelopes
    if (envelopes) {
      for (const envelope of envelopes) {
        if (fuzzyMatch(query, envelope.name)) {
          results.push({ type: "envelope", id: envelope.envelopeId, name: envelope.name, emoji: envelope.emoji });
        }
      }
    }
    
    // Add matching savings goals
    if (savingsGoals) {
      for (const goal of savingsGoals) {
        if (fuzzyMatch(query, goal.name)) {
          results.push({ type: "savingsGoal", id: goal.goalId, name: goal.name, currentAmount: goal.currentAmount });
        }
      }
    }
    
    // Add matching suggestions
    if (suggestions) {
      for (const suggestion of suggestions) {
        if (fuzzyMatch(query, suggestion.headline)) {
          results.push({ type: "suggestion", id: suggestion._id, headline: suggestion.headline });
        }
      }
    }
    
    return results.slice(0, 8); // Limit results
  }, [query, habits, tasks, accounts, envelopes, savingsGoals, suggestions]);
  
  return results;
}
```

### 3. Add Dropdown Overlay

Modify `apps/native/lib/tabbar.tsx` to show results:

```tsx
import { useSearchResults } from "../hooks/useSearch";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Inside TabBar component:
const navigation = useNavigation<NativeStackNavigationProp<any>>();
const results = useSearchResults(searchQuery);

const handleSelect = (result: SearchResult) => {
  setSearchQuery("");
  
  switch (result.type) {
    case "route":
      navigation.navigate(result.name);
      break;
    case "habit":
      navigation.navigate("habits/edit", { id: result.id });
      break;
    case "task":
      navigation.navigate("tasks/edit", { id: result.id });
      break;
    case "transaction":
      navigation.navigate("finance/transactions/edit", { transactionId: result.id });
      break;
    case "account":
      navigation.navigate("finance/accounts");
      break;
    case "envelope":
      navigation.navigate("finance/budget/edit", { id: result.id });
      break;
    case "savingsGoal":
      navigation.navigate("finance/savings/edit", { id: result.id });
      break;
    case "suggestion":
      // Handle based on suggestion.action if available
      break;
  }
};

// Add conditional rendering after the search input:
// {results.length > 0 && (
//   <View className="absolute bottom-full left-0 right-0 bg-surface border border-border rounded-xl mb-2 overflow-hidden">
//     {results.map((result, i) => (
//       <TouchableOpacity key={i} onPress={() => handleSelect(result)} ...>
//         {/* Render result item */}
//       </TouchableOpacity>
//     ))}
//   </View>
// )}
```

### 4. UX Considerations

- **Debounce**: Consider debouncing the search to avoid excessive queries
- **Empty state**: Show "No results" when query returns nothing
- **Minimum characters**: Start searching after 2+ characters
- **Result limits**: Cap at 8 results to avoid overwhelming the UI
- **Clear on navigate**: Clear search when user selects a result

## Routes Available for Navigation

Based on `app/(tabs)/_layout.tsx` and nested routes:

| Route Name | Screen | Search Type |
|------------|--------|-------------|
| `index` | Today | route |
| `habits/index` | Habits list | route |
| `habits/add` | Add habit | route |
| `habits/edit` | Edit habit | habit |
| `habits/consistency` | Habit consistency | route |
| `checkin/index` | Check-in (daily + weekly modes) | route |
| `tasks` | Tasks list | route |
| `tasks/add` | Add task | route |
| `tasks/edit` | Edit task | task |
| `tasks/consistency` | Task consistency | route |
| `finance` | Finance overview | route |
| `finance/transactions` | Transactions list | route |
| `finance/transactions/add` | Add transaction | route |
| `finance/transactions/edit` | Edit transaction | transaction |
| `finance/accounts/add` | Add account | route |
| `finance/accounts` | Accounts & goals | account |
| `finance/budget` | Budget envelopes | route |
| `finance/budget/edit` | Edit envelope | envelope |
| `finance/recurring` | Recurring transactions | route |
| `finance/savings` | Savings goals | route |
| `finance/savings/edit` | Edit savings goal | savingsGoal |
| `finance/planning/investments` | Investments | route |
| `finance/planning/debt` | Debt strategy | route |
| `patterns/index` | Patterns | route |
| `review/index` | Review | route |

## Search Priority Order

When displaying results, order by:

1. **Routes** - Always show first (instant navigation)
2. **Habits** - High frequency user data
3. **Tasks** - High frequency user data
4. **Accounts** - Important financial context
5. **Envelopes** - Budget organization
6. **Savings Goals** - Less frequent but useful
7. **Suggestions** - AI recommendations
8. **Transactions** - Largest dataset, search last

## Testing

### Basic Flow
1. Type in search input - should show matching routes first
2. With more characters, should include habits and tasks
3. Tapping result should navigate to correct screen
4. Search should clear after navigation
5. Empty query should hide results dropdown

### Extended Testing
- Search for habit name → tap → opens habit edit
- Search for task title → tap → opens task edit
- Search for account name → tap → opens account edit
- Search for envelope name → tap → opens budget edit
- Search for savings goal → tap → opens savings edit
- All search results should be limited to 8 items
- Results should appear within 100ms of typing
