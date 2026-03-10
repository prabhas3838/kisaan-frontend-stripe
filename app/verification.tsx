import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import NavAuto from "../components/navigation/NavAuto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile, requestVerification } from "../services/userServices";

export default function VerificationScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [aadhaar, setAadhaar] = useState("");
    const [pan, setPan] = useState("");

    const loadProfile = async () => {
        try {
            const res = await getProfile();
            if (res?.success) setUser(res.user);
        } catch (e) {
            console.log("Error loading profile for verification:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    const handleSubmit = async () => {
        if (aadhaar.length !== 12) {
            Alert.alert("Invalid Aadhaar", "Please enter a valid 12-digit Aadhaar number.");
            return;
        }
        if (pan.length !== 10) {
            Alert.alert("Invalid PAN", "Please enter a valid 10-character PAN number.");
            return;
        }

        setSubmitting(true);
        try {
            const res = await requestVerification({ aadhaarNumber: aadhaar, panNumber: pan });
            if (res?.success) {
                Alert.alert("Success", "Verification request submitted successfully.");
                loadProfile();
            } else {
                Alert.alert("Error", res?.message || "Submission failed.");
            }
        } catch (e: any) {
            Alert.alert("Error", e.message || "Something went wrong. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1d4ed8" />
            </View>
        );
    }

    const isApproved = user?.verificationStatus === "approved";
    const isPending = user?.verificationStatus === "pending";

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: "Verify Account", headerShown: false }} />
            <NavAuto />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerIcon}>
                    <Ionicons
                        name={isApproved ? "shield-checkmark" : "shield-outline"}
                        size={80}
                        color={isApproved ? "#059669" : "#1d4ed8"}
                    />
                </View>

                <Text style={styles.title}>
                    {isApproved ? "You are Verified!" : "Verification Request"}
                </Text>
                <Text style={styles.subtitle}>
                    {isApproved
                        ? "Your account is verified. You can now list crops and close deals with buyers."
                        : "Verifying your identity helps build trust with buyers and allows you to sell faster."}
                </Text>

                {isApproved ? (
                    <View style={styles.successBox}>
                        <Ionicons name="checkmark-circle" size={20} color="#059669" />
                        <Text style={styles.successText}>Verified Seller Account</Text>
                    </View>
                ) : isPending ? (
                    <View style={styles.pendingBox}>
                        <Ionicons name="time-outline" size={20} color="#D97706" />
                        <Text style={styles.pendingText}>Verification Pending Audit</Text>
                    </View>
                ) : (
                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Aadhaar Number (12 digits)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0000 0000 0000"
                                keyboardType="numeric"
                                maxLength={12}
                                value={aadhaar}
                                onChangeText={setAadhaar}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>PAN Number (10 characters)</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="ABCDE1234F"
                                autoCapitalize="characters"
                                maxLength={10}
                                value={pan}
                                onChangeText={setPan}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                            onPress={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Submit Documents</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    content: { padding: 24, alignItems: "center" },
    headerIcon: { marginBottom: 24, marginTop: 20 },
    title: { fontSize: 24, fontWeight: "800", color: "#1E293B", textAlign: "center" },
    subtitle: { fontSize: 15, color: "#64748B", textAlign: "center", marginTop: 12, lineHeight: 22 },
    form: { width: "100%", marginTop: 32 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: "700", color: "#475569", marginBottom: 8 },
    input: { height: 50, backgroundColor: "#F1F5F9", borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: "#1E293B", borderWidth: 1, borderColor: "#E2E8F0" },
    submitBtn: { height: 54, backgroundColor: "#1D4ED8", borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 10 },
    submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    successBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#DCFCE7", padding: 16, borderRadius: 12, marginTop: 32, gap: 10 },
    successText: { color: "#065F46", fontWeight: "700", fontSize: 16 },
    pendingBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF3C7", padding: 16, borderRadius: 12, marginTop: 32, gap: 10 },
    pendingText: { color: "#92400E", fontWeight: "700", fontSize: 16 },
});
