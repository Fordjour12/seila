# Habits Tab UI Overhaul

## Objective

Redesign the existing `HabitsScreen` in the native app (`apps/native/app/(tabs)/habits/index.tsx`) into a "Luminous Bento" dashboard. The goal is to merge highly visual card-driven elements (Apple Health style) with the premium, interactive glassmorphism of a bento grid (Zen/Intentional Minimalism aesthetic).

## Key Components

### 1. The Bento Dashboard (Top Section)

- **Grid Layout**: A clean, bento-style grid replacing the stacked text stats.
- **Main Tile**: A large, square tile in the top-left featuring a vibrant, glowing circular progress ring or stylized percentage for the 30-day Rhythm Score.
- **Ambient Glow**: Dynamic glow effects underneath the score linking to its "health" (e.g., green for high, amber for medium).
- **Support Tiles**: Smaller glassmorphic tiles stacked to the right showing details like "Current Streak", "Best Streak", and a simplified mini heat-map.

### 2. Floating Day Selector

- **Horizontal Carousel**: A horizontally scrolling list of selectable days.
- **Active State**: The active day is elevated as a distinct card with a subtle shadow and primary-colored glowing edge.

### 3. Interactive Habit Cards (Bottom Section)

- **Visuals**: Dark mode glassmorphism—translucent backgrounds with thin `border-border` outlines. Cards grouped by anchor times (Morning, Afternoon, etc.).
- **Status Indication**: Subtle gradient edges or glowing borders corresponding to the habit's status.
- **Micro-animations**: Tapping the main log interaction triggers a smooth visual transition.
- **Swipe Actions**: Replaces cluttered inline buttons. Swiping a card left reveals secondary actions: Skip, Snooze, and Archive.

## Implementation Details

1. Target File: `apps/native/app/(tabs)/habits/index.tsx`
2. Existing functionality—queries, mutations, and business logic (like standard `useQuery` / `useMutation` from `convex/react` and `productivity-refs`)—remains unchanged; only the UI components are redesigned.
3. Incorporate `reanimated` or `moti` components where needed for animations (such as the swipeable rows and progress rings).
4. Remove the obsolete ActionPill cluster under each habit and replace it with swipe gestures.
