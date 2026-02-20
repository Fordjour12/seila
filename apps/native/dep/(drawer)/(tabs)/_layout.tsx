/**
 * Life OS — Tab Layout
 * Route: app/(tabs)/_layout.tsx
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

const TABS = [
  { name: 'index',         label: 'Today',    icon: '◎' },
  { name: 'habits/index',  label: 'Habits',   icon: '◇' },
  { name: 'checkin/index', label: 'Check-in', icon: '○' },
  { name: 'tasks/index',   label: 'Tasks',    icon: '□' },
  { name: 'finance/index', label: 'Finance',  icon: '◈' },
  { name: 'review/index',  label: 'Review',   icon: '▷' },
] as const;

function LifeOSTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.tabBar}>
      <View style={styles.tabBarBorder} />
      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const tab = TABS[index];
          if (!tab) return null;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}>
              <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
                <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>{tab.icon}</Text>
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={props => <LifeOSTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index"         options={{ title: 'Today'    }} />
      <Tabs.Screen name="habits/index"  options={{ title: 'Habits'   }} />
      <Tabs.Screen name="checkin/index" options={{ title: 'Check-in' }} />
      <Tabs.Screen name="tasks/index"   options={{ title: 'Tasks'    }} />
      <Tabs.Screen name="finance/index" options={{ title: 'Finance'  }} />
      <Tabs.Screen name="review/index"  options={{ title: 'Review'   }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: Colors.bgRaised, paddingBottom: Platform.OS === 'ios' ? 28 : Spacing.md },
  tabBarBorder: { height: 1, backgroundColor: Colors.borderSoft },
  tabRow: { flexDirection: 'row', paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm },
  tabItem: { flex: 1, alignItems: 'center', gap: Spacing.xs, paddingVertical: Spacing.xs, borderRadius: Radius.md },
  tabItemPressed: { opacity: 0.7 },
  tabIconWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.transparent },
  tabIconWrapActive: { backgroundColor: Colors.amberGlow, borderColor: Colors.amberBorder },
  tabIcon: { fontSize: 15, color: Colors.textMuted, fontFamily: 'monospace' },
  tabIconActive: { color: Colors.amber },
  tabLabel: { ...Typography.eyebrow, color: Colors.textMuted, fontSize: 9 },
  tabLabelActive: { color: Colors.amber },
});
