import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import NavFarmer from "../components/navigation/NavFarmer";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function FarmerProfile() {
  return (
    <View style={{ flex: 1 }}>
      <NavFarmer />
      <FarmerProfileContent />
    </View>
  );
}

function FarmerProfileContent() {

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [raw, setRaw] = useState<string>("");

  const load = async () => {
    setLoading(true);
    try {
      const p = await AsyncStorage.getItem("profile");
      console.log("📦 AsyncStorage profile RAW:", p);
      setRaw(p || "");

      if (!p) {
        setProfile(null);
        return;
      }

      try {
        setProfile(JSON.parse(p));
      } catch (e) {
        console.log("❌ profile JSON parse failed:", e);
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View
        style={[s.page, { justifyContent: "center", alignItems: "center" }]}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 10, color: "#64748b" }}>
          Loading profile…
        </Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <ScrollView contentContainerStyle={s.page}>
        <Text style={s.title}>Farmer Profile</Text>

        <View style={s.card}>
          <Text style={{ fontWeight: "800", color: "#0f172a" }}>
            No profile saved on this device
          </Text>
          <Text style={{ marginTop: 8, color: "#64748b" }}>
            This page reads from AsyncStorage key:{" "}
            <Text style={{ fontWeight: "800" }}>"profile"</Text>. If you never
            stored it after login, it will be empty.
          </Text>

          <Text style={{ marginTop: 12, color: "#64748b", fontWeight: "700" }}>
            Debug (raw value):
          </Text>
          <Text style={{ marginTop: 6, color: "#334155" }}>
            {raw ? raw : "null"}
          </Text>
        </View>

        <Pressable style={s.actionBtn} onPress={() => router.replace("/login")}>
          <Text style={s.actionBtnText}>Go to Login</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.page}>
      <Text style={s.title}>Farmer Profile</Text>

      <View style={s.card}>
        <Row label="Name" value={profile?.name || "—"} />
        <Row
          label="Phone"
          value={profile?.phone ? `+91 ${profile.phone}` : "—"}
        />
        <Row
          label="Location"
          value={
            profile?.location?.address ||
            profile?.location?.name ||
            profile?.location ||
            "Not set"
          }
        />
      </View>

      <View style={s.card}>
        <Text style={s.section}>Farm Tools</Text>

        <Action label="My Crops" onPress={() => { }} />
        <Action
          label="Add Crop"
          onPress={() => router.push("/add-crop" as any)}
        />
        <Action
          label="Change Location"
          onPress={() => router.push("/change-location" as any)}
        />
      </View>

      <Pressable style={s.refresh} onPress={load}>
        <Text style={s.refreshText}>Reload Profile</Text>
      </Pressable>

      <Logout />
    </ScrollView>
  );
}

function Row({ label, value }: any) {
  return (
    <View style={s.row}>
      <Text style={s.key}>{label}</Text>
      <Text style={s.val}>{String(value)}</Text>
    </View>
  );
}

function Action({ label, onPress }: any) {
  return (
    <Pressable onPress={onPress} style={s.action}>
      <Text style={s.actionText}>{label}</Text>
    </Pressable>
  );
}

function Logout() {
  return (
    <Pressable
      onPress={async () => {
        await AsyncStorage.multiRemove(["token", "profile", "role"]);
        router.replace("/login" as any);
      }}
      style={s.logout}
    >
      <Text style={s.logoutText}>Logout</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  page: { flexGrow: 1, padding: 20, backgroundColor: "#FAFAFA" },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 16 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },

  section: { fontWeight: "800", marginBottom: 10 },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  key: { color: "#6B7280", fontWeight: "700" },
  val: { fontWeight: "800", flexShrink: 1, textAlign: "right" },

  action: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  actionText: { fontWeight: "700", color: "#2563EB" },

  refresh: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    marginTop: 6,
  },
  refreshText: { fontWeight: "800", color: "#0f172a" },

  actionBtn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    alignItems: "center",
  },
  actionBtnText: { color: "#fff", fontWeight: "800" },

  logout: {
    marginTop: 20,
    padding: 14,
    borderRadius: 999,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
  },
  logoutText: { color: "#B91C1C", fontWeight: "800" },
});
