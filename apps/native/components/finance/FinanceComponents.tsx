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
    <View className="flex-row items-center bg-surface rounded-2xl p-4 border border-border shadow-sm">
      <View className="w-10 h-10 rounded-xl bg-background items-center justify-center">
        <Text className="text-xl">{ACCOUNT_TYPE_ICONS[account.type] || "📁"}</Text>
      </View>
      <View className="flex-1 ml-4 justify-center">
        <Text className="text-base font-medium text-foreground">{account.name}</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          {account.institution || ACCOUNT_TYPE_LABELS[account.type]}
        </Text>
      </View>
      <Text className={`text-base font-medium ${account.balance < 0 ? "text-danger" : "text-success"}`}>
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
    <View className="gap-4">
      <View className="items-center py-5">
        <Text className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Total Balance</Text>
        <Text className="text-3xl font-serif text-foreground mt-1">{formatGhs(totalBalance)}</Text>
      </View>
      <View className="gap-3">
        {accounts.map((account) => (
          <AccountCard key={account.accountId} account={account} />
        ))}
      </View>
    </View>
  );
}

export function EnvelopeCard({
  envelope,
  onPress,
}: {
  envelope: EnvelopeSummary;
  onPress?: () => void;
}) {
  const hasCeiling = envelope.softCeiling && envelope.softCeiling > 0;
  const progressPercent = hasCeiling ? Math.min(envelope.utilization * 100, 100) : 0;
  const isOverBudget = hasCeiling && envelope.utilization > 1;

  const CardWrapper = onPress ? Pressable : View;

  return (
    <CardWrapper
      onPress={onPress}
      className="bg-surface rounded-2xl border border-border p-4 gap-3 shadow-sm active:bg-muted"
    >
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          {envelope.emoji ? <Text className="text-xl">{envelope.emoji}</Text> : null}
          <Text className="text-base font-medium text-foreground">{envelope.name}</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-base font-medium text-foreground">{formatGhs(envelope.spent)}</Text>
          {hasCeiling ? (
            <Text className={`text-xs ml-1 ${isOverBudget ? "text-danger" : "text-muted-foreground"}`}>
              / {formatGhs(envelope.softCeiling!)}
            </Text>
          ) : null}
        </View>
      </View>
      {hasCeiling && (
        <View className="gap-1.5">
          <View className="h-2 bg-background rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${isOverBudget ? "bg-danger" : "bg-warning"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </View>
          <Text className={`text-[10px] uppercase tracking-widest font-bold ${isOverBudget ? "text-danger" : "text-muted-foreground"}`}>
            {Math.round(envelope.utilization * 100)}% utilized
          </Text>
        </View>
      )}
    </CardWrapper>
  );
}

