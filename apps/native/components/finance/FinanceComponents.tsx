import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Colors, Radius, Spacing, Typography } from "../../constants/theme";
import { formatGhs } from "../../lib/ghs";
import { Button, EmptyState } from "../ui";

interface EnvelopeSummary {
  envelopeId: string;
  name: string;
  emoji?: string;
  softCeiling?: number;
  spent: number;
  utilization: number;
}

interface Transaction {
  _id: string;
  amount: number;
  merchantHint?: string;
  note?: string;
  occurredAt: number;
  envelopeId?: string;
}

interface Account {
  accountId: string;
  name: string;
  type: "checking" | "savings" | "cash" | "credit" | "other";
  balance: number;
  currency?: string;
  institution?: string;
}

const ACCOUNT_TYPE_ICONS: Record<string, string> = {
  checking: "🏦",
  savings: "🐷",
  cash: "💵",
  credit: "💳",
  other: "📁",
};

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  cash: "Cash",
  credit: "Credit Card",
  other: "Other",
};

export function AccountCard({ account }: { account: Account }) {
  return (
    <View style={styles.accountCard}>
      <View style={styles.accountIcon}>
        <Text style={styles.accountIconText}>{ACCOUNT_TYPE_ICONS[account.type] || "📁"}</Text>
      </View>
      <View style={styles.accountInfo}>
        <Text style={styles.accountName}>{account.name}</Text>
        <Text style={styles.accountType}>
          {account.institution || ACCOUNT_TYPE_LABELS[account.type]}
        </Text>
      </View>
      <Text style={[styles.accountBalance, account.balance < 0 && styles.accountBalanceNegative]}>
        {formatGhs(account.balance)}
      </Text>
    </View>
  );
}

