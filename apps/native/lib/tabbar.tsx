import { useEffect, useRef, useState } from "react";
import {
   View,
   Text,
   TouchableOpacity,
   StyleSheet,
   Animated,
   Dimensions,
   LayoutChangeEvent,
} from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSemanticColors } from "./theme";

const PILL_H_PADDING = 16;
const TAB_HEIGHT = 64;
const PILL_RADIUS = 32;

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
   const insets = useSafeAreaInsets();
   const colors = useSemanticColors();

   // We measure the width of the pill dynamically so orientation changes work perfectly
   const [pillWidth, setPillWidth] = useState(Dimensions.get("window").width - PILL_H_PADDING * 2);

   const slideAnim = useRef(new Animated.Value(0)).current;
   const scaleAnims = useRef(state.routes.map(() => new Animated.Value(1))).current;

   const tabCount = state.routes.length;
   const tabWidth = pillWidth / (tabCount || 1);

   useEffect(() => {
      // Slide the active indicator
      Animated.spring(slideAnim, {
         toValue: state.index * tabWidth,
         useNativeDriver: true,
         tension: 75,
         friction: 12,
      }).start();

      // Bounce the active icon
      scaleAnims.forEach((anim, i) => {
         Animated.spring(anim, {
            toValue: i === state.index ? 1.05 : 0.95,
            useNativeDriver: true,
            tension: 220,
            friction: 14,
         }).start();
      });
   }, [state.index, tabWidth]); // re-run if width changes

   const onLayout = (e: LayoutChangeEvent) => {
      setPillWidth(e.nativeEvent.layout.width);
   };

   return (
      <View
         style={[
            styles.wrapper,
            { paddingBottom: Math.max(insets.bottom, 16) },
         ]}
      >
         <View
            onLayout={onLayout}
            style={[
               styles.pill,
               {
                  backgroundColor: colors.surface,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
               }
            ]}
         >
            {/* Sliding backdrop for active tab */}
            <Animated.View
               style={[
                  styles.activeSlider,
                  {
                     width: tabWidth,
                     transform: [{ translateX: slideAnim }],
                  },
               ]}
            >
               <View
                  style={[
                     styles.activeSliderInner,
                     { backgroundColor: colors.accent }
                  ]}
               />
            </Animated.View>

            {state.routes.map((route, index) => {
               const { options } = descriptors[route.key];
               const isActive = state.index === index;

               // Try to pick up the label passed by Expo / React Nav
               const label =
                  options.tabBarLabel !== undefined
                     ? options.tabBarLabel
                     : options.title !== undefined
                        ? options.title
                        : route.name.replace(/\/index$/, ""); // sanitize fallback

               const activeColor = colors.accent;
               const inactiveColor = colors.muted;
               const iconColor = isActive ? activeColor : inactiveColor;

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
                           : typeof label === "string" ? label : route.name
                     }
                     accessibilityState={{ selected: isActive }}
                  >
                     <Animated.View
                        style={[
                           styles.tabInner,
                           { transform: [{ scale: scaleAnims[index] }] },
                        ]}
                     >
                        {options.tabBarIcon
                           ? options.tabBarIcon({ focused: isActive, color: iconColor, size: 24 })
                           : null}

                        {(typeof label === 'string' && label) ? (
                           <Text
                              style={[
                                 styles.label,
                                 { color: iconColor }
                              ]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                           >
                              {label}
                           </Text>
                        ) : null}
                     </Animated.View>
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
      paddingHorizontal: PILL_H_PADDING,
      backgroundColor: "transparent",
      zIndex: 100,
      elevation: 2,
   },
   pill: {
      flexDirection: "row",
      height: TAB_HEIGHT,
      borderRadius: PILL_RADIUS,
      alignItems: "center",
      overflow: "hidden",
   },
   activeSlider: {
      position: "absolute",
      top: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
   },
   activeSliderInner: {
      width: "74%",
      height: "68%",
      borderRadius: PILL_RADIUS - 8,
      opacity: 0.12,
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
      gap: 3,
   },
   label: {
      fontSize: 9,
      fontWeight: "600",
      letterSpacing: 0.2,
      width: "95%",
      textAlign: "center",
   },
});
