import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { apiFetch } from "../services/http";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ENDPOINTS } from "../services/api";

type Role = "farmer" | "buyer";

export default function SigninScreen() {
  const { t } = useTranslation();

  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [role, setRole] = useState<Role | "">("");
  const [roleOpen, setRoleOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  const roles = useMemo(
    () => [
      { label: "Farmer / Producer", value: "farmer" as Role },
      { label: "Buyer / Trader", value: "buyer" as Role },
    ],
    [],
  );

  const onContinue = async () => {
    setMsg("");
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || !role || !/^\d{10}$/.test(trimmedPhone)) {
      setMsg("Please provide all details correctly");
      return;
    }

    try {
      setLoading(true);
      const res = await apiFetch<any>(ENDPOINTS.AUTH.SEND_OTP, {
        method: "POST",
        body: JSON.stringify({ phone: trimmedPhone }),
      });

      if (res?.success) {
        if (res.otp) {
          console.log("SIMULATED_OTP:", res.otp);
          Alert.alert("Simulated OTP", `Your verification code is: ${res.otp}`);
        }
        router.push({
          pathname: "/verify",
          params: { phone: trimmedPhone, name: trimmedName, role },
        });
      } else {
        setMsg(res?.message || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error("SIGNIN_ERROR:", err.message);
      setMsg(err.message || "Connection error. Check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require("../assets/images/f.jpg")}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlay} />

        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.brandContainer}>
              <Text style={styles.brandName}>
                <Text style={styles.brandGreen}>KISSAAN</Text>{" "}
                <Text style={styles.brandBlue}>SAATHI</Text>
              </Text>
              <Text style={styles.tagline}>CREATE NEW ACCOUNT</Text>
            </View>

            <View style={styles.formWrapper}>
              <Text style={styles.formTitle}>Registration</Text>

              <Text style={styles.label}>Full Name</Text>
              <View style={styles.pillInput}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Ex: Rajesh Kumar"
                  placeholderTextColor="#777"
                  style={styles.textInput}
                />
              </View>

              <Text style={styles.label}>Primary Role</Text>
              <Pressable
                onPress={() => setRoleOpen(!roleOpen)}
                style={[styles.pillInput, roleOpen && styles.pillInputActive]}
              >
                <Text style={[styles.pillInputText, !role && { color: "#777" }]}>
                  {role ? roles.find(r => r.value === role)?.label : "Select your role"}
                </Text>
                <Ionicons name={roleOpen ? "chevron-up" : "chevron-down"} size={14} color="#666" />
              </Pressable>

              {roleOpen && (
                <View style={styles.dropdownBody}>
                  {roles.map((r) => (
                    <Pressable
                      key={r.value}
                      onPress={() => { setRole(r.value); setRoleOpen(false); }}
                      style={[styles.dropdownRow, role === r.value && styles.dropdownRowActive]}
                    >
                      <Text style={[styles.dropdownRowText, role === r.value && styles.dropdownRowTextActive]}>
                        {r.label}
                      </Text>
                      {role === r.value && <Ionicons name="checkmark" size={16} color="rgb(37,95,153)" />}
                    </Pressable>
                  ))}
                </View>
              )}

              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.pillInput}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/\D/g, ""))}
                  placeholder="10-digit number"
                  placeholderTextColor="#777"
                  keyboardType="number-pad"
                  maxLength={10}
                  style={styles.textInput}
                />
              </View>

              {msg ? <Text style={styles.errorMsg}>{msg}</Text> : null}

              <TouchableOpacity
                style={[styles.btnPrimary, loading && styles.btnDisabled]}
                onPress={onContinue}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Proceed to Verify</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>{t("signup.already_account")}</Text>
                <TouchableOpacity onPress={() => router.push("/login")}>
                  <Text style={styles.linkText}>{t("signup.login")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1, width: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,248,235,0.55)",
  },
  kav: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  brandName: {
    fontSize: 28,
    fontWeight: "900",
  },
  brandGreen: { color: "green" },
  brandBlue: { color: "rgb(37,95,153)" },
  tagline: {
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 4,
  },
  formWrapper: {
    width: "100%",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "green",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
    marginTop: 16,
  },
  pillInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 30,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    height: 48,
  },
  pillInputActive: {
    borderColor: "rgb(37,95,153)",
  },
  pillInputText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  dropdownBody: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownRowActive: {
    backgroundColor: "#F0F9FF",
  },
  dropdownRowText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  dropdownRowTextActive: {
    color: "rgb(37,95,153)",
  },
  countryCode: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginRight: 10,
  },
  errorMsg: {
    color: "#b00020",
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
  btnPrimary: {
    backgroundColor: "rgb(37,95,153)",
    height: 52,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  linkText: {
    fontSize: 14,
    color: "green",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