export function AccountsList({ accounts }: { accounts: Account[] }) {
  if (accounts.length === 0) {
    return (
      <EmptyState
        title="No accounts yet"
        body="Add a bank account or cash to track your net worth"
      />
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <View style={styles.accountsContainer}>
      <View style={styles.totalBalance}>
        <Text style={styles.totalBalanceLabel}>Total Balance</Text>
        <Text style={styles.totalBalanceValue}>{formatGhs(totalBalance)}</Text>
      </View>
      <View style={styles.accountsList}>
        {accounts.map((account) => (
          <AccountCard key={account.accountId} account={account} />
        ))}
      </View>
    </View>
  );
}

export function EnvelopeCard({ envelope }: { envelope: EnvelopeSummary }) {
  const hasCeiling = envelope.softCeiling && envelope.softCeiling > 0;
  const progressPercent = hasCeiling ? Math.min(envelope.utilization * 100, 100) : 0;
  const isOverBudget = hasCeiling && envelope.utilization > 1;

  return (
    <View style={styles.envelopeCard}>
      <View style={styles.envelopeHeader}>
        <View style={styles.envelopeInfo}>
          {envelope.emoji ? <Text style={styles.envelopeEmoji}>{envelope.emoji}</Text> : null}
          <Text style={styles.envelopeName}>{envelope.name}</Text>
        </View>
        <View style={styles.envelopeAmounts}>
          <Text style={styles.envelopeSpent}>{formatGhs(envelope.spent)}</Text>
          {hasCeiling ? (
            <Text
          style={[
            styles.envelopeCeiling,
            isOverBudget ? styles.envelopeOverBudget : undefined,
          ]}
        >
              / {formatGhs(envelope.softCeiling!)}
            </Text>
          ) : null}
        </View>
      </View>
      {hasCeiling ? (
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progressPercent}%` },
            isOverBudget ? styles.progressFillOverBudget : undefined,
          ]}
        />
      </View>
      ) : null}
      {hasCeiling ? (
        <Text style={[styles.utilizationText, isOverBudget ? styles.utilizationTextOver : undefined]}>
          {Math.round(envelope.utilization * 100)}% used
        </Text>
      ) : null}
    </View>
  );
}

export function EnvelopesList({ envelopes }: { envelopes: EnvelopeSummary[] }) {
  if (envelopes.length === 0) {
    return (
      <EmptyState
        title="No envelopes yet"
        body="Create envelopes to budget your spending"
      />
    );
  }

  return (
    <View style={styles.envelopesList}>
      {envelopes.map((envelope) => (
        <EnvelopeCard key={envelope.envelopeId} envelope={envelope} />
      ))}
    </View>
  );
}

export function TransactionItem({ transaction }: { transaction: Transaction }) {
  const date = new Date(transaction.occurredAt);
  const formattedDate = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionMerchant}>
          {transaction.merchantHint || transaction.note || "Expense"}
        </Text>
        <Text style={styles.transactionDate}>{formattedDate}</Text>
      </View>
      <Text style={styles.transactionAmount}>-{formatGhs(transaction.amount)}</Text>
    </View>
  );
}

export function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        title="No transactions yet"
        body="Log your first expense to start tracking"
      />
    );
  }

  return (
    <View style={styles.transactionsList}>
      {transactions.map((transaction) => (
        <TransactionItem key={transaction._id} transaction={transaction} />
      ))}
    </View>
  );
}

interface AddTransactionSheetProps {
  onAdd: (amount: number, envelopeId?: string, note?: string) => void;
  onClose: () => void;
  envelopes: EnvelopeSummary[];
}

export function AddTransactionSheet({ onAdd, onClose, envelopes }: AddTransactionSheetProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedEnvelope, setSelectedEnvelope] = useState<string | undefined>();

  const handleAdd = () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (cents > 0) {
      onAdd(cents, selectedEnvelope, note || undefined);
      onClose();
    }
  };

  return (
    <View style={styles.sheet}>
      <Text style={styles.sheetTitle}>Log Expense</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Amount (GHS)</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Envelope (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.envelopePicker}>
          {envelopes.map((env) => (
            <Pressable
              key={env.envelopeId}
              style={[
                styles.envelopeChip,
                selectedEnvelope === env.envelopeId && styles.envelopeChipSelected,
              ]}
              onPress={() => setSelectedEnvelope(selectedEnvelope === env.envelopeId ? undefined : env.envelopeId)}
            >
              <Text style={styles.envelopeChipText}>
                {env.emoji ? `${env.emoji} ` : ""}{env.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Note (optional)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={note}
          onChangeText={setNote}
          placeholder="What was this for?"
          placeholderTextColor={Colors.textMuted}
          multiline
        />
      </View>

      <View style={styles.sheetActions}>
        <Button label="Cancel" variant="ghost" onPress={onClose} />
        <Button label="Add Expense" variant="primary" onPress={handleAdd} disabled={!amount || parseFloat(amount) <= 0} />
      </View>
    </View>
  );
}

interface AddEnvelopeSheetProps {
  onAdd: (name: string, softCeiling?: number, emoji?: string) => void;
  onClose: () => void;
}

export function AddEnvelopeSheet({ onAdd, onClose }: AddEnvelopeSheetProps) {
  const [name, setName] = useState("");
  const [softCeiling, setSoftCeiling] = useState("");
  const [emoji, setEmoji] = useState("");

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(
        name.trim(),
        softCeiling ? Math.round(parseFloat(softCeiling) * 100) : undefined,
        emoji || undefined
      );
      onClose();
    }
  };

  return (
    <View style={styles.sheet}>
      <Text style={styles.sheetTitle}>New Envelope</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Food, Transport"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Monthly Budget (GHS)</Text>
        <TextInput
          style={styles.input}
          value={softCeiling}
          onChangeText={setSoftCeiling}
          placeholder="Optional"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Emoji</Text>
        <TextInput
          style={[styles.input, styles.inputSmall]}
          value={emoji}
          onChangeText={setEmoji}
          placeholder="🍔"
          placeholderTextColor={Colors.textMuted}
          maxLength={2}
        />
      </View>

      <View style={styles.sheetActions}>
        <Button label="Cancel" variant="ghost" onPress={onClose} />
        <Button label="Create Envelope" variant="primary" onPress={handleAdd} disabled={!name.trim()} />
      </View>
    </View>
  );
}

interface AddAccountSheetProps {
  onAddTransaction: (amount: number, envelopeId?: string, note?: string) => void;
  onAddEnvelope: (name: string, softCeiling?: number, emoji?: string) => void;
  onAddAccount: (name: string, type: string, balance?: number, institution?: string) => void;
  envelopes: EnvelopeSummary[];
}

export function AddAccountSheet({ onAddTransaction, onAddEnvelope, onAddAccount, envelopes }: AddAccountSheetProps) {
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showEnvelopeForm, setShowEnvelopeForm] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);

  if (showEnvelopeForm) {
    return (
      <AddEnvelopeSheet
        onClose={() => setShowEnvelopeForm(false)}
        onAdd={(name, softCeiling, emoji) => {
          onAddEnvelope(name, softCeiling, emoji);
        }}
      />
    );
  }

  if (showTransactionForm) {
    return (
      <AddTransactionSheet
        onClose={() => setShowTransactionForm(false)}
        onAdd={(amount, envelopeId, note) => {
          onAddTransaction(amount, envelopeId, note);
        }}
        envelopes={envelopes}
      />
    );
  }

  if (showAccountForm) {
    return (
      <AddAccountForm
        onClose={() => setShowAccountForm(false)}
        onAdd={(name, type, balance, institution) => {
          onAddAccount(name, type, balance, institution);
        }}
      />
    );
  }

  return (
    <View style={styles.actionsRow}>
      <Pressable style={styles.actionButton} onPress={() => setShowTransactionForm(true)}>
        <Text style={styles.actionButtonIcon}>💸</Text>
        <Text style={styles.actionButtonLabel}>Log Expense</Text>
      </Pressable>
      <Pressable style={styles.actionButton} onPress={() => setShowEnvelopeForm(true)}>
        <Text style={styles.actionButtonIcon}>📊</Text>
        <Text style={styles.actionButtonLabel}>New Envelope</Text>
      </Pressable>
      <Pressable style={styles.actionButton} onPress={() => setShowAccountForm(true)}>
        <Text style={styles.actionButtonIcon}>🏦</Text>
        <Text style={styles.actionButtonLabel}>Add Account</Text>
      </Pressable>
    </View>
  );
}

interface AddAccountFormProps {
  onAdd: (name: string, type: string, balance?: number, institution?: string) => void;
  onClose: () => void;
}

export function AddAccountForm({ onAdd, onClose }: AddAccountFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("checking");
  const [balance, setBalance] = useState("");
  const [institution, setInstitution] = useState("");

  const handleAdd = () => {
    if (name.trim()) {
      onAdd(
        name.trim(),
        type,
        balance ? Math.round(parseFloat(balance) * 100) : 0,
        institution || undefined
      );
      onClose();
    }
  };

  const accountTypes = [
    { value: "checking", label: "Checking", icon: "🏦" },
    { value: "savings", label: "Savings", icon: "🐷" },
    { value: "cash", label: "Cash", icon: "💵" },
    { value: "credit", label: "Credit Card", icon: "💳" },
    { value: "other", label: "Other", icon: "📁" },
  ];

  return (
    <View style={styles.sheet}>
      <Text style={styles.sheetTitle}>Add Account</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Account Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typePicker}>
          {accountTypes.map((accType) => (
            <Pressable
              key={accType.value}
              style={[
                styles.typeChip,
                type === accType.value && styles.typeChipSelected,
              ]}
              onPress={() => setType(accType.value)}
            >
              <Text style={styles.typeChipText}>{accType.icon} {accType.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Account Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Main Checking"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Current Balance (GHS)</Text>
        <TextInput
          style={styles.input}
          value={balance}
          onChangeText={setBalance}
          placeholder="0.00"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Institution (optional)</Text>
        <TextInput
          style={styles.input}
          value={institution}
          onChangeText={setInstitution}
          placeholder="e.g., Ecobank, Fidelity"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View style={styles.sheetActions}>
        <Button label="Cancel" variant="ghost" onPress={onClose} />
        <Button label="Add Account" variant="primary" onPress={handleAdd} disabled={!name.trim()} />
      </View>
    </View>
  );
}

export function AccountsOverview() {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Accounts</Text>
      <Text style={styles.body}>No accounts connected yet.</Text>
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
  
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.bgFloat,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  actionButtonIcon: {
    fontSize: 24,
  },
  actionButtonLabel: {
    ...Typography.labelMD,
    color: Colors.textPrimary,
  },

  envelopeCard: {
    backgroundColor: Colors.bgFloat,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  envelopeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  envelopeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  envelopeEmoji: {
    fontSize: 20,
  },
  envelopeName: {
    ...Typography.labelMD,
    color: Colors.textPrimary,
  },
  envelopeAmounts: {
    flexDirection: "row",
    alignItems: "center",
  },
  envelopeSpent: {
    ...Typography.labelMD,
    color: Colors.textPrimary,
  },
  envelopeCeiling: {
    ...Typography.bodySM,
    color: Colors.textMuted,
  },
  envelopeOverBudget: {
    color: Colors.danger,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.borderSoft,
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.warning,
    borderRadius: 2,
  },
  progressFillOverBudget: {
    backgroundColor: Colors.danger,
  },
  utilizationText: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  utilizationTextOver: {
    color: Colors.danger,
  },
  envelopesList: {
    gap: Spacing.sm,
  },

  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSoft,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionMerchant: {
    ...Typography.bodyMD,
    color: Colors.textPrimary,
  },
  transactionDate: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
  },
  transactionAmount: {
    ...Typography.labelMD,
    color: Colors.danger,
  },
  transactionsList: {
    backgroundColor: Colors.bgFloat,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },

  sheet: {
    backgroundColor: Colors.bgRaised,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  sheetTitle: {
    ...Typography.labelLG,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    ...Typography.bodyMD,
    color: Colors.textPrimary,
  },
  inputSmall: {
    width: 80,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  envelopePicker: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  envelopeChip: {
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  envelopeChipSelected: {
    backgroundColor: Colors.amberGlow,
    borderColor: Colors.amberBorder,
  },
  envelopeChipText: {
    ...Typography.bodySM,
    color: Colors.textPrimary,
  },
  sheetActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },

  /* Account Styles */
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.bgFloat,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  accountIconText: {
    fontSize: 20,
  },
  accountInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  accountName: {
    ...Typography.labelMD,
    color: Colors.textPrimary,
  },
  accountType: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
  },
  accountBalance: {
    ...Typography.labelMD,
    color: Colors.success,
  },
  accountBalanceNegative: {
    color: Colors.danger,
  },
  accountsContainer: {
    gap: Spacing.md,
  },
  totalBalance: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  totalBalanceLabel: {
    ...Typography.bodyXS,
    color: Colors.textMuted,
    textTransform: "uppercase",
  },
  totalBalanceValue: {
    ...Typography.displaySM,
    color: Colors.textPrimary,
  },
  accountsList: {
    gap: Spacing.sm,
  },
  typePicker: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  typeChip: {
    backgroundColor: Colors.bg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.borderSoft,
  },
  typeChipSelected: {
    backgroundColor: Colors.amberGlow,
    borderColor: Colors.amberBorder,
  },
  typeChipText: {
    ...Typography.bodySM,
    color: Colors.textPrimary,
  },
});
