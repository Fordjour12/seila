import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { useToast } from "heroui-native";

import { AddAccountForm } from "../../../../components/finance/FinanceComponents";
import { setAccountRef } from "../../../../lib/finance-refs";
import { Container } from "@/components/container";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
      closeRoute();
    } catch {
      toast.show({ variant: "danger", label: "Failed to add account" });
      throw new Error("Failed to add account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inset = useSafeAreaInsets();

  return (
    <Container
      className="p-6 pb-24 gap-6"
      style={{
        paddingTop: inset.top,
      }}
    >
      <View className="mb-2">
        <Text className="text-3xl font-serif text-foreground tracking-tight">
          Add Account
        </Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Create a new account to track your balances and cashflow.
        </Text>
      </View>
      <AddAccountForm onAdd={handleAddAccount} onClose={closeRoute} />
    </Container>
  );
}
