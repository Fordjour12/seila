import { StyleSheet } from "react-native";

import { Colors, Radius, Spacing, Typography } from "../../constants/theme";

export function normalizeMerchant(value?: string) {
  return (value || "").trim().toLowerCase();
}

export function formatDueDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function confidenceLabel(confidence: number) {
  if (confidence >= 0.75) return "high";
  if (confidence >= 0.45) return "medium";
  return "low";
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  title: {
    ...Typography.displaySM,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
  },
  section: {
    gap: Spacing.sm,
  },
  snapshotGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: Colors.bgFloat,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  snapshotLabel: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  snapshotValue: {
    ...Typography.labelLG,
    color: Colors.textPrimary,
  },
  trendCard: {
    backgroundColor: Colors.bgFloat,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  trendTitle: {
    ...Typography.labelMD,
    color: Colors.textPrimary,
  },
  trendBars: {
    height: 100,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  trendBarWrap: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
    backgroundColor: Colors.bg,
    borderRadius: 6,
    overflow: "hidden",
  },
  trendBar: {
    width: "100%",
    backgroundColor: Colors.amber,
    borderRadius: 6,
  },
  monthlyCloseCard: {
    backgroundColor: Colors.bgFloat,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  monthlyCloseWin: {
    ...Typography.labelMD,
    color: Colors.textPrimary,
  },
  monthlyCloseMetric: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
  },
  monthlyCloseOverspend: {
    ...Typography.bodySM,
    color: Colors.danger,
  },
  monthlyCloseOnTrack: {
    ...Typography.bodySM,
    color: Colors.textSecondary,
  },
  monthlyCloseFocus: {
    ...Typography.bodySM,
    color: Colors.amber,
  },
  pendingCard: {
    backgroundColor: Colors.bgFloat,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  pendingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  applySuggestedButton: {
    borderWidth: 1,
    borderColor: Colors.amberBorder,
    backgroundColor: Colors.amberGlow,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  applySuggestedText: {
    ...Typography.bodyXS,
    color: Colors.amber,
  },
  pendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
    paddingBottom: Spacing.sm,
  },
  pendingInfo: {
    flex: 1,
    gap: 2,
  },
  pendingMerchant: {
    ...Typography.bodySM,
    color: Colors.textPrimary,
  },
  pendingAmount: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
  },
  pendingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  pendingSuggestedText: {
    ...Typography.bodyXS,
    color: Colors.amber,
  },
  pendingEnvelopePicker: {
    marginTop: Spacing.xs,
  },
  pendingEnvelopeChip: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    marginRight: Spacing.xs,
  },
  pendingEnvelopeChipSelected: {
    backgroundColor: Colors.amberGlow,
    borderColor: Colors.amberBorder,
  },
  pendingEnvelopeChipText: {
    ...Typography.bodyXS,
    color: Colors.textPrimary,
  },
  pendingActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  pendingActionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
  },
  pendingVoidButton: {
    borderColor: Colors.borderSoft,
    backgroundColor: Colors.bg,
  },
  pendingConfirmButton: {
    borderColor: Colors.amberBorder,
    backgroundColor: Colors.amberGlow,
  },
  pendingVoidText: {
    ...Typography.bodyXS,
    color: Colors.textSecondary,
  },
  pendingConfirmText: {
    ...Typography.bodyXS,
    color: Colors.amber,
  },
  pendingDisabled: {
    opacity: 0.5,
  },
  recurringCard: {
    backgroundColor: Colors.bgFloat,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  recurringForm: {
    gap: Spacing.sm,
  },
  recurringSectionTitle: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  cadenceRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  cadenceChip: {
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    backgroundColor: Colors.bg,
  },
  cadenceChipSelected: {
    borderColor: Colors.amberBorder,
    backgroundColor: Colors.amberGlow,
  },
  cadenceChipText: {
    ...Typography.bodyXS,
    color: Colors.textPrimary,
    textTransform: "capitalize",
  },
  recurringList: {
    gap: Spacing.xs,
  },
  recurringRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    paddingTop: Spacing.sm,
  },
  recurringTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  recurringInfo: {
    flex: 1,
    gap: 2,
  },
  recurringActions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  recurringTitle: {
    ...Typography.bodySM,
    color: Colors.textPrimary,
  },
  recurringMeta: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
  },
  searchRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    paddingTop: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: Spacing.sm,
  },
  hintReviewRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderSoft,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  loading: {
    padding: Spacing.xxl,
    alignItems: "center",
  },
  loadingText: {
    ...Typography.bodyMD,
    color: Colors.textMuted,
  },
  navCard: {
    backgroundColor: Colors.bgFloat,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  navCardTitle: {
    ...Typography.labelMD,
    color: Colors.textPrimary,
  },
  navCardMeta: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
  },
});
