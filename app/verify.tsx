import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ImageBackground,
} from "react-native";
import { ENDPOINTS } from "../services/api";
import { apiFetch } from "../services/http";

type VerifyOtpResponse = {
  success?: boolean;
  message?: string;
};

export default function VerifyScreen() {
  const { t } = useTranslation();

  const params = useLocalSearchParams<{
    phone?: string;
    name?: string;
    role?: string;
  }>();

  const phone = String(params.phone ?? "");
  const name = String(params.name ?? "");
  const role = String(params.role ?? "farmer");

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const inputs = useRef<Array<TextInput | null>>([]);
  const otp = useMemo(() => digits.join(""), [digits]);
  const canSubmit = otp.length === 6 && !digits.includes("");

  useEffect(() => {
    const id = setTimeout(() => inputs.current[0]?.focus(), 150);
    return () => clearTimeout(id);
  }, []);

  const setDigit = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = v;
      return next;
    });
    if (v && index < 5) inputs.current[index + 1]?.focus();
    if (v && index === 5) setTimeout(() => verify(), 100);
  };

  const onKeyPress = (index: number, key: string) => {
    if (key === "Backspace") {
      setDigits((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = "";
        } else if (index > 0) {
          next[index - 1] = "";
          inputs.current[index - 1]?.focus();
        }
        return next;
      });
    }
  };

  const verify = async () => {
    if (!canSubmit || loading) return;
    setMsg("");
    try {
      setLoading(true);
      const res = await apiFetch<any>(ENDPOINTS.AUTH.VERIFY_OTP, {
        method: "POST",
        body: JSON.stringify({ phone, otp }),
      });

      if (res.success) {
        // If the backend returns a token or user info here, store it.
        // Usually verify-otp might return a token if it's the final step, 
        // but here it goes to set-pin.
        router.replace({ pathname: "/set-pin", params: { phone, name, role } });
      } else {
        setMsg(res.message || "Invalid verification code");
      }
    } catch (e: any) {
      setMsg(e.message || "Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
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
              <Text style={styles.brandTagline}>VERIFICATION REQUIRED</Text>
            </View>

            <View style={styles.formWrapper}>
              <Text style={styles.cardHeader}>Verify Identity</Text>
              <Text style={styles.instruction}>
                We've sent a 6-digit code to{" "}
                <Text style={styles.phoneHighlight}>+91 {phone}</Text>
              </Text>

              <View style={styles.otpContainer}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <TextInput
                    key={i}
                    ref={(r) => { inputs.current[i] = r; }}
                    style={[styles.otpInput, digits[i] && styles.otpInputFilled]}
                    value={digits[i]}
                    onChangeText={(v) => setDigit(i, v)}
                    onKeyPress={({ nativeEvent }) => onKeyPress(i, nativeEvent.key)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    editable={!loading}
                  />
                ))}
              </View>

              {msg ? <Text style={styles.errorText}>{msg}</Text> : null}

              <TouchableOpacity
                onPress={verify}
                disabled={!canSubmit || loading}
                style={[styles.verifyBtn, (!canSubmit || loading) && styles.btnDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.verifyBtnText}>Verify & Continue</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Haven't received yet?</Text>
                <TouchableOpacity onPress={() => { }} disabled={loading}>
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
              </View>
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
  phoneHighlight: {
    color: "#000",
    fontWeight: "700",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 10,
  },
  otpInput: {
    flex: 1,
    height: 52,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 30,
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  otpInputFilled: {
    borderColor: "rgb(37,95,153)",
  },
  errorText: {
    color: "#b00020",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 16,
  },
  verifyBtn: {
    backgroundColor: "rgb(37,95,153)",
    height: 52,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  verifyBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
  },
  resendText: {
    fontSize: 14,
    color: "green",
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
