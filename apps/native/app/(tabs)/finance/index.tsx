import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors, Spacing, Typography } from "../../../constants/theme";
import { AccountsOverview, AddAccountSheet } from "../../../components/finance/FinanceComponents";

export default function FinanceScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Finance</Text>
      <Text style={styles.subtitle}>Track your accounts and spending rhythm.</Text>
      <AccountsOverview />
      <AddAccountSheet />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.xxl, gap: Spacing.lg },
  title: { ...Typography.displaySM, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySM, color: Colors.textSecondary },
});
