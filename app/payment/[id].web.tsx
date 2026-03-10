import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { paymentService } from "../../services/paymentService";
import { Ionicons } from "@expo/vector-icons";

// MOCK WEB CHECKOUT FORM (Stripe Native SDK is completely excluded)
function CheckoutFormWeb({ dealId, onPaymentSuccess }: { dealId: string, onPaymentSuccess: () => void }) {
    const [loading, setLoading] = useState(false);

    const handlePay = async () => {
        setLoading(true);
        try {
            const res = await paymentService.confirmEscrow(dealId);
            if (res.success) {
                Alert.alert("Success", "Funds are now securely held in Escrow!");
                onPaymentSuccess();
            }
        } catch (err: any) {
            Alert.alert("Error", err.message);
        }
        setLoading(false);
    };

    return (
        <View style={styles.checkoutContainer}>
            <Text style={styles.checkoutText}>
                Stripe Web Mock Checkout
            </Text>
            <Text style={styles.instructionText}>
                This is a mock implementation for Web. No real card is required. Your funds will be simulated as held securely in escrow.
            </Text>
            <Pressable style={styles.payBtn} onPress={handlePay} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Simulate Escrow Transfer</Text>}
            </Pressable>
        </View>
    );
}

export default function PaymentScreenWeb() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchIntent();
    }, [id]);

    const fetchIntent = async () => {
        try {
            setLoading(true);
            const res = await paymentService.createIntent(id!);
            if (!res.success) {
                Alert.alert("Error", "Could not initialize secure payment.");
                router.back();
            }
        } catch (err: any) {
            Alert.alert("Payment Error", err.message || "Failed to start payment");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="close" size={28} color="#0F172A" />
                </Pressable>
                <Text style={styles.headerTitle}>Secure Payment (Web Mode)</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.shieldBox}>
                    <Ionicons name="shield-checkmark" size={64} color="#10B981" />
                    <Text style={styles.escrowTitle}>Escrow Protection</Text>
                </View>

                {loading ? (
                    <View style={{ marginTop: 40, alignItems: "center" }}>
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text style={{ marginTop: 12, color: "#64748B" }}>Connecting to Mock Stripe...</Text>
                    </View>
                ) : (
                    <CheckoutFormWeb dealId={id!} onPaymentSuccess={() => router.back()} />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F8FAFC" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
    content: { flex: 1, padding: 20 },
    shieldBox: { alignItems: "center", marginBottom: 40, marginTop: 20 },
    escrowTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginTop: 16 },
    checkoutContainer: {
        backgroundColor: "#FFFFFF",
        padding: 24,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        alignItems: "center"
    },
    checkoutText: { fontSize: 16, fontWeight: "700", color: "#334155", marginBottom: 12, textAlign: "center" },
    instructionText: { fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 24, lineHeight: 20 },
    payBtn: {
        backgroundColor: "#0F172A",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: "100%",
        alignItems: "center"
    },
    payBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" }
});
