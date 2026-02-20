import { cn } from "heroui-native";
import { Text, View, type ViewProps } from "react-native";

interface SpicedHeaderProps extends ViewProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export function SpicedHeader({ title, subtitle, action, className, ...props }: SpicedHeaderProps) {
    return (
        <View className={cn("py-6 mb-4 flex-row items-end justify-between", className)} {...props}>
            <View className="flex-1">
                <Text className="text-4xl font-bold text-foreground tracking-tight leading-tight">
                    {title}
                </Text>
                {subtitle && (
                    <Text className="text-muted-foreground text-base mt-1 font-medium tracking-wide">
                        {subtitle}
                    </Text>
                )}
            </View>
            {action && <View className="mb-1 ml-4">{action}</View>}
        </View>
    );
}
