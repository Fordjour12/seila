/**
 * Life OS — Tab Layout
 * Route: app/(tabs)/_layout.tsx
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type LifeOSTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS = [
   { name: 'index', label: 'Today', icon: 'home-outline' },
   { name: 'habits/index', label: 'Habits', icon: 'leaf-outline' },
   { name: 'checkin/index', label: 'Check-in', icon: 'pulse-outline' },
   { name: 'tasks/index', label: 'Tasks', icon: 'checkbox-outline' },
   { name: 'finance/index', label: 'Finance', icon: 'wallet-outline' },
   { name: 'patterns/index', label: 'Patterns', icon: 'analytics-outline' },
   { name: 'review/index', label: 'Review', icon: 'document-text-outline' },
] as const satisfies ReadonlyArray<{ name: string; label: string; icon: IconName }>;
const TAB_MAP: Record<string, (typeof TABS)[number]> = Object.fromEntries(TABS.map(tab => [tab.name, tab]));

function getTabIconName(icon: IconName, isFocused: boolean): IconName {
   if (isFocused && icon.endsWith('-outline')) {
      return icon.replace('-outline', '') as IconName;
   }
   return icon;
}

function LifeOSTabBar({ state, navigation }: LifeOSTabBarProps) {
   const visibleRoutes = state.routes.filter(route => Boolean(TAB_MAP[route.name]));

   return (
      <SafeAreaView edges={['bottom']} style={styles.tabSafeArea}>
         <View style={styles.tabBar}>
            <View style={styles.tabBarBorder} />
            <View style={styles.tabRow}>
               {visibleRoutes.map(route => {
                  const tab = TAB_MAP[route.name];
                  if (!tab) return null;
                  const isFocused = state.routes[state.index]?.key === route.key;

                  const onPress = () => {
                     const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                     if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
                  };

                  return (
                     <Pressable key={route.key} onPress={onPress} style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}>
                        <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
                           <Ionicons
                              name={getTabIconName(tab.icon, isFocused)}
                              size={18}
                              style={[styles.tabIcon, isFocused && styles.tabIconActive]}
                           />
                        </View>
                        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{tab.label}</Text>
                     </Pressable>
                  );
               })}
            </View>
         </View>
      </SafeAreaView>
   );
}

export default function TabLayout() {
   return (
      <Tabs tabBar={props => <LifeOSTabBar {...props} />} screenOptions={{ headerShown: false }}>
         <Tabs.Screen name="index" options={{ title: 'Today' }} />
         <Tabs.Screen name="habits/index" options={{ title: 'Habits' }} />
         <Tabs.Screen name="checkin/index" options={{ title: 'Check-in' }} />
         <Tabs.Screen name="tasks/index" options={{ title: 'Tasks' }} />
         <Tabs.Screen name="finance/index" options={{ title: 'Finance' }} />
         <Tabs.Screen name="patterns/index" options={{ title: 'Patterns' }} />
         <Tabs.Screen name="review/index" options={{ title: 'Review' }} />
         <Tabs.Screen name="two" options={{ href: null }} />
      </Tabs>
   );
}

const styles = StyleSheet.create({
   tabSafeArea: { backgroundColor: Colors.bgRaised },
   tabBar: { backgroundColor: Colors.bgRaised },
   tabBarBorder: { height: 1, backgroundColor: Colors.borderSoft },
   tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm },
   tabItem: { flex: 1, alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xs, borderRadius: Radius.md },
   tabItemPressed: { opacity: 0.7 },
   tabIconWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.transparent },
   tabIconWrapActive: { backgroundColor: Colors.amberGlow, borderColor: Colors.amberBorder },
   tabIcon: { color: Colors.textMuted },
   tabIconActive: { color: Colors.amber },
   tabLabel: { ...Typography.eyebrow, color: Colors.textMuted, fontSize: 9 },
   tabLabelActive: { color: Colors.amber },
});
