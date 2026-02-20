import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, Radius, Spacing, Typography } from "../../constants/theme";

export function AccountsOverview() {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Accounts</Text>
      <Text style={styles.body}>No accounts connected yet.</Text>
    </View>
  );
}

export function AddAccountSheet() {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Add account</Text>
      <Text style={styles.body}>Connect a bank or add a manual balance entry.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgRaised,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
    padding: Spacing.lg,
  },
  heading: { ...Typography.labelLG, color: Colors.textPrimary },
  body: { ...Typography.bodySM, color: Colors.textSecondary },
});
