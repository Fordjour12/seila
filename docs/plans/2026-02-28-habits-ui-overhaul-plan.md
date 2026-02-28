# Habits Tab UI Overhaul - Implementation Plan

## Phase 1: Bento Dashboard (Top Section)

1. Create a `BentoDashboard` component within `apps/native/app/(tabs)/habits/_components`.
2. Implement the `Main Tile` using the existing consistency data (`consistencyPct`, `scheduledDays`, etc.).
   - Include a circular progress ring/indicator for the consistency percentage.
   - Use dynamic colors (e.g., success color for high %, warning color for low %).
3. Implement the `Support Tiles` on the right to display `Current Streak`, `Best Streak`, and a mini HeatMap.
4. Integrate the dashboard into `apps/native/app/(tabs)/habits/index.tsx`, replacing the existing stats card.

## Phase 2: Floating Day Selector

1. Create a `DaySelector` component.
2. Build a horizontally scrolling list (`ScrollView` with `horizontal`) displaying days of the week.
3. Enhance the active day styling to appear as an elevated card with a subtle glow or primary border.
4. Replace the existing day selector grid in `index.tsx` with this new component.

## Phase 3: Interactive Habit Cards

1. Create a `HabitCard` component for individual habit items.
2. Refactor the existing card design into a sleek, glassmorphic layout (dark mode compatible).
3. Implement conditional subtle gradient edges or borders based on the habit's `todayStatus` (Done, Skipped, Snoozed, Pending).
4. Implement Swipe Actions replacing the inline `ActionPill` buttons.
   - Explore using `react-native-reanimated` and `react-native-gesture-handler` (or existing solutions in the repo like `react-native-swipe-list-view` if available) to allow swiping left.
   - Reveal `Skip`, `Snooze`, `Archive` (and `Relapse` if applicable) upon swipe.
5. Add a fluid micro-animation (e.g., scale feedback on press) for the main "Log" action checkmark.
6. Replace the inline rendering in `index.tsx` with the new `HabitCard` component.

## Phase 4: Integration and Polish

1. Integrate all components into the main `HabitsScreen` (`index.tsx`).
2. Verify all actions (log, skip, snooze, archive, relapse) trigger the correct Convex mutations and handle loading/success states via `useToast`.
3. Test layout and responsiveness on native screen sizes.
4. Clean up any unused code from `index.tsx`.
