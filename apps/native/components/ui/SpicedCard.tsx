import { cn } from "heroui-native";
import { View, type ViewProps } from "react-native";

export function SpicedCard({ className, style, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        "rounded-2xl border border-border/50 bg-card p-5 shadow-sm",
        "dark:bg-card/40 dark:border-white/10", // Subtle transparency for depth
        className,
      )}
      style={[
        {
          // Subtle shadow for depth on iOS
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 2, // Android shadow
        },
        style,
      ]}
      {...props}
    />
  );
}
