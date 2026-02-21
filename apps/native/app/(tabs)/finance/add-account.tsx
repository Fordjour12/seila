import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useToast } from "heroui-native";

import { AddAccountForm } from "../../../components/finance/FinanceComponents";
import { styles } from "../../../components/finance/routeShared";
import { setAccountRef } from "../../../lib/finance-refs";

export default function AddAccountRoute() {
  const router = useRouter();
  const { toast } = useToast();
  const setAccount = useMutation(setAccountRef);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const closeRoute = React.useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/finance");
  }, [router]);

  const handleAddAccount = async (
    name: string,
    type: string,
    balance?: number,
    institution?: string,
  ) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await setAccount({
        idempotencyKey: `finance.account:${Date.now()}`,
        name,
        type: type as "checking" | "savings" | "cash" | "credit" | "other",
        balance,
        institution,
      });
      toast.show({ variant: "success", label: "Account added" });
    } catch {
      toast.show({ variant: "danger", label: "Failed to add account" });
      throw new Error("Failed to add account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.title}>Add Account</Text>
        <Text style={styles.subtitle}>
          Create a new account to track your balances and cashflow.
        </Text>
      </View>
      <View style={styles.recurringCard}>
        <AddAccountForm onAdd={handleAddAccount} onClose={closeRoute} />
      </View>
    </ScrollView>
  );
}
