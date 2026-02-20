import { useAction } from "convex/react";
import { useState } from "react";
import { Text, TextInput, View, ActivityIndicator } from "react-native";
import { Button } from "heroui-native";
import { SpicedCard } from "@/components/ui/SpicedCard";
import { api } from "@seila/backend/convex/_generated/api";
import * as Crypto from "expo-crypto";
import { useThemeColor } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";

export function ConversationalCapture() {
    const processCapture = useAction(api.actions.processCapture.processCapture);
    const [text, setText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [reply, setReply] = useState<string | null>(null);

    const themeColorForeground = useThemeColor("foreground");
    const themeColorBackground = useThemeColor("background");
    const themeColorPrimary = useThemeColor("primary");

    const handleSubmit = async () => {
        const input = text.trim();
        if (!input) return;

        setIsLoading(true);
        // Don't clear reply yet so it stays visible while typing next one if they want, 
        // or maybe clear it? We'll clear it:
        setReply(null);
        setText("");

        try {
            const response = await processCapture({
                input,
                captureId: Crypto.randomUUID(),
            });
            setReply(response.reply);
        } catch (err) {
            setReply("Could not process that right now. Keeping things simple.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SpicedCard style={{ padding: 16, marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Ionicons name="chatbubbles-outline" size={20} color={themeColorForeground} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 16, fontWeight: "600", color: themeColorForeground }}>
                    Conversational Capture
                </Text>
            </View>
            <Text style={{ fontSize: 13, color: themeColorForeground, opacity: 0.7, marginBottom: 16 }}>
                Unstructured capture. What's on your mind? The AI listens and updates its context.
            </Text>

            {reply ? (
                <View style={{ marginBottom: 16, padding: 12, backgroundColor: "rgba(16, 185, 129, 0.1)", borderRadius: 12 }}>
                    <Text style={{ fontSize: 14, color: themeColorForeground, lineHeight: 20 }}>
                        {reply}
                    </Text>
                </View>
            ) : null}

            <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TextInput
                    value={text}
                    onChangeText={setText}
                    placeholder="e.g. Rough morning..."
                    placeholderTextColor="#9CA3AF"
                    style={{
                        flex: 1,
                        backgroundColor: themeColorBackground,
                        borderRadius: 12,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        color: themeColorForeground,
                        fontSize: 15,
                        borderWidth: 1,
                        borderColor: "rgba(16, 185, 129, 0.2)",
                    }}
                    editable={!isLoading}
                    onSubmitEditing={handleSubmit}
                />
                <View style={{ marginLeft: 12 }}>
                    {isLoading ? (
                        <ActivityIndicator color={themeColorPrimary} />
                    ) : (
                        <Button size="sm" variant="primary" onPress={handleSubmit} isDisabled={!text.trim() || isLoading}>
                            Send
                        </Button>
                    )}
                </View>
            </View>
        </SpicedCard>
    );
}
