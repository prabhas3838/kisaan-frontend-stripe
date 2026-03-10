import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getProfile, requestVerification } from "../services/userServices";
import { getToken } from "../services/token";
import NavAuto from "../components/navigation/NavAuto";


export default function ProfileScreen() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");
  const [user, setUser] = useState<any>(null);
  const [msg, setMsg] = useState("");

  // Verification fields
  const [aadhaar, setAadhaar] = useState("");
  const [pan, setPan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const userToken = await getToken();
      setToken(userToken);
      if (userToken) loadProfile();
    })();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfile();
      if (res.success) {
        setUser(res.user);
        await AsyncStorage.setItem("profile", JSON.stringify(res.user));
      }
    } catch (e) {
      setMsg("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!aadhaar || !pan) {
      setMsg("Please enter both Aadhaar and PAN numbers");
      return;
    }
    try {
      setSubmitting(true);
      setMsg("");
      const res = await requestVerification({
        aadhaarNumber: aadhaar,
        panNumber: pan,
      });

      if (res.success) {
        setMsg("Verification request submitted successfully!");
        loadProfile(); // Refresh status
      } else {
        setMsg(res.message || "Submission failed");
      }
    } catch (e: any) {
      setMsg(e.message || "Error submitting verification");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    router.replace("/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "#10B981";
      case "pending": return "#F59E0B";
      case "rejected": return "#EF4444";
      default: return "#64748B";
    }
  };

  const vStatus = user?.verificationStatus || "unverified";

  return (
    <ScrollView style={styles.root}>
      <Stack.Screen options={{
        headerShown: false,
        title: t("profile.title") || "My Profile",
        headerRight: () => (
          <TouchableOpacity onPress={logout} style={{ marginRight: 15 }}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        )
      }} />
      <NavAuto />


      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
            </View>
            <Text style={styles.name}>{user?.name || "User"}</Text>
            <Text style={styles.role}>{user?.role?.toUpperCase() || "FARMER"}</Text>

            <View style={[styles.badge, { backgroundColor: getStatusColor(vStatus) }]}>
              <Text style={styles.badgeText}>{vStatus.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>+91 {user?.phone || "--"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Location</Text>
              <Text style={styles.value}>{user?.location || "Not set"}</Text>
            </View>
          </View>

          {vStatus !== "approved" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Identity Verification</Text>
              <Text style={styles.hint}>Submit documents to gain trusted status and access live auctions.</Text>

              <TextInput
                style={styles.input}
                placeholder="Aadhaar Number (12 digits)"
                value={aadhaar}
                onChangeText={setAadhaar}
                keyboardType="number-pad"
                maxLength={12}
              />
              <TextInput
                style={styles.input}
                placeholder="PAN Number"
                value={pan}
                onChangeText={setPan}
                autoCapitalize="characters"
                maxLength={10}
              />

              <TouchableOpacity
                style={[styles.verifyBtn, (submitting || vStatus === "pending") && styles.disabledBtn]}
                onPress={handleVerify}
                disabled={submitting || vStatus === "pending"}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.verifyBtnText}>
                    {vStatus === "pending" ? "Request Pending" : "Submit Documents"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {msg ? <Text style={styles.msgText}>{msg}</Text> : null}

          <View style={styles.actionSection}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={() => router.replace(user?.role === "buyer" ? "/buyer-dashboard" : "/farmer-dashboard")}
            >
              <Ionicons name="apps-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
              <Text style={styles.primaryActionText}>Back to Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() => router.push("/edit-profile")}
            >
              <Text style={styles.secondaryActionText}>Edit Profile Info</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  center: { padding: 100, alignItems: "center", justifyContent: "center" },
  header: { padding: 30, alignItems: "center", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#3B82F6", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  name: { fontSize: 22, fontWeight: "bold", color: "#0F172A" },
  role: { fontSize: 14, color: "#64748B", marginTop: 4, letterSpacing: 1 },
  badge: { marginTop: 12, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  badgeText: { fontSize: 11, fontWeight: "800", color: "#fff" },

  section: { margin: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E2E8F0" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#0F172A", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  label: { fontSize: 14, color: "#64748B" },
  value: { fontSize: 14, fontWeight: "600", color: "#0F172A" },

  hint: { fontSize: 13, color: "#64748B", marginBottom: 16, lineHeight: 18 },
  input: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 15, backgroundColor: "#F9FAFB" },
  verifyBtn: { backgroundColor: "#10B981", padding: 14, borderRadius: 8, alignItems: "center" },
  disabledBtn: { opacity: 0.6 },
  verifyBtnText: { color: "#fff", fontWeight: "bold" },

  msgText: { textAlign: "center", marginTop: 10, color: "#3B82F6", fontWeight: "500", paddingHorizontal: 20 },

  actionSection: { paddingHorizontal: 16, marginBottom: 40 },
  primaryAction: { flexDirection: "row", backgroundColor: "#3B82F6", padding: 16, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  primaryActionText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  secondaryAction: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: "#3B82F6", alignItems: "center", justifyContent: "center" },
  secondaryActionText: { color: "#3B82F6", fontWeight: "bold" },
});
