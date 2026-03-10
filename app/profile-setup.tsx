// app/profile-setup.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ImageBackground,
} from "react-native";

const LANGS = [
  { label: "English", value: "en" },
  { label: "മലയാളം", value: "ml" },
  { label: "தமிழ்", value: "ta" },
  { label: "తెలుగు", value: "te" },
  { label: "हिंदी", value: "hi" },
];

export default function ProfileSetup() {
  const params = useLocalSearchParams<{
    phone?: string;
    name?: string;
    role?: string;
    pin?: string;
  }>();
  const phone = String(params.phone ?? "");
  const name = String(params.name ?? "");
  const role = String(params.role ?? "");
  const pin = String(params.pin ?? "");

  const [lang, setLang] = useState<string>("en");
  const [loading, setLoading] = useState(false);

  const canContinue = useMemo(() => !!lang && !loading, [lang, loading]);

  const next = async () => {
    // Pass data to next screen
    router.replace({
      pathname: "/profile-location",
      params: { phone, name, role, pin, lang },
    });
  };

  return (
    <View style={s.root}>
      <ImageBackground
        source={require("../assets/images/f.jpg")}
        style={s.bg}
        resizeMode="cover"
      >
        <View style={s.overlay} />
        <View style={s.content}>
          <View style={s.brandHeader}>
            <Text style={s.brandTitle}>
              <Text style={s.brandGreen}>KISSAAN</Text>{" "}
              <Text style={s.brandBlue}>SAATHI</Text>
            </Text>
            <Text style={s.brandTagline}>STEP 1 OF 2</Text>
          </View>

          <View style={s.formWrapper}>
            <Text style={s.title}>Select Language</Text>
            <Text style={s.subtitle}>
              Choose the language you want to use in the app
            </Text>

            <View style={s.options}>
              {LANGS.map((l) => {
                const active = lang === l.value;
                return (
                  <Pressable
                    key={l.value}
                    onPress={() => setLang(l.value)}
                    style={({ pressed }) => [
                      s.option,
                      active && s.optionActive,
                      pressed && s.optionPressed,
                    ]}
                  >
                    <Text style={[s.optionText, active && s.optionTextActive]}>
                      {l.label}
                    </Text>
                    {active && <View style={s.check}><Text style={s.checkText}>✓</Text></View>}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={next}
              disabled={!canContinue}
              style={({ pressed }) => [
                s.button,
                !canContinue && s.buttonDisabled,
                pressed && canContinue && s.buttonPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.buttonText}>Continue</Text>
              )}
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  bg: { flex: 1, width: "100%" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,248,235,0.55)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
  formWrapper: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "green",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  optionActive: {
    borderColor: "rgb(37,95,153)",
  },
  optionPressed: {
    opacity: 0.7,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  optionTextActive: {
    color: "rgb(37,95,153)",
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgb(37,95,153)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
  },
  button: {
    marginTop: "auto",
    backgroundColor: "rgb(37,95,153)",
    height: 52,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
