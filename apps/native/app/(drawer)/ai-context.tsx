import { Ionicons } from "@expo/vector-icons";
import { parseISO, format } from "date-fns";
import { useMutation, useQuery } from "convex/react";
import { useThemeColor } from "heroui-native";
import React, { useState } from "react";
import { ScrollView, Text, View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { api } from "@seila/backend/convex/_generated/api";
import * as Crypto from "expo-crypto";
import { SpicedCard } from "@/components/ui/SpicedCard";

const LABEL_MAP: Record<string, string> = {
    energyPatterns: "Energy Rhythms",
    habitResonance: "Habit Resonance",
    flagPatterns: "Hard Mode Boundaries",
    triggerSignals: "Trigger Signals",
    suggestionResponse: "Suggestion Engagement",
    reviewEngagement: "Weekly Review Depth",
    financeRelationship: "Spending & Mood",
};

export default function AiContextScreen() {
    const aiContext = useQuery(api.queries.aiContext.aiContext);
    const clearAiContext = useMutation(api.commands.clearAiContext.clearAiContext);
    const themeColorForeground = useThemeColor("foreground");
    const themeColorBackground = useThemeColor("background");
    const themeColorBorder = useThemeColor("default-200");
    const [isClearing, setIsClearing] = useState(false);

    const handleClear = async () => {
        Alert.alert(
            "Clear AI Memory?",
            "This resets the AI's entire working model of you to defaults. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear Memory",
                    style: "destructive",
                    onPress: async () => {
                        setIsClearing(true);
                        try {
                            await clearAiContext({ idempotencyKey: Crypto.randomUUID() });
                            Alert.alert("Memory Cleared", "The AI context has been reset.");
                        } catch (err) {
                            Alert.alert("Error", "Could not clear memory. Please try again.");
                        } finally {
                            setIsClearing(false);
                        }
                    },
                },
            ]
        );
    };

    if (!aiContext) {
        return (
            <View style={[styles.center, { backgroundColor: themeColorBackground }]}>
                <Text style={{ color: themeColorForeground }}>Loading context...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: themeColorBackground }]}
            contentContainerStyle={styles.contentContainer}
        >
            <Text style={[styles.screenTitle, { color: themeColorForeground }]}>
                What the AI knows about me
            </Text>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColorForeground }]}>Working Model</Text>
                {Object.entries(aiContext.workingModel).map(([key, value]) => {
                    const label = LABEL_MAP[key] || key;
                    return (
                        <SpicedCard key={key} style={styles.card}>
                            <Text style={[styles.cardTitle, { color: themeColorForeground }]}>{label}</Text>
                            <Text style={[styles.cardValue, { color: themeColorForeground, opacity: 0.8 }]}>
                                {String(value)}
                            </Text>
                        </SpicedCard>
                    );
                })}
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: themeColorForeground }]}>Recent Memory Log</Text>
                {(aiContext.memory ?? []).length === 0 ? (
                    <Text style={{ color: themeColorForeground, opacity: 0.5 }}>No memory entries yet.</Text>
                ) : (
                    (aiContext.memory ?? []).map((entry, index) => (
                        <SpicedCard key={index} style={styles.card}>
                            <View style={styles.memoryHeader}>
                                <Ionicons
                                    name={
                                        entry.confidence === "high"
                                            ? "checkmark-circle"
                                            : entry.confidence === "medium"
                                                ? "remove-circle"
                                                : "help-circle"
                                    }
                                    size={16}
                                    color={
                                        entry.confidence === "high"
                                            ? "#10B981"
                                            : entry.confidence === "medium"
                                                ? "#F59E0B"
                                                : "#EF4444"
                                    }
                                    style={styles.memoryIcon}
                                />
                                <Text style={[styles.memoryDate, { color: themeColorForeground, opacity: 0.5 }]}>
                                    {format(new Date(entry.occurredAt), "MMM d, h:mm a")} • {entry.source}
                                </Text>
                            </View>
                            <Text style={[styles.memoryObservation, { color: themeColorForeground }]}>
                                {entry.observation}
                            </Text>
                        </SpicedCard>
                    ))
                )}
            </View>

            <View style={styles.section}>
                <TouchableOpacity
                    style={[styles.clearButton, { borderColor: themeColorBorder }]}
                    onPress={handleClear}
                    disabled={isClearing}
                >
                    <Ionicons name="trash-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                    <Text style={styles.clearButtonText}>
                        {isClearing ? "Clearing..." : "Clear AI Memory"}
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 40,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    screenTitle: {
        fontSize: 24,
        fontWeight: "600",
        marginBottom: 24,
        letterSpacing: -0.5,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    card: {
        marginBottom: 12,
        padding: 16,
        borderRadius: 16,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 6,
        letterSpacing: 0.2,
        textTransform: "uppercase",
    },
    cardValue: {
        fontSize: 16,
        lineHeight: 22,
    },
    memoryHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    memoryIcon: {
        marginRight: 6,
    },
    memoryDate: {
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    memoryObservation: {
        fontSize: 15,
        lineHeight: 21,
    },
    clearButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        marginTop: 8,
    },
    clearButtonText: {
        color: "#EF4444",
        fontWeight: "600",
        fontSize: 16,
    },
});
