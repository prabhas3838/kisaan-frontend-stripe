import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable, Platform } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { paymentService } from "../../services/paymentService";
import { Ionicons } from "@expo/vector-icons";

// Create an inner component that uses Stripe hooks
function CheckoutForm({ dealId, clientSecret, onPaymentSuccess }: { dealId: string, clientSecret: string, onPaymentSuccess: () => void }) {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const [loading, setLoading] = useState(false);
    const [isMock, setIsMock] = useState(false);

    useEffect(() => {
        if (clientSecret.includes("_mock")) {
            setIsMock(true);
        } else {
            initializePaymentSheet();
        }
    }, [clientSecret]);

    const initializePaymentSheet = async () => {
        if (Platform.OS === 'web') return; // Stripe React Native UI doesn't work on Expo Web out of the box
        try {
            const { error } = await initPaymentSheet({
                merchantDisplayName: "Kisaan Saathi Escrow",
                paymentIntentClientSecret: clientSecret,
                allowsDelayedPaymentMethods: true,
            });
            if (error) {
                console.error("Error initializing payment sheet", error);
            }
        } catch (e) {
            console.error("Stripe init error", e);
        }
    };

    const handlePay = async () => {
        setLoading(true);

        if (isMock || Platform.OS === 'web') {
            // Bypass Stripe SDK for Mock Mode & Web testing
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
            return;
        }

        // Real Stripe Flow
        const { error } = await presentPaymentSheet();
        if (error) {
            Alert.alert("Payment Cancelled", error.message);
        } else {
            // Confirm with our backend that Stripe finalized the hold
            try {
                const res = await paymentService.confirmEscrow(dealId);
                if (res.success) {
                    Alert.alert("Success", "Funds are now securely held in Escrow!");
                    onPaymentSuccess();
                } else {
                    Alert.alert("Error", res.message || "Could not verify payment");
                }
            } catch (err: any) {
                Alert.alert("Error", err.message);
            }
        }
        setLoading(false);
    };

    return (
        <View style={styles.checkoutContainer}>
            <Text style={styles.checkoutText}>
                {isMock ? "Mock Mode Active. No real card required." : "Secure Stripe Checkout"}
            </Text>
            <Text style={styles.instructionText}>
                Your funds will be held securely in escrow and only released to the farmer after successful delivery.
            </Text>
            <Pressable style={styles.payBtn} onPress={handlePay} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Pay into Escrow</Text>}
            </Pressable>
        </View>
    );
}

export default function PaymentScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchIntent();
    }, [id]);

    const fetchIntent = async () => {
        try {
            setLoading(true);
            const res = await paymentService.createIntent(id!);
            if (res.success && res.clientSecret) {
                setClientSecret(res.clientSecret);
            } else {
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
        <StripeProvider publishableKey="pk_test_TYooMQauvdEDq54NiTphI7jx">
            <View style={styles.root}>
                <Stack.Screen options={{ headerShown: false }} />

                <View style={styles.header}>
                    <Pressable onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="close" size={28} color="#0F172A" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Secure Payment</Text>
                </View>

                <View style={styles.content}>
                    <View style={styles.shieldBox}>
                        <Ionicons name="shield-checkmark" size={64} color="#10B981" />
                        <Text style={styles.escrowTitle}>Escrow Protection</Text>
                    </View>

                    {loading ? (
                        <View style={{ marginTop: 40, alignItems: "center" }}>
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text style={{ marginTop: 12, color: "#64748B" }}>Connecting to Stripe...</Text>
                        </View>
                    ) : clientSecret ? (
                        <CheckoutForm dealId={id!} clientSecret={clientSecret} onPaymentSuccess={() => router.back()} />
                    ) : null}
                </View>
            </View>
        </StripeProvider>
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
