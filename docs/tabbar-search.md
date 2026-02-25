# TabBar Search Feature

## Overview

The tabbar at the bottom of the app contains a search input that can be extended to search routes and other data. Currently, the search input exists but only stores local state without performing any actions.

## Current State

The search input in `apps/native/lib/tabbar.tsx`:

- Line 63: `const [searchQuery, setSearchQuery] = useState("");`
- Line 178-184: TextInput component with placeholder "Search for actions, people, instruments"

The input currently does nothing - it only updates local state.

## Searchable Items

| Category | Data Source | Search Field |
|----------|-------------|--------------|
| Routes/Tabs | Hardcoded `TAB_CONFIG` | label, name |
| Habits | `api.queries.todayHabits` | name |
| Tasks | `api.queries.taskQueries` | title |
| Transactions | `api.queries.transactionSearch` | merchantHint, note |

## Implementation

### 1. Define Search Result Types

Create a new file `apps/native/hooks/useSearch.ts` or add to a suitable location:

```typescript
import type { Id } from "@seila/backend/convex/_generated/dataModel";

export type SearchResult =
  | { type: "route"; name: string; label: string; icon: string }
  | { type: "habit"; id: Id<"habits">; name: string; anchor?: string }
  | { type: "task"; id: Id<"tasks">; title: string; status: string }
  | { type: "transaction"; id: Id<"transactions">; merchant: string; amount: number };
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
  const habits = useQuery(api.queries.todayHabits.todayHabits);
  const tasks = useQuery(api.queries.taskQueries.inboxTasks);
  
  const results = useMemo(() => {
    if (!query || query.length < 2) return [];
    
    const results: SearchResult[] = [];
    
    // Add matching routes
    for (const [name, config] of Object.entries(TAB_CONFIG)) {
      if (fuzzyMatch(query, config.label)) {
        results.push({ type: "route", name, ...config });
      }
    }
    
    // Add matching habits
    if (habits) {
      for (const habit of habits) {
        if (fuzzyMatch(query, habit.name)) {
          results.push({ type: "habit", id: habit._id, name: habit.name, anchor: habit.anchor });
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
    
    return results.slice(0, 8); // Limit results
  }, [query, habits, tasks]);
  
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
      navigation.navigate("habits/edit", { habitId: result.id });
      break;
    case "task":
      navigation.navigate("tasks/edit", { taskId: result.id });
      break;
    case "transaction":
      navigation.navigate("finance/transactions/edit", { transactionId: result.id });
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

Based on `app/(tabs)/_layout.tsx`:

| Route Name | Screen |
|------------|--------|
| `index` | Today |
| `habits/index` | Habits list |
| `habits/add` | Add habit |
| `habits/edit` | Edit habit |
| `checkin/index` | Check-in |
| `tasks` | Tasks list |
| `tasks/add` | Add task |
| `tasks/edit` | Edit task |
| `finance` | Finance overview |
| `finance/transactions` | Transactions |
| `patterns/index` | Patterns |
| `review/index` | Review |

## Testing

1. Type in search input - should show matching routes first
2. With more characters, should include habits and tasks
3. Tapping result should navigate to correct screen
4. Search should clear after navigation
5. Empty query should hide results dropdown
