import { useMemo } from "react";
import type { ReactNode } from "react";
import {
   View,
   TouchableOpacity,
   StyleSheet,
   Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSemanticColors } from "./theme";

const BAR_HORIZONTAL_PADDING = 14;
const TAB_HEIGHT = 64;
const PILL_RADIUS = 32;

type TabBarOptions = {
   title?: string;
   tabBarAccessibilityLabel?: string;
   tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => ReactNode;
};

type LocalBottomTabBarProps = {
   state: {
      index: number;
      routes: Array<{ key: string; name: string }>;
   };
   descriptors: Record<string, { options: TabBarOptions }>;
   navigation: {
      emit: (event: { type: "tabPress"; target: string; canPreventDefault: true }) => {
         defaultPrevented: boolean;
      };
      navigate: (name: string) => void;
   };
};

export function TabBar({ state, descriptors, navigation }: LocalBottomTabBarProps) {
   const insets = useSafeAreaInsets();
   const colors = useSemanticColors();
   const tabCount = Math.max(state.routes.length, 1);
   const activeIndex = Math.max(Math.min(state.index, tabCount - 1), 0);

   const containerStyle = useMemo(
      () => [
         styles.wrapper,
         {
            paddingBottom: Math.max(insets.bottom, 10),
         },
      ],
      [insets.bottom],
   );

   return (
      <View style={containerStyle}>
         <View
            style={[
               styles.pill,
               {
                  backgroundColor: colors.overlay,
               }
            ]}
         >
            <View
               pointerEvents="none"
               style={[
                  styles.activeTrack,
                  {
                     width: `${100 / tabCount}%`,
                     left: `${(activeIndex * 100) / tabCount}%`,
                     backgroundColor: colors.surface,
                  },
               ]}
            />
            {state.routes.map((route, index) => {
               const { options } = descriptors[route.key];
               const isActive = state.index === index;
               const iconColor = isActive ? colors.foreground : colors.muted;

               const onPress = () => {
                  const event = navigation.emit({
                     type: "tabPress",
                     target: route.key,
                     canPreventDefault: true,
                  });
                  if (!isActive && !event.defaultPrevented) {
                     navigation.navigate(route.name);
                  }
               };

               return (
                  <TouchableOpacity
                     key={route.key}
                     style={styles.tab}
                     onPress={onPress}
                     activeOpacity={0.7}
                     accessibilityRole="button"
                     accessibilityLabel={
                        typeof options.tabBarAccessibilityLabel === "string"
                           ? options.tabBarAccessibilityLabel
                           : typeof options.title === "string" ? options.title : route.name
                     }
                     accessibilityState={{ selected: isActive }}
                  >
                     <View style={styles.tabInner}>
                        {options.tabBarIcon
                           ? options.tabBarIcon({ focused: isActive, color: iconColor, size: 24 })
                           : null}
                     </View>
                  </TouchableOpacity>
               );
            })}
         </View>
      </View>
   );
}

const styles = StyleSheet.create({
   wrapper: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: BAR_HORIZONTAL_PADDING,
      backgroundColor: "transparent",
      zIndex: 40,
      elevation: 10,
   },
   pill: {
      flexDirection: "row",
      height: TAB_HEIGHT,
      borderRadius: PILL_RADIUS,
      alignItems: "center",
      overflow: "hidden",
      paddingHorizontal: 6,
      ...Platform.select({
         ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
         },
         android: {
            elevation: 8,
         },
      }),
   },
   activeTrack: {
      position: "absolute",
      top: 6,
      bottom: 6,
      borderRadius: PILL_RADIUS - 10,
   },
   tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
   },
   tabInner: {
      alignItems: "center",
      justifyContent: "center",
   },
});
