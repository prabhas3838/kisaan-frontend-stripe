import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React from "react";
import NavAuto from "../components/navigation/NavAuto";

import {
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function SmsInfoScreen() {
    const steps = [
        { title: "Price Check", cmd: "PRICE <Crop Name>", desc: "Example: PRICE Tomato" },
        { title: "Nearby Mandis", cmd: "MANDI <Pincode>", desc: "Example: MANDI 110001" },
        { title: "Market Help", cmd: "HELP", desc: "Get a list of all commands" },
    ];

    return (
        <ScrollView style={styles.root}>
            <Stack.Screen options={{ title: "SMS & IVR Services", headerShown: false }} />
            <NavAuto />


            <View style={styles.hero}>
                <Ionicons name="chatbox-ellipses-outline" size={60} color="#3B82F6" />
                <Text style={styles.heroTitle}>No Internet? No Problem.</Text>
                <Text style={styles.heroSub}>Access Kisan Saathi via SMS or Call</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>SMS Service (Shortcode: 56767)</Text>
                {steps.map((s, i) => (
                    <View key={i} style={styles.card}>
                        <Text style={styles.cardTitle}>{s.title}</Text>
                        <View style={styles.cmdBox}>
                            <Text style={styles.cmdText}>{s.cmd}</Text>
                        </View>
                        <Text style={styles.cardDesc}>{s.desc}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>IVR Toll-Free Number</Text>
                <View style={styles.phoneCard}>
                    <Ionicons name="call" size={24} color="#10B981" />
                    <Text style={styles.phoneNumber}>1800-123-4567</Text>
                </View>
                <Text style={styles.phoneDesc}>Call from your registered mobile number to get price alerts via automated voice.</Text>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Standard SMS rates may apply. Services available in 12 Indian languages.</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F8FAFC" },
    hero: { padding: 40, alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
    heroTitle: { fontSize: 24, fontWeight: "bold", color: "#0F172A", marginTop: 16 },
    heroSub: { fontSize: 16, color: "#64748B", marginTop: 8 },

    section: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A", marginBottom: 16 },

    card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#E2E8F0" },
    cardTitle: { fontSize: 16, fontWeight: "bold", color: "#0F172A", marginBottom: 8 },
    cmdBox: { backgroundColor: "#F1F5F9", padding: 10, borderRadius: 8, marginBottom: 8 },
    cmdText: { fontFamily: Platform.OS === "ios" ? "Courier" : "monospace", fontWeight: "bold", fontSize: 15, color: "#1E293B" },
    cardDesc: { fontSize: 14, color: "#64748B" },

    phoneCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#ECFDF5", padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#10B981", marginBottom: 12 },
    phoneNumber: { fontSize: 22, fontWeight: "bold", color: "#065F46", marginLeft: 12 },
    phoneDesc: { fontSize: 14, color: "#64748B", lineHeight: 20 },

    footer: { padding: 40, alignItems: "center" },
    footerText: { fontSize: 12, color: "#94A3B8", textAlign: "center" },
});
import { Platform } from "react-native";
