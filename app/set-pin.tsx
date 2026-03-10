import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ImageBackground,
} from "react-native";

type SignupCompleteResponse = {
  success?: boolean;
  message?: string;
  token?: string;
  user?: { role?: string };
};

export default function SetPinScreen() {
  const { t } = useTranslation();

  const params = useLocalSearchParams<{
    phone?: string;
    name?: string;
    role?: string;
  }>();

  const phone = String(params.phone ?? "");
  const name = String(params.name ?? "");
  const role = String(params.role ?? "farmer");

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onSave = async () => {
    setMsg("");
    if (!phone || !name) {
      setMsg("Required session details missing. Please restart.");
      return;
    }
    if (!/^\d{4,6}$/.test(pin)) {
      setMsg("PIN must be 4 to 6 digits");
      return;
    }
    if (pin !== confirmPin) {
      setMsg("PINs do not match");
      return;
    }

    router.replace({
      pathname: "/profile-setup",
      params: { phone, role, name, pin },
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.root}>
        <ImageBackground
          source={require("../assets/images/f.jpg")}
          style={styles.bg}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
          >
            <View style={styles.brandHeader}>
              <Text style={styles.brandTitle}>
                <Text style={styles.brandGreen}>KISSAAN</Text>{" "}
                <Text style={styles.brandBlue}>SAATHI</Text>
              </Text>
              <Text style={styles.brandTagline}>SECURITY CONFIGURATION</Text>
            </View>

            <View style={styles.formWrapper}>
              <Text style={styles.cardHeader}>Create Access PIN</Text>
              <Text style={styles.instruction}>
                Establish a secure PIN to protect your account and transactions.
              </Text>

              <Text style={styles.label}>New PIN</Text>
              <View style={styles.pillInput}>
                <TextInput
                  style={styles.input}
                  value={pin}
                  onChangeText={(v) => setPin(v.replace(/\D/g, ""))}
                  placeholder="••••"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  editable={!loading}
                />
              </View>

              <Text style={[styles.label, { marginTop: 16 }]}>Verify PIN</Text>
              <View style={styles.pillInput}>
                <TextInput
                  style={styles.input}
                  value={confirmPin}
                  onChangeText={(v) => setConfirmPin(v.replace(/\D/g, ""))}
                  placeholder="••••"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  secureTextEntry
                  maxLength={6}
                  editable={!loading}
                />
              </View>

              {msg ? <Text style={styles.errorText}>{msg}</Text> : null}

              <TouchableOpacity
                style={[styles.saveBtn, loading && styles.btnDisabled]}
                onPress={onSave}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Secure Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1, width: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,248,235,0.55)",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  brandHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#000",
  },
  brandGreen: { color: "green" },
  brandBlue: { color: "rgb(37,95,153)" },
  brandTagline: {
    fontSize: 12,
    fontWeight: "700",
    color: "#666",
    letterSpacing: 2,
    marginTop: 4,
  },
  formWrapper: {
    width: "100%",
  },
  cardHeader: {
    fontSize: 20,
    fontWeight: "800",
    color: "green",
    textAlign: "center",
    marginBottom: 20,
  },
  instruction: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 6,
    marginTop: 2,
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
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    textAlign: "center",
    letterSpacing: 8,
  },
  errorText: {
    color: "#b00020",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
  saveBtn: {
    backgroundColor: "rgb(37,95,153)",
    height: 52,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
