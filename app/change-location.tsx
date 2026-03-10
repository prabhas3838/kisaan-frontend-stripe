import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router, Stack } from "expo-router";
import NavAuto from "../components/navigation/NavAuto";

import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { updateLocation } from "../services/userServices";
import { ENDPOINTS } from "../services/api";

type Place = { id: string; name: string; lat: number; lng: number };

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FAFAFA" },
  content: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },

  header: { marginBottom: 20 },
  title: { fontSize: 26, fontWeight: "800", color: "#111827" },
  subtitle: { marginTop: 6, fontSize: 14, color: "#6B7280", fontWeight: "500" },

  actions: { gap: 16 },

  primaryAction: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryActionText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 8,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { fontSize: 13, color: "#9CA3AF", fontWeight: "500" },

  dropdownHeader: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  dropdownHeaderActive: {
    borderColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownHeaderText: { color: "#374151", fontSize: 16, fontWeight: "600" },
  dropdownHeaderTextActive: { color: "#1D4ED8" },
  dropdownChevron: { fontSize: 12, color: "#9CA3AF", fontWeight: "700" },
  dropdownChevronActive: { color: "#3B82F6" },

  dropdownContent: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "#3B82F6",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
    gap: 12,
  },

  label: { fontSize: 14, fontWeight: "600", color: "#374151" },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: "500",
    color: "#111827",
  },

  placeRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  placeName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  placeMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },

  emptyText: { paddingVertical: 12, color: "#6B7280" },

  actionDisabled: { backgroundColor: "#D1D5DB" },
  actionPressed: { opacity: 0.7 },

  errorBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#DC2626",
  },
  errorText: { color: "#991B1B", fontSize: 14, fontWeight: "500" },
});

export default function ChangeLocation() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [places, setPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editing, setEditing] = useState(true);

  const toNum = (v: any) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const normalizePlaces = (json: any): Place[] => {
    const list =
      json?.places ||
      json?.mandis ||
      json?.data ||
      json?.items ||
      json?.results ||
      json;
    if (!Array.isArray(list)) return [];

    return list
      .map((x: any, idx: number) => {
        const id = String(x?._id ?? x?.id ?? idx);
        const name = String(
          x?.locationName ??
          x?.mandi ??
          x?.name ??
          x?.mandiName ??
          x?.market ??
          x?.place ??
          "Unknown",
        ).trim();

        const lat =
          x?.lat ??
          x?.latitude ??
          x?.location?.lat ??
          x?.location?.latitude ??
          x?.coords?.lat ??
          x?.locationCoordinates?.[1] ??
          x?.location?.coordinates?.[1];

        const lng =
          x?.lng ??
          x?.longitude ??
          x?.location?.lng ??
          x?.location?.longitude ??
          x?.coords?.lng ??
          x?.locationCoordinates?.[0] ??
          x?.location?.coordinates?.[0];

        return { id, name, lat: toNum(lat), lng: toNum(lng) };
      })
      .filter((p) => p.name.length > 0);
  };

  const loadPlaces = async () => {
    try {
      setMsg("");
      const res = await fetch(ENDPOINTS.MARKET.LOCATIONS);
      if (!res.ok) {
        setMsg("Could not load places.");
        return;
      }
      const json = await res.json();
      const mapped = normalizePlaces(json);
      setPlaces(mapped);
      if (mapped.length === 0) setMsg("No places found.");
    } catch (e) {
      setMsg("Network error while loading places.");
    }
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return places;
    return places.filter((p) => p.name.toLowerCase().includes(q));
  }, [places, searchQuery]);

  const requireToken = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token) {
      router.replace("/login" as any);
      return null;
    }
    return token;
  };

  const updateCachedProfileLocation = async (loc: {
    lat: number;
    lng: number;
    address: string;
  }) => {
    try {
      const raw = await AsyncStorage.getItem("profile");
      if (!raw) return;
      const p = JSON.parse(raw);
      const next = {
        ...p,
        location: {
          ...(p.location || {}),
          lat: loc.lat,
          lng: loc.lng,
          address: loc.address,
        },
      };
      await AsyncStorage.setItem("profile", JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const saveLocation = async (lat: number, lng: number, address: string) => {
    setLoading(true);
    setMsg("");
    try {
      const token = await requireToken();
      if (!token) return;

      // ✅ backend update
      await updateLocation({ lat, lng, address });

      // ✅ update local cache so FarmerProfile updates immediately
      await updateCachedProfileLocation({ lat, lng, address });

      Alert.alert("Saved", "Location updated successfully.");
      router.back();
    } catch (e: any) {
      setMsg(e?.message || "Failed to update location.");
    } finally {
      setLoading(false);
    }
  };

  const useGps = async () => {
    setLoading(true);
    setMsg("");
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setMsg("Location permission denied. Choose from list instead.");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      let address = "Current Location";
      try {
        const geo = await Location.reverseGeocodeAsync({
          latitude: lat,
          longitude: lng,
        });
        address = geo?.[0]
          ? [
            geo[0].name,
            geo[0].district,
            geo[0].city,
            geo[0].region,
            geo[0].country,
          ]
            .filter(Boolean)
            .join(", ")
          : "Current Location";
      } catch { }

      await saveLocation(lat, lng, address);
    } catch (e: any) {
      setMsg(e?.message || "Could not get location.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavAuto />
      <KeyboardAvoidingView
        style={s.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={s.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.header}>
            <Text style={s.title}>Change Location</Text>
            <Text style={s.subtitle}>
              Update your location to show nearby mandis
            </Text>
          </View>

          <View style={s.actions}>
            <Pressable
              onPress={useGps}
              disabled={loading}
              style={({ pressed }) => [
                s.primaryAction,
                loading && s.actionDisabled,
                pressed && !loading && s.actionPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={s.primaryActionText}>Use Current Location</Text>
              )}
            </Pressable>

            <View style={s.divider}>
              <View style={s.dividerLine} />
              <Text style={s.dividerText}>or</Text>
              <View style={s.dividerLine} />
            </View>

            <Pressable
              onPress={() => setEditing((v) => !v)}
              style={({ pressed }) => [
                s.dropdownHeader,
                editing && s.dropdownHeaderActive,
                pressed && s.actionPressed,
              ]}
            >
              <Text
                style={[
                  s.dropdownHeaderText,
                  editing && s.dropdownHeaderTextActive,
                ]}
              >
                Choose from list
              </Text>
              <Text
                style={[s.dropdownChevron, editing && s.dropdownChevronActive]}
              >
                {editing ? "▲" : "▼"}
              </Text>
            </Pressable>

            {editing && (
              <View style={s.dropdownContent}>
                <Text style={s.label}>Search place</Text>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Type to filter (e.g., warangal)"
                  placeholderTextColor="#9CA3AF"
                  style={s.input}
                  editable={!loading}
                />

                <View style={{ maxHeight: 260 }}>
                  {filteredPlaces.length === 0 ? (
                    <Text style={s.emptyText}>
                      {places.length === 0 ? "Loading..." : "No matches"}
                    </Text>
                  ) : (
                    <ScrollView
                      style={{ maxHeight: 260 }}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator
                    >
                      {filteredPlaces.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() =>
                            saveLocation(item.lat, item.lng, item.name)
                          }
                          disabled={loading}
                          style={({ pressed }) => [
                            s.placeRow,
                            pressed && !loading && s.actionPressed,
                          ]}
                        >
                          <Text style={s.placeName}>{item.name}</Text>
                          <Text style={s.placeMeta}>
                            {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}
                </View>
              </View>
            )}
          </View>

          {msg ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{msg}</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

