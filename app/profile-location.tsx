import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ImageBackground,
} from "react-native";
import { registerUser } from "../services/userServices";
import { ENDPOINTS } from "../services/api";
import { apiFetch } from "../services/http";

type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};
export default function ProfileLocation() {
  const params = useLocalSearchParams<{
    phone?: string;
    lang?: string;
    name?: string;
    role?: string;
    pin?: string;
  }>();
  const phone = String(params.phone ?? "");
  const lang = String(params.lang ?? "en");
  const name = String(params.name ?? "");
  const role = String(params.role ?? "farmer");
  const pin = String(params.pin ?? "");

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState("");

  const [places, setPlaces] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  // ... (helpers helpers remain same) ...

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

        // ✅ include fields your /mandi API actually returns
        const name = String(
          x?.locationName ??
          x?.mandi ?? // e.g., "Azadpur Mandi"
          x?.name ??
          x?.mandiName ??
          x?.market ??
          x?.place ??
          "Unknown",
        ).trim();

        // ✅ support more coordinate shapes
        const lat =
          x?.lat ??
          x?.latitude ??
          x?.location?.lat ??
          x?.location?.latitude ??
          x?.coords?.lat ??
          x?.locationCoordinates?.[1] ??
          x?.location?.coordinates?.[1]; // GeoJSON [lng, lat]

        const lng =
          x?.lng ??
          x?.longitude ??
          x?.location?.lng ??
          x?.location?.longitude ??
          x?.coords?.lng ??
          x?.locationCoordinates?.[0] ??
          x?.location?.coordinates?.[0]; // GeoJSON [lng, lat]

        return {
          id,
          name,
          lat: toNum(lat),
          lng: toNum(lng),
        } as Place;
      })
      .filter((p: Place) => p.name.length > 0);
  };

  const loadPlaces = async () => {
    try {
      setMsg("");
      console.log("📡 Fetching places from backend...");
      const json = await apiFetch<any>(ENDPOINTS.MARKET.LOCATIONS);

      console.log("📦 location response:", json);
      const mapped = normalizePlaces(json);

      if (mapped.length === 0) {
        setMsg("No places found from backend.");
      }
      setPlaces(mapped);
    } catch (e: any) {
      console.log("Failed to load places", e);
      setMsg(e.message || "Network error while loading places.");
    }
  };

  useEffect(() => {
    loadPlaces();
  }, []);

  const filteredPlaces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return places;
    return places.filter((p) => p.name.toLowerCase().includes(q));
  }, [searchQuery, places]);

  // ---- Save location to backend -------------------------------------------
  const saveLatLng = async (lat: number, lng: number, address: string) => {
    setLoading(true);
    setMsg("");

    try {
      console.log("📤 Registering user with all data...");

      const res = await registerUser({
        phone,
        pin,
        name,
        role,
        language: lang,
        location: { lat, lng, address },
      });

      console.log("✅ Registration successful", res);

      // ✅ Save session + role + cached profile
      if (res?.token) {
        await AsyncStorage.setItem("token", res.token);
      }
      if (res?.user) {
        await AsyncStorage.setItem(
          "role",
          String(res.user.role || "")
            .trim()
            .toLowerCase(),
        );
        await AsyncStorage.setItem("profile", JSON.stringify(res.user));
        if (res.user._id || res.user.id) {
          await AsyncStorage.setItem("userId", res.user._id || res.user.id);
        }
      }

      // Next step
      if (role.toLowerCase() === "admin") {
        router.replace("/admin");
      } else {
        router.replace(
          role.toLowerCase() === "farmer"
            ? "/farmer-dashboard"
            : "/buyer-dashboard",
        );
      }
    } catch (e: any) {
      console.log("Registration error:", e?.message || e);
      setMsg(e?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // GPS flow: get lat/lng + reverse geocode to address, then save
  const useGps = async () => {
    setMsg("");
    setLoading(true);

    try {
      console.log("📍 Requesting GPS permissions...");
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setMsg("Location permission denied. Choose from list instead.");
        return;
      }

      console.log("📍 Fetching current position (accuracy: balanced)...");
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      console.log(`📍 Position acquired: ${lat}, ${lng}`);

      console.log("📍 Reverse geocoding...");
      const geo = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      console.log("📍 Geocoding result:", geo?.[0]);

      const address = geo?.[0]
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

      await saveLatLng(lat, lng, address);
    } catch (e: any) {
      console.log("GPS error:", e?.message || e);
      setMsg("Could not get location. Choose from list instead.");
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => setEditing((v) => !v);

  const onPickPlace = async (p: Place) => {
    setSelectedPlace(p);
    setEditing(false);
    setSearchQuery("");
    await saveLatLng(p.lat, p.lng, p.name);
  };

  // -------------------------------------------------------------------------
  // NOTE: We removed FlatList to fix:
  // "VirtualizedLists should never be nested inside plain ScrollViews..."
  // We render the list manually since dropdown lists are typically small.
  // -------------------------------------------------------------------------

  return (
    <View style={s.root}>
      <ImageBackground
        source={require("../assets/images/f.jpg")}
        style={s.bg}
        resizeMode="cover"
      >
        <View style={s.overlay} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ScrollView
            contentContainerStyle={s.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.brandHeader}>
              <Text style={s.brandTitle}>
                <Text style={s.brandGreen}>KISSAAN</Text>{" "}
                <Text style={s.brandBlue}>SAATHI</Text>
              </Text>
              <Text style={s.brandTagline}>STEP 2 OF 2</Text>
            </View>

            <View style={s.formWrapper}>
              <Text style={s.title}>Set Location</Text>
              <Text style={s.subtitle}>This helps us show nearby mandis</Text>

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
                    <Text style={s.primaryActionText}>Use Current GPS</Text>
                  )}
                </Pressable>

                <View style={s.divider}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerText}>or</Text>
                  <View style={s.dividerLine} />
                </View>

                <View>
                  <Pressable
                    onPress={toggleDropdown}
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
                      Choose manually
                    </Text>
                    <Text
                      style={[s.dropdownChevron, editing && s.dropdownChevronActive]}
                    >
                      {editing ? "▲" : "▼"}
                    </Text>
                  </Pressable>

                  {editing && (
                    <View style={s.dropdownContent}>
                      <Text style={s.label}>Search mandis/places</Text>
                      <View style={s.pillInput}>
                        <TextInput
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          placeholder="Type city or market"
                          placeholderTextColor="#9CA3AF"
                          style={s.inputStyle}
                          editable={!loading}
                          autoFocus
                        />
                      </View>

                      <View style={{ maxHeight: 220 }}>
                        {filteredPlaces.length === 0 ? (
                          <Text style={s.emptyText}>
                            {places.length === 0 ? "Loading places..." : "No matches"}
                          </Text>
                        ) : (
                          <ScrollView
                            style={{ maxHeight: 220 }}
                            nestedScrollEnabled
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator
                          >
                            {filteredPlaces.map((item) => (
                              <Pressable
                                key={item.id}
                                onPress={() => onPickPlace(item)}
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

                  {selectedPlace ? (
                    <View style={s.selectedBox}>
                      <Text style={s.selectedText}>
                        Selected: {selectedPlace.name}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {msg ? (
                <View style={s.errorBox}>
                  <Text style={s.errorText}>{msg}</Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  actions: { gap: 16 },
  primaryAction: {
    backgroundColor: "rgb(37,95,153)",
    height: 52,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  primaryActionText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#ccc" },
  dividerText: { fontSize: 13, color: "#666", fontWeight: "600" },
  dropdownHeader: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  dropdownHeaderActive: {
    borderColor: "rgb(37,95,153)",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownHeaderText: { color: "#333", fontSize: 16, fontWeight: "600" },
  dropdownHeaderTextActive: { color: "rgb(37,95,153)" },
  dropdownChevron: { fontSize: 12, color: "#9CA3AF", fontWeight: "700" },
  dropdownChevronActive: { color: "rgb(37,95,153)" },
  dropdownContent: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#ccc",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    padding: 16,
    gap: 12,
  },
  label: { fontSize: 14, color: "#333", marginBottom: 2 },
  pillInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 30,
    paddingHorizontal: 16,
    height: 44,
    justifyContent: "center",
  },
  inputStyle: {
    fontSize: 15,
    color: "#000",
  },
  placeRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  placeName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  placeMeta: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748B",
  },
  emptyText: { paddingVertical: 12, color: "#6B7280", textAlign: "center" },
  selectedBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(37,95,153,0.1)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(37,95,153,0.3)",
    alignItems: "center",
  },
  selectedText: { color: "rgb(37,95,153)", fontWeight: "700", fontSize: 14 },
  actionDisabled: { opacity: 0.6 },
  actionPressed: { opacity: 0.7 },
  errorBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#DC2626",
  },
  errorText: { color: "#991B1B", fontSize: 13, fontWeight: "500", textAlign: "center" },
});