export function EnvelopesList({
  envelopes,
  onEnvelopePress,
}: {
  envelopes: EnvelopeSummary[];
  onEnvelopePress?: (envelopeId: string) => void;
}) {
  if (envelopes.length === 0) {
    return <EmptyState title="No envelopes yet" body="Create envelopes to budget your spending" />;
  }

  return (
    <View className="gap-3">
      {envelopes.map((envelope) => (
        <EnvelopeCard
          key={envelope.envelopeId}
          envelope={envelope}
          onPress={onEnvelopePress ? () => onEnvelopePress(envelope.envelopeId) : undefined}
        />
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
    <View className="flex-row justify-between items-center py-3 border-b border-border/50 last:border-b-0">
      <View className="flex-1 mr-4">
        <Text className="text-base font-medium text-foreground" numberOfLines={1}>
          {transaction.merchantHint || transaction.note || "Expense"}
        </Text>
        <Text className="text-xs text-muted-foreground mt-0.5">{formattedDate}</Text>
      </View>
      <Text className="text-base font-medium text-danger">-{formatGhs(transaction.amount)}</Text>
    </View>
  );
}

export function TransactionsList({ transactions }: { transactions: Transaction[] }) {
  if (transactions.length === 0) {
    return (
      <EmptyState title="No transactions yet" body="Log your first expense to start tracking" />
    );
  }

  return (
    <View className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
      {transactions.map((transaction) => (
        <TransactionItem key={transaction._id} transaction={transaction} />
      ))}
    </View>
  );
}

interface AddTransactionSheetProps {
  onAdd: (amount: number, envelopeId?: string, note?: string) => void | Promise<void>;
  onClose: () => void;
  envelopes: EnvelopeSummary[];
}

export function AddTransactionSheet({ onAdd, onClose, envelopes }: AddTransactionSheetProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedEnvelope, setSelectedEnvelope] = useState<string | undefined>();

  const handleAdd = async () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (cents > 0) {
      try {
        await onAdd(cents, selectedEnvelope, note || undefined);
        onClose();
      } catch {
        // Route-level handlers surface toast messages; keep form open on failure.
      }
    }
  };

  return (
    <View className="bg-surface rounded-2xl border border-border p-6 gap-6 shadow-sm">
      <Text className="text-xl font-medium text-foreground">Log Expense</Text>

      <View className="gap-2">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Amount (GHS)</Text>
        <TextInput
          className="bg-background border border-border rounded-xl p-4 text-base text-foreground font-medium"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
        />
      </View>

      <View className="gap-2">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Envelope (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <View className="flex-row gap-2">
            {envelopes.map((env) => (
              <Pressable
                key={env.envelopeId}
                className={`rounded-full px-4 py-2 border ${selectedEnvelope === env.envelopeId ? "bg-warning/10 border-warning/30" : "bg-background border-border"}`}
                onPress={() =>
                  setSelectedEnvelope(
                    selectedEnvelope === env.envelopeId ? undefined : env.envelopeId,
                  )
                }
              >
                <Text className={`text-xs font-medium ${selectedEnvelope === env.envelopeId ? "text-warning" : "text-foreground"}`}>
                  {env.emoji ? `${env.emoji} ` : ""}
                  {env.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="gap-2">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Note (optional)</Text>
        <TextInput
          className="bg-background border border-border rounded-xl p-4 text-base text-foreground min-h-[100]"
          value={note}
          onChangeText={setNote}
          placeholder="What was this for?"
          placeholderTextColor={Colors.textMuted}
          multiline
          textAlignVertical="top"
        />
      </View>

      <View className="flex-row gap-3 pt-2">
        <Pressable
          className="flex-1 bg-background border border-border rounded-xl py-3 active:bg-muted"
          onPress={onClose}
        >
          <Text className="text-sm text-foreground text-center font-medium">Cancel</Text>
        </Pressable>
        <Pressable
          className={`flex-1 bg-foreground rounded-xl py-3 active:opacity-90 ${(!amount || parseFloat(amount) <= 0) ? "opacity-50" : ""}`}
          onPress={handleAdd}
          disabled={!amount || parseFloat(amount) <= 0}
        >
          <Text className="text-sm text-background text-center font-bold">Add Expense</Text>
        </Pressable>
      </View>
    </View>
  );
}

interface AddEnvelopeSheetProps {
  onAdd: (name: string, softCeiling?: number, emoji?: string) => void | Promise<void>;
  onClose: () => void;
  initialEnvelope?: {
    envelopeId: string;
    name: string;
    softCeiling?: number;
    emoji?: string;
  };
}

export function AddEnvelopeSheet({ onAdd, onClose, initialEnvelope }: AddEnvelopeSheetProps) {
  const [name, setName] = useState(initialEnvelope?.name ?? "");
  const [softCeiling, setSoftCeiling] = useState(
    initialEnvelope?.softCeiling ? (initialEnvelope.softCeiling / 100).toString() : "",
  );
  const [emoji, setEmoji] = useState(initialEnvelope?.emoji ?? "");

  const isEditing = !!initialEnvelope;
  const handleSubmit = async () => {
    if (name.trim()) {
      try {
        await onAdd(
          name.trim(),
          softCeiling ? Math.round(parseFloat(softCeiling) * 100) : undefined,
          emoji || undefined,
        );
        onClose();
      } catch {
        // Route-level handlers surface toast messages; keep form open on failure.
      }
    }
  };

  return (
    <View className="bg-surface rounded-2xl border border-border p-6 gap-6 shadow-sm">
      <Text className="text-xl font-medium text-foreground">
        {isEditing ? "Edit Envelope" : "New Envelope"}
      </Text>

      <View className="gap-2">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Name</Text>
        <TextInput
          className="bg-background border border-border rounded-xl p-4 text-base text-foreground font-medium"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Food, Transport"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View className="gap-2">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Monthly Budget (GHS)</Text>
        <TextInput
          className="bg-background border border-border rounded-xl p-4 text-base text-foreground font-medium"
          value={softCeiling}
          onChangeText={setSoftCeiling}
          placeholder="Optional"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
        />
      </View>

      <View className="gap-2">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Emoji</Text>
        <TextInput
          className="bg-background border border-border rounded-xl p-4 text-xl text-center w-20"
          value={emoji}
          onChangeText={setEmoji}
          placeholder="🍔"
          placeholderTextColor={Colors.textMuted}
          maxLength={2}
        />
      </View>

      <View className="flex-row gap-3 pt-2">
        <Pressable
          className="flex-1 bg-background border border-border rounded-xl py-3 active:bg-muted"
          onPress={onClose}
        >
          <Text className="text-sm text-foreground text-center font-medium">Cancel</Text>
        </Pressable>
        <Pressable
          className={`flex-1 bg-foreground rounded-xl py-3 active:opacity-90 ${(!name.trim()) ? "opacity-50" : ""}`}
          onPress={handleSubmit}
          disabled={!name.trim()}
        >
          <Text className="text-sm text-background text-center font-bold">
            {isEditing ? "Save Changes" : "Create Envelope"}
          </Text>
        </Pressable>
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

export function AddAccountSheet({
  onAddTransaction,
  onAddEnvelope,
  onAddAccount,
  envelopes,
}: AddAccountSheetProps) {
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
    <View className="flex-row gap-3">
      {[
        { label: "Log Expense", icon: "💸", onPress: () => setShowTransactionForm(true) },
        { label: "New Envelope", icon: "📊", onPress: () => setShowEnvelopeForm(true) },
        { label: "Add Account", icon: "🏦", onPress: () => setShowAccountForm(true) },
      ].map((action) => (
        <Pressable
          key={action.label}
          className="flex-1 bg-surface border border-border rounded-2xl p-6 items-center gap-3 shadow-sm active:bg-muted/10"
          onPress={action.onPress}
        >
          <Text className="text-3xl">{action.icon}</Text>
          <Text className="text-xs font-bold text-foreground text-center uppercase tracking-widest">{action.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

interface AddAccountFormProps {
  onAdd: (
    name: string,
    type: string,
    balance?: number,
    institution?: string,
  ) => void | Promise<void>;
  onClose: () => void;
}

export function AddAccountForm({ onAdd, onClose }: AddAccountFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("checking");
  const [balance, setBalance] = useState("");
  const [institution, setInstitution] = useState("");

  const handleAdd = async () => {
    if (name.trim()) {
      try {
        await onAdd(
          name.trim(),
          type,
          balance ? Math.round(parseFloat(balance) * 100) : 0,
          institution || undefined,
        );
        onClose();
      } catch {
        // Route-level handlers surface toast messages; keep form open on failure.
      }
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
    <View className="bg-surface rounded-2xl border border-border p-6 gap-6 shadow-sm">
      <Text className="text-xl font-medium text-foreground">Add Account</Text>

      <View className="gap-2">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Account Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          <View className="flex-row gap-2">
            {accountTypes.map((accType) => (
              <Pressable
                key={accType.value}
                className={`rounded-full px-4 py-2 border ${type === accType.value ? "bg-warning/10 border-warning/30" : "bg-background border-border"}`}
                onPress={() => setType(accType.value)}
              >
                <Text className={`text-xs font-medium ${type === accType.value ? "text-warning" : "text-foreground"}`}>
                  {accType.icon} {accType.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View className="gap-2">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Account Name</Text>
        <TextInput
          className="bg-background border border-border rounded-xl p-4 text-base text-foreground font-medium"
          value={name}
          onChangeText={setName}
          placeholder="e.g., Main Checking"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View className="gap-2">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Current Balance (GHS)</Text>
        <TextInput
          className="bg-background border border-border rounded-xl p-4 text-base text-foreground font-medium"
          value={balance}
          onChangeText={setBalance}
          placeholder="0.00"
          placeholderTextColor={Colors.textMuted}
          keyboardType="decimal-pad"
        />
      </View>

      <View className="gap-2">
        <Text className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Institution (optional)</Text>
        <TextInput
          className="bg-background border border-border rounded-xl p-4 text-base text-foreground font-medium"
          value={institution}
          onChangeText={setInstitution}
          placeholder="e.g., Ecobank, Fidelity"
          placeholderTextColor={Colors.textMuted}
        />
      </View>

      <View className="flex-row gap-3 pt-2">
        <Pressable
          className="flex-1 bg-background border border-border rounded-xl py-3 active:bg-muted"
          onPress={onClose}
        >
          <Text className="text-sm text-foreground text-center font-medium">Cancel</Text>
        </Pressable>
        <Pressable
          className={`flex-1 bg-foreground rounded-xl py-3 active:opacity-90 ${(!name.trim()) ? "opacity-50" : ""}`}
          onPress={handleAdd}
          disabled={!name.trim()}
        >
          <Text className="text-sm text-background text-center font-bold">Add Account</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function AccountsOverview() {
  return (
    <View className="bg-surface rounded-2xl border border-border p-6 gap-2 shadow-sm">
      <Text className="text-lg font-medium text-foreground">Accounts</Text>
      <Text className="text-sm text-muted-foreground">No accounts connected yet.</Text>
    </View>
  );
}

const styles = StyleSheet.create({});


