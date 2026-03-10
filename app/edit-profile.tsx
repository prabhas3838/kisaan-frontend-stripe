import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile, updateProfile } from "../services/userServices";
import { apiFetch } from "../services/http";
import { ENDPOINTS } from "../services/api";
import { setLanguage as setLanguageService } from "../i18n/i18n";
import NavAuto from "../components/navigation/NavAuto";


const COLORS = { primary: "#1B5E20" };

export default function EditProfileScreen() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [originalPhone, setOriginalPhone] = useState("");
    const [language, setLanguage] = useState("en");
    const [role, setRole] = useState("");

    // OTP states
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [verifying, setVerifying] = useState(false);

    const languages = [
        { code: "en", label: "English" },
        { code: "hi", label: "Hindi" },
        { code: "ml", label: "Malayalam" },
        { code: "te", label: "Telugu" },
        { code: "ta", label: "Tamil" }
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const res = await getProfile();
            if (res?.success) {
                setName(res.user.name || "");
                setPhone(res.user.phone || "");
                setOriginalPhone(res.user.phone || "");
                setLanguage(res.user.language || "en");
                setRole(res.user.role || "farmer");
            }
        } catch (e) {
            console.log("EditProfile error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async () => {
        if (!/^\d{10}$/.test(phone)) {
            Alert.alert("Error", "Please enter a valid 10-digit phone number.");
            return;
        }
        setVerifying(true);
        try {
            const res = await apiFetch<any>(ENDPOINTS.AUTH.SEND_OTP, {
                method: "POST",
                body: JSON.stringify({ phone })
            });
            if (res.success) {
                setOtpSent(true);
                if (res.otp) Alert.alert("OTP Sent", `Simulated OTP: ${res.otp}`);
            } else {
                Alert.alert("Error", res.message || "Failed to send OTP");
            }
        } catch (e) {
            Alert.alert("Error", "Connection failed");
        } finally {
            setVerifying(false);
        }
    };

    const handleVerifyAndSave = async () => {
        if (otp.length < 4) {
            Alert.alert("Error", "Please enter a valid OTP.");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Verify OTP first
            const verifyRes = await apiFetch<any>(ENDPOINTS.AUTH.VERIFY_OTP, {
                method: "POST",
                body: JSON.stringify({ phone, otp })
            });

            if (!verifyRes.success) {
                Alert.alert("Error", "Invalid OTP. Please try again.");
                setSubmitting(false);
                return;
            }

            // 2. Save profile with new phone
            const res = await updateProfile({ name, language, phone } as any);
            if (res?.success) {
                await setLanguageService(language);
                Alert.alert("Success", "Profile updated successfully.");
                router.back();
            } else {
                Alert.alert("Error", res?.message || "Update failed.");
            }
        } catch (e) {
            Alert.alert("Error", "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Name cannot be empty.");
            return;
        }

        // If phone changed, require OTP
        if (phone !== originalPhone && !otpSent) {
            handleSendOTP();
            return;
        }

        if (otpSent) {
            handleVerifyAndSave();
            return;
        }

        setSubmitting(true);
        try {
            const res = await updateProfile({ name, language });
            if (res?.success) {
                await setLanguageService(language);
                Alert.alert("Success", "Profile updated successfully.");
                router.back();
            } else {
                Alert.alert("Error", res?.message || "Update failed.");
            }
        } catch (e) {
            Alert.alert("Error", "Something went wrong.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#1B5E20" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <Stack.Screen options={{ title: t("profile.edit_title") || "Edit Profile", headerShadowVisible: false }} />
            <NavAuto />

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{name.charAt(0) || "U"}</Text>
                    </View>
                    <Text style={styles.roleText}>{role.toUpperCase()}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.phoneInputRow}>
                            <Text style={styles.prefix}>+91</Text>
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="number-pad"
                                maxLength={10}
                                placeholder="10-digit mobile number"
                            />
                        </View>
                        {phone !== originalPhone && !otpSent && (
                            <Text style={styles.hint}>Changing phone requires OTP verification</Text>
                        )}
                    </View>

                    {otpSent && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Enter OTP</Text>
                            <TextInput
                                style={styles.input}
                                value={otp}
                                onChangeText={setOtp}
                                keyboardType="number-pad"
                                maxLength={6}
                                placeholder="Enter 6-digit OTP"
                            />
                            <TouchableOpacity onPress={handleSendOTP}>
                                <Text style={styles.resendText}>Didn't get code? Resend</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Preferred Language</Text>
                        <View style={styles.langGrid}>
                            {languages.map(l => (
                                <TouchableOpacity
                                    key={l.code}
                                    style={[styles.langBtn, language === l.code && styles.langBtnActive]}
                                    onPress={() => setLanguage(l.code)}
                                >
                                    <Text style={[styles.langText, language === l.code && styles.langTextActive]}>{l.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveBtn, (submitting || verifying) && { opacity: 0.7 }]}
                        onPress={handleSave}
                        disabled={submitting || verifying}
                    >
                        {submitting || verifying ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveBtnText}>
                                {otpSent ? "Verify & Save" : (phone !== originalPhone ? "Send OTP" : "Save Changes")}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    scroll: { padding: 24 },
    header: { alignItems: "center", marginBottom: 32 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#1e3a8a", alignItems: "center", justifyContent: "center", marginBottom: 12 },
    avatarText: { color: "#fff", fontSize: 32, fontWeight: "800" },
    roleText: { fontSize: 13, fontWeight: "800", color: "#64748B", letterSpacing: 1 },
    form: { gap: 24 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: "700", color: "#475569" },
    input: { height: 50, backgroundColor: "#F1F5F9", borderRadius: 12, paddingHorizontal: 16, fontSize: 16, color: "#1E293B", borderWidth: 1, borderColor: "#E2E8F0", marginBottom: 4 },
    phoneInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
    prefix: { paddingHorizontal: 16, fontSize: 16, fontWeight: '700', color: '#64748B', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
    hint: { fontSize: 12, color: '#64748B', marginTop: 4 },
    resendText: { color: COLORS.primary, fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'right' },
    langGrid: { flexDirection: "row", flexWrap: 'wrap', gap: 8 },
    langBtn: { width: '31%', height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
    langBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    langText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
    langTextActive: { color: "#fff" },
    saveBtn: { height: 54, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 20 },
    saveBtnText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
