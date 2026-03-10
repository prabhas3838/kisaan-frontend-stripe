import NavFarmer from "../components/navigation/NavFarmer";
import { useTheme } from '../hooks/ThemeContext';

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BarChart2,
  IndianRupee,
  MapPin,
  RefreshCw,
  Star as StarIcon,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wheat,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { useLocation } from "../hooks/useLocation";
import {
  Crop,
  fetchMandiPrices,
  fetchNearbyMandis,
  MandiPriceDoc,
  NearbyMandi,
} from "../services/mandiService";
import { getToken } from "../services/token";
import { getMyLocation, updateLocation } from "../services/userServices";
import { getWatchlist, addToWatchlist, removeFromWatchlist, WatchlistItem } from "../services/watchlistService";

// Map (optional dependency)
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

try {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (e) {
  // react-native-maps not installed (optional)
}

type TabKey = "Live" | "Nearby" | "Compare" | "Watchlist";
type CoordsSource = "backend" | "gps" | "none";

type WatchItem = { crop: Crop; mandi?: string; _id?: string; lastAvgPricePerQuintal?: number };

type LiveFeedItem = {
  key: string;
  crop: Crop;
  mandiName: string;
  pricePerQuintal: number;
  displayPrice: string;
  updatedAt: string;
  quality?: string;
};

type CompareRow = MandiPriceDoc & { isBestPrice?: boolean };

function formatTime(isoLike: string) {
  const d = new Date(isoLike);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const ALL_CROPS: Crop[] = [
  "Tomato",
  "Onion",
  "Potato",
  "Wheat",
  "Rice",
  "Maize",
];

// Robust backend location parser (handles different backend shapes)
function normalizeCoords(loc: any): { lat: number; lng: number } | null {
  if (!loc) return null;

  // common: {lat, lng}
  const lat1 = loc.lat ?? loc.latitude;
  const lng1 = loc.lng ?? loc.longitude;
  if (lat1 != null && lng1 != null)
    return { lat: Number(lat1), lng: Number(lng1) };

  // common: {locationCoordinates: {lat,lng}} or {locationCoordinates: {latitude,longitude}}
  const lc = loc.locationCoordinates;
  // plain array: { locationCoordinates: [lng, lat] }
  if (Array.isArray(lc) && lc.length >= 2) {
    const [lng, lat] = lc;
    if (lat != null && lng != null)
      return { lat: Number(lat), lng: Number(lng) };
  }

  const lat2 = lc?.lat ?? lc?.latitude;
  const lng2 = lc?.lng ?? lc?.longitude;
  if (lat2 != null && lng2 != null)
    return { lat: Number(lat2), lng: Number(lng2) };

  // geojson: {locationCoordinates: {coordinates: [lng, lat]}} OR {coordinates:[lng,lat]}
  const coordsA = lc?.coordinates ?? loc.coordinates;
  if (Array.isArray(coordsA) && coordsA.length >= 2) {
    const [lng, lat] = coordsA;
    if (lat != null && lng != null)
      return { lat: Number(lat), lng: Number(lng) };
  }

  return null;
}

function titleCase(s: string) {
  if (!s) return s;
  const t = s.toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function MarketplaceScreen() {
  const { highContrast } = useTheme();
  const {
    coords: gpsCoords,
    permission,
    requestAndGetLocation,
  } = useLocation();

  const [backendCoords, setBackendCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [coordsSource, setCoordsSource] = useState<CoordsSource>("none");
  const [role, setRole] = useState<string>("farmer");

  useEffect(() => {
    AsyncStorage.getItem("role").then(r => r && setRole(r));
  }, []);

  // ✅ Always keep the latest gps coords in a ref (no “stale state” problem)
  const gpsRef = useRef<{ lat: number; lng: number } | null>(null);
  useEffect(() => {
    if (gpsCoords) gpsRef.current = gpsCoords;
  }, [gpsCoords?.lat, gpsCoords?.lng]);

  // ✅ activeCoords uses backend first, then gps
  const activeCoords = backendCoords ?? gpsCoords ?? null;

  const [tab, setTab] = useState<TabKey>("Live");
  const [searchCrop, setSearchCrop] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [nearbyMandis, setNearbyMandis] = useState<NearbyMandi[]>([]);
  const [feed, setFeed] = useState<LiveFeedItem[]>([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const [watch, setWatch] = useState<WatchItem[]>([]);
  const [watchLoading, setWatchLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedCrop: Crop | null = useMemo(() => {
    const c = titleCase(searchCrop.trim());
    return ALL_CROPS.includes(c as Crop) ? (c as Crop) : null;
  }, [searchCrop]);

  // ----------------------- Loaders -----------------------
  const loadNearby = async () => {
    if (!activeCoords) {
      console.log("❌ loadNearby: activeCoords is null");
      return;
    }

    console.log("📡 loadNearby -> calling nearby with:", {
      lat: activeCoords.lat,
      lng: activeCoords.lng,
      distKm: 50,
      limit: 5,
    });

    try {
      const rows = await fetchNearbyMandis({
        lat: activeCoords.lat,
        lng: activeCoords.lng,
        distKm: 50,
        limit: 5,
      });

      console.log("✅ nearby rows count:", rows.length);
      console.log("✅ nearby rows sample:", rows[0]);

      setNearbyMandis(rows);
    } catch (e: any) {
      console.log("❌ loadNearby error:", e?.message, e);
      Alert.alert("Error", e?.message || "Failed to load nearby mandis.");
      setNearbyMandis([]);
    }
  };

  const loadPrices = async (reason: "auto" | "manual") => {
    try {
      const res = await fetchMandiPrices({
        crop: selectedCrop ?? undefined,
        sort: "latest",
      });

      const items: LiveFeedItem[] = (res.data || []).map((p: any, idx: number) => {
        const price = Number(p.pricePerQuintal || 0);
        const updatedAt = p.updatedAt || p.date || new Date().toISOString();
        return {
          key: `${p._id ?? p.id ?? "row"}-${idx}`,
          crop: p.crop,
          mandiName: p.locationName || p.mandi || "Unknown mandi",
          pricePerQuintal: price,
          displayPrice: `₹${price.toFixed(0)}`,
          updatedAt,
          quality: p.quality,
        };
      });

      items.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      setFeed(items);
      setLastUpdatedAt(new Date().toISOString());
      maybeTriggerWatchAlertsQuintal(items, watch, setWatch, reason);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load mandi prices.");
      setFeed([]);
    }
  };

  // ----------------------- Compare -----------------------
  const compareCrop: Crop = useMemo(
    () => selectedCrop ?? "Tomato",
    [selectedCrop],
  );
  const [compareRows, setCompareRows] = useState<CompareRow[]>([]);

  const loadCompare = async () => {
    try {
      const res = await fetchMandiPrices({
        crop: compareCrop,
        sort: "price_desc",
      });

      const sorted = [...res.data].sort(
        (a: any, b: any) =>
          Number(b.pricePerQuintal || 0) - Number(a.pricePerQuintal || 0),
      );

      const withBest: CompareRow[] = sorted.map((r, idx) => ({
        ...(r as MandiPriceDoc),
        isBestPrice: idx === 0,
      }));

      setCompareRows(withBest);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load compare data.");
      setCompareRows([]);
    }
  };

  // ----------------------- Backend fetch helpers -----------------------
  const refreshBackendLocation = async () => {
    const token = await getToken();
    if (!token) return null;

    const loc = await getMyLocation();
    const parsed = normalizeCoords(loc);

    if (parsed) {
      setBackendCoords(parsed);
      setCoordsSource("backend");
      return parsed;
    }
    return null;
  };

  // ✅ wait for gps coords reliably (fixes the “gpsCoords still null after await” issue)
  const waitForGps = async (timeoutMs = 6000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const c = gpsRef.current;
      if (c?.lat != null && c?.lng != null) return c;
      await new Promise((r) => setTimeout(r, 150));
    }
    return null;
  };

  // ----------------------- Watchlist Backend Sync -----------------------
  const loadWatchlistFromBackend = useCallback(async () => {
    try {
      const items = await getWatchlist();
      const mapped: WatchItem[] = (items || []).map((w: WatchlistItem) => ({
        _id: w._id,
        crop: w.crop as Crop,
        mandi: w.mandi,
      }));
      setWatch(mapped);
    } catch (e: any) {
      console.log("⚠️ Failed to load watchlist from backend:", e?.message);
    }
  }, []);

  const handleToggleWatch = useCallback(async (crop: Crop, mandiHint?: string) => {
    const existing = watch.find((w) => w.crop === crop);
    if (existing) {
      // Remove from backend
      if (existing._id) {
        try {
          setWatchLoading(true);
          await removeFromWatchlist(existing._id);
        } catch (e: any) {
          console.log("⚠️ Failed to remove from watchlist:", e?.message);
        } finally {
          setWatchLoading(false);
        }
      }
      setWatch((prev) => prev.filter((w) => w.crop !== crop));
    } else {
      // Add to backend
      const mandi = mandiHint || feed.find((f) => f.crop === crop)?.mandiName || "All Mandis";
      try {
        setWatchLoading(true);
        const res = await addToWatchlist(crop, mandi);
        const newItem: WatchItem = {
          _id: res?.data?._id || res?._id,
          crop,
          mandi,
        };
        setWatch((prev) => [...prev, newItem]);
      } catch (e: any) {
        if (e?.message?.includes("already watching")) {
          // Already exists on backend, refresh list
          await loadWatchlistFromBackend();
        } else {
          console.log("⚠️ Failed to add to watchlist:", e?.message);
          Alert.alert("Error", e?.message || "Failed to add to watchlist.");
        }
      } finally {
        setWatchLoading(false);
      }
    }
  }, [watch, feed, loadWatchlistFromBackend]);

  // ----------------------- Init -----------------------
  useEffect(() => {
    (async () => {
      try {
        // 1) try backend first
        const b = await refreshBackendLocation();

        // 2) if backend not available, get gps
        if (!b) {
          if (permission !== "granted") {
            await requestAndGetLocation();
          }
          const g = gpsCoords ?? (await waitForGps());
          if (g) setCoordsSource("gps");
        }
      } catch {
        // ignore
      }

      // Load prices on init (watchlist only populates when user explicitly stars a crop)
      await loadPrices("manual");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeCoords) loadNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCoords?.lat, activeCoords?.lng]);

  // Auto refresh live feed every 12s when on Live tab
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (tab === "Live") loadPrices("auto");
    }, 12000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, selectedCrop, watch]);

  useEffect(() => {
    if (tab === "Compare") loadCompare();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, compareCrop]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadNearby(), loadPrices("manual")]);
    setRefreshing(false);
  };

  // ✅ FIXED: Update location reliably + save to backend + re-fetch backend to confirm
  const onUpdateLocation = async () => {
    try {
      await requestAndGetLocation();

      const g = gpsCoords ?? (await waitForGps());
      if (!g) {
        Alert.alert("Location", "Could not fetch GPS location. Try again.");
        return;
      }

      // Immediate UI update (works even if backend save fails)
      setBackendCoords({ lat: g.lat, lng: g.lng });
      setCoordsSource("gps");

      // Save to backend if possible
      try {
        const token = await getToken();
        if (token) {
          await updateLocation({ lat: g.lat, lng: g.lng });
          // ✅ re-fetch to ensure backend is actually returning what you saved
          const confirmed = await refreshBackendLocation();
          if (!confirmed) {
            // backend didn't return coords in expected shape
            // still fine, GPS is shown
            setCoordsSource("gps");
          }
        }
      } catch {
        // ignore; GPS still works
      }

      await loadNearby();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update location.");
    }
  };

  return (
    <SafeAreaView style={[styles.safe, highContrast && { backgroundColor: "#000" }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavFarmer />

      <View style={[styles.root, highContrast && { backgroundColor: "#000" }]}>
        <Header
          coordsSource={coordsSource}
          onUpdateLocation={onUpdateLocation}
        />

        {/* Tabs */}
        <View style={styles.tabs}>
          <TabButton
            icon={<IndianRupee size={24} color="#1f8f4a" strokeWidth={2} />}
            label="Today"
            active={tab === "Live"}
            onPress={() => setTab("Live")}
          />
          <TabButton
            icon={<MapPin size={24} color="#2563eb" />}
            label="Mandis near me"
            active={tab === "Nearby"}
            onPress={() => setTab("Nearby")}
          />
          <TabButton
            icon={<BarChart2 size={24} color="#7c3aed" />}
            label="Compare prices"
            active={tab === "Compare"}
            onPress={() => setTab("Compare")}
          />
          <TabButton
            icon={<Wheat size={24} color="#b7791f" />}
            label="My crops"
            active={tab === "Watchlist"}
            onPress={() => setTab("Watchlist")}
          />
        </View>

        {/* Search + Refresh */}
        {(tab === "Live" || tab === "Compare") && (
          <View style={styles.controls}>
            <View style={styles.searchBox}>
              <Text style={styles.searchLabel}>Crop name</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Type crop name (e.g., Wheat)"
                placeholderTextColor="#7a8a99"
                value={searchCrop}
                onChangeText={setSearchCrop}
              />
              {!!lastUpdatedAt && (
                <Text style={styles.lastRefreshed}>
                  Last refreshed: {formatTime(lastUpdatedAt)}
                </Text>
              )}
            </View>

            <Pressable
              style={[styles.refreshBtn, refreshing && { opacity: 0.7 }]}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={20} color="#ffffff" />
              <Text style={styles.refreshText}>Refresh</Text>
            </Pressable>
          </View>
        )}

        {/* Content */}
        {tab === "Live" && (
          <LiveFeed
            feed={feed}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onStarCrop={(crop) => handleToggleWatch(crop)}
            isCropStarred={(crop) => watch.some((w) => w.crop === crop)}
          />
        )}

        {tab === "Nearby" && (
          <NearbyMandis
            coords={activeCoords}
            permission={permission}
            nearestMandis={nearbyMandis}
          />
        )}

        {tab === "Compare" && (
          <CompareTable
            crop={compareCrop}
            rows={compareRows}
            onStarCrop={(c) => handleToggleWatch(c)}
            isCropStarred={(c) => watch.some((w) => w.crop === c)}
          />
        )}

        {tab === "Watchlist" && (
          <Watchlist
            watch={watch}
            onRemove={(crop) => handleToggleWatch(crop)}
            latestFeed={feed}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/** UI Components */
function Header({
  coordsSource,
  onUpdateLocation,
}: {
  coordsSource: CoordsSource;
  onUpdateLocation: () => void;
}) {
  const { highContrast } = useTheme();
  return (
    <View style={[styles.header, highContrast && { backgroundColor: "#000", borderBottomColor: "#333" }]}>
      <Text style={styles.headerTitle}>Marketplace</Text>

      <Text style={styles.headerSub}>
        Today’s mandi prices, nearby markets & comparisons
      </Text>
      <Text style={styles.headerHint}>
        Location source: {coordsSource.toUpperCase()}
      </Text>
    </View>
  );
}

function TabButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tabBtn, active && styles.tabBtnActive]}
      onPress={onPress}
    >
      <View style={styles.tabIcon}>{icon}</View>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function LiveFeed({
  feed,
  refreshing,
  onRefresh,
  onStarCrop,
  isCropStarred,
}: {
  feed: LiveFeedItem[];
  refreshing: boolean;
  onRefresh: () => void;
  onStarCrop: (crop: Crop) => void;
  isCropStarred: (crop: Crop) => boolean;
}) {
  const { highContrast } = useTheme();
  // Trend per crop+mandi (uses 2 most recent in current list)
  const trendMap = useMemo(() => {
    const map = new Map<string, { latest: number; prev?: number }>();
    const seen = new Map<string, number>();
    for (const it of feed) {
      const k = `${it.crop}__${it.mandiName}`;
      const c = seen.get(k) ?? 0;
      if (c === 0) map.set(k, { latest: it.pricePerQuintal });
      else if (c === 1) {
        const cur = map.get(k);
        if (cur && cur.prev == null) cur.prev = it.pricePerQuintal;
      }
      seen.set(k, c + 1);
    }
    return map;
  }, [feed]);

  return (
    <FlatList
      data={feed}
      keyExtractor={(it) => it.key}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#2d6a4f"
        />
      }
      contentContainerStyle={{ paddingBottom: 28, paddingTop: 8 }}
      ListEmptyComponent={
        <View style={[styles.empty, highContrast && { backgroundColor: "#000" }]}>
          <Text style={styles.emptyTitle}>📭 No prices available</Text>
          <Text style={styles.emptySub}>
            Pull down to refresh or check again later
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const k = `${item.crop}__${item.mandiName}`;
        const t = trendMap.get(k);
        const prev = t?.prev;
        const diff = prev != null ? item.pricePerQuintal - prev : null;

        const rising = diff != null && diff > 0;
        const falling = diff != null && diff < 0;

        return (
          <View style={styles.priceCard}>
            <View style={styles.priceCardHeader}>
              <View style={styles.cropInfo}>
                <View>
                  <Text style={[styles.cropName, highContrast && { color: "#FFF" }]}>{item.crop}</Text>
                  <Text style={[styles.mandiName, highContrast && { color: "#CCC" }]}>{item.mandiName}</Text>

                  {diff != null && diff !== 0 && (
                    <View style={styles.trendRow}>
                      {rising ? <TrendingUp size={16} color="#1f8f4a" /> : null}
                      {falling ? (
                        <TrendingDown size={16} color="#c2410c" />
                      ) : null}
                      <Text
                        style={[
                          styles.trendText,
                          rising && { color: "#1f8f4a" },
                          falling && { color: "#c2410c" },
                        ]}
                      >
                        {rising
                          ? `₹${Math.abs(diff).toFixed(0)} higher than last update`
                          : `₹${Math.abs(diff).toFixed(0)} lower than last update`}
                      </Text>
                    </View>
                  )}

                  {diff === 0 && prev != null && (
                    <Text style={styles.trendText}>
                      No change since last update
                    </Text>
                  )}
                </View>
              </View>

              <Pressable onPress={() => onStarCrop(item.crop)} hitSlop={10}>
                <StarIcon
                  size={22}
                  color={isCropStarred(item.crop) ? "#FFC107" : "#cbd5e1"}
                  fill={isCropStarred(item.crop) ? "#FFC107" : "none"}
                />
              </Pressable>
            </View>

            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Price (per quintal)</Text>
                <Text style={styles.priceAmount}>{item.displayPrice}</Text>
              </View>

              <View style={styles.timeBox}>
                <Text style={styles.timeLabel}>Updated</Text>
                <Text style={styles.timeText}>
                  {formatTime(item.updatedAt)}
                </Text>
              </View>
            </View>
          </View>
        );
      }}
    />
  );
}

function NearbyMandis({
  coords,
  permission,
  nearestMandis,
}: {
  coords: { lat: number; lng: number } | null;
  permission: "granted" | "denied" | "unknown";
  nearestMandis: NearbyMandi[];
}) {
  const hasCoords = !!coords;

  const region = useMemo(() => {
    if (!coords) return null;
    return {
      latitude: Number(coords.lat),
      longitude: Number(coords.lng),
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };
  }, [coords?.lat, coords?.lng]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Nearest Mandis (within 50 km)</Text>

        {!hasCoords && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyBoxText}>
              {permission === "denied"
                ? "Location permission denied. Enable it to see nearby mandis."
                : "Location not available yet. Try updating location."}
            </Text>
          </View>
        )}

        {hasCoords && nearestMandis.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyBoxText}>No mandis found nearby</Text>
            <Text style={styles.smallTip}>
              Tip: try refreshing or updating location
            </Text>
          </View>
        ) : (
          hasCoords &&
          nearestMandis.map((m, idx) => (
            <View key={idx} style={styles.mandiCard}>
              <View style={styles.mandiInfo}>
                <View style={{ flex: 1 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MapPin size={18} color="#2d6a4f" />
                    <Text style={styles.mandiCardTitle}>{m.name}</Text>
                  </View>
                  <Text style={styles.mandiDistance}>
                    {m.distKm.toFixed(1)} km away
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {MapView && hasCoords && region && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Map View</Text>
          <View style={styles.mapWrap}>
            <MapView
              style={{ flex: 1 }}
              provider={PROVIDER_GOOGLE}
              region={region}
            >
              {Marker && (
                <Marker
                  coordinate={{
                    latitude: Number(coords!.lat),
                    longitude: Number(coords!.lng),
                  }}
                  title="You"
                  pinColor="#2d6a4f"
                />
              )}

              {Marker &&
                nearestMandis
                  .filter(
                    (m) =>
                      Number.isFinite((m as any).lat) &&
                      Number.isFinite((m as any).lng),
                  )
                  .map((m, idx) => (
                    <Marker
                      key={idx}
                      coordinate={{
                        latitude: Number((m as any).lat),
                        longitude: Number((m as any).lng),
                      }}
                      title={m.name}
                      pinColor="#d62828"
                    />
                  ))}
            </MapView>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function CompareTable({
  crop,
  rows,
  onStarCrop,
  isCropStarred,
}: {
  crop: Crop;
  rows: CompareRow[];
  onStarCrop: (crop: Crop) => void;
  isCropStarred: (crop: Crop) => boolean;
}) {
  const { highContrast } = useTheme();
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 28, paddingTop: 8 }}>
      <View style={styles.section}>
        <View style={styles.compareHeader}>
          <View style={styles.compareHeaderLeft}>
            <View>
              <Text style={styles.sectionTitle}>{crop} Prices</Text>
              <Text style={styles.compareSub}>Highest to Lowest</Text>
            </View>
          </View>

          <Pressable onPress={() => onStarCrop(crop)} hitSlop={10}>
            <StarIcon
              size={24}
              color={isCropStarred(crop) ? "#FFC107" : "#cbd5e1"}
              fill={isCropStarred(crop) ? "#FFC107" : "none"}
            />
          </Pressable>
        </View>
      </View>

      {rows.length === 0 ? (
        <View style={[styles.empty, highContrast && { backgroundColor: "#000" }]}>
          <Text style={styles.emptyTitle}>No data for {crop}</Text>
          <Text style={styles.emptySub}>Try a different crop or refresh</Text>
        </View>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, { flex: 2 }]}>Mandi</Text>
            <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
              Price
            </Text>
            <Text style={[styles.th, { flex: 1, textAlign: "right" }]}>
              Updated
            </Text>
            <Text style={[styles.th, { width: 44, textAlign: "center" }]}>
              Best
            </Text>
          </View>

          {rows.map((r, idx) => {
            const isBest = !!r.isBestPrice;
            const updated =
              (r as any).updatedAt ||
              (r as any).date ||
              new Date().toISOString();

            return (
              <View key={idx} style={[styles.tr, isBest && styles.trBest]}>
                <Text style={[styles.td, { flex: 2 }]} numberOfLines={1}>
                  {(r as any).locationName || (r as any).mandi || "Unknown"}
                </Text>

                <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                  ₹{Number((r as any).pricePerQuintal || 0).toFixed(0)}
                </Text>

                <Text style={[styles.td, { flex: 1, textAlign: "right" }]}>
                  {formatTime(updated)}
                </Text>

                <View style={{ width: 44, alignItems: "center" }}>
                  {isBest ? (
                    <Text style={{ fontSize: 16 }}>🏆</Text>
                  ) : (
                    <Text style={{ color: "#cbd5e1" }}>—</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function Watchlist({
  watch,
  onRemove,
  latestFeed,
}: {
  watch: WatchItem[];
  onRemove: (crop: Crop) => void;
  latestFeed: LiveFeedItem[];
}) {
  const { highContrast } = useTheme();
  const latestAvg = useMemo(() => {
    const map = new Map<Crop, { sum: number; count: number }>();
    for (const it of latestFeed) {
      const v = map.get(it.crop) ?? { sum: 0, count: 0 };
      v.sum += it.pricePerQuintal;
      v.count += 1;
      map.set(it.crop, v);
    }
    const out = new Map<Crop, number>();
    map.forEach((v, k) => out.set(k, v.sum / Math.max(1, v.count)));
    return out;
  }, [latestFeed]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 28, paddingTop: 8 }}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Watched Crops</Text>
        <Text style={styles.watchSubtitle}>
          Track your favorite crops for price updates
        </Text>
      </View>

      {watch.length === 0 ? (
        <View style={[styles.empty, highContrast && { backgroundColor: "#000" }]}>
          <Text style={styles.emptyTitle}>No crops in watchlist</Text>
          <Text style={styles.emptySub}>
            Star a crop from "Today" or "Compare prices"
          </Text>
        </View>
      ) : (
        watch.map((w, idx) => {
          const avg = latestAvg.get(w.crop);
          return (
            <View key={idx} style={styles.watchCard}>
              <View style={styles.watchCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.watchCropName}>{w.crop}</Text>
                  <Text style={styles.watchAvgPrice}>
                    Average: {avg ? `₹${avg.toFixed(0)} / quintal` : "—"}
                  </Text>
                </View>
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => onRemove(w.crop)}
                >
                  <Trash2 size={22} color="#ff3b30" />
                </Pressable>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

/** Watchlist helpers (toggleWatchCrop removed — now handled by handleToggleWatch with backend sync) */

function maybeTriggerWatchAlertsQuintal(
  feed: LiveFeedItem[],
  watch: WatchItem[],
  setWatch: React.Dispatch<React.SetStateAction<WatchItem[]>>,
  reason: "auto" | "manual",
) {
  const watched = new Set(watch.map((w) => w.crop));
  const agg = new Map<Crop, { sum: number; count: number }>();

  for (const r of feed) {
    if (!watched.has(r.crop)) continue;
    const v = agg.get(r.crop) ?? { sum: 0, count: 0 };
    v.sum += r.pricePerQuintal;
    v.count += 1;
    agg.set(r.crop, v);
  }

  const updates = watch.map((w) => {
    const v = agg.get(w.crop);
    if (!v) return w;

    const avg = v.sum / Math.max(1, v.count);
    const prev = w.lastAvgPricePerQuintal;
    const updated = { ...w, lastAvgPricePerQuintal: avg };

    if (prev && prev > 0 && reason === "manual") {
      const pct = Math.abs(avg - prev) / prev;
      if (pct >= 0.1) {
        Alert.alert(
          "Price Alert",
          `${w.crop} price changed ${(pct * 100).toFixed(0)}% (avg ₹${avg.toFixed(
            0,
          )} / quintal)`,
        );
      }
    }
    return updated;
  });

  setWatch(updates);
}

/** Styles */
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight ?? 10) : 0,
  },
  root: { flex: 1, backgroundColor: "#f8f9fa" },

  header: {
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: { color: "#2d6a4f", fontSize: 28, fontWeight: "900" },
  headerSub: { color: "#6c757d", marginTop: 6, fontSize: 14 },
  headerHint: {
    color: "#94a3b8",
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
  },

  locationPill: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  locationPillText: { color: "#475569", fontSize: 12, fontWeight: "700" },

  tabIcon: { marginBottom: 6 },
  tabs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  tabBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  tabBtnActive: { backgroundColor: "#d8f3dc", borderColor: "#2d6a4f" },
  tabText: {
    color: "#6c757d",
    fontWeight: "800",
    fontSize: 12,
    textAlign: "center",
  },
  tabTextActive: { color: "#2d6a4f" },

  controls: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  searchBox: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchLabel: {
    color: "#6c757d",
    fontSize: 11,
    marginBottom: 4,
    fontWeight: "800",
  },
  searchInput: {
    color: "#212529",
    fontSize: 16,
    paddingVertical: Platform.OS === "android" ? 0 : 4,
  },
  lastRefreshed: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },

  refreshBtn: {
    backgroundColor: "#2d6a4f",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  refreshText: { color: "#ffffff", fontWeight: "800", fontSize: 12 },

  // Live Feed
  priceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#eef2f7",
    padding: 16,
    marginHorizontal: 14,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  priceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cropInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  cropName: { color: "#212529", fontSize: 20, fontWeight: "900" },
  mandiName: { color: "#6c757d", marginTop: 2, fontSize: 14 },

  trendRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trendText: { color: "#64748b", fontSize: 12, fontWeight: "700" },

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
  },
  priceLabel: { color: "#6c757d", fontSize: 12, marginBottom: 4 },
  priceAmount: { color: "#2d6a4f", fontSize: 28, fontWeight: "900" },
  timeBox: { alignItems: "flex-end" },
  timeLabel: { color: "#6c757d", fontSize: 11, marginBottom: 2 },
  timeText: { color: "#495057", fontSize: 14, fontWeight: "600" },

  // Empty
  empty: { padding: 32, alignItems: "center" },
  emptyTitle: { color: "#495057", fontWeight: "900", fontSize: 18 },
  emptySub: {
    color: "#6c757d",
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
  },

  // Sections
  section: {
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: { color: "#212529", fontSize: 20, fontWeight: "900" },

  emptyBox: {
    marginTop: 12,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    alignItems: "center",
  },
  emptyBoxText: { color: "#6c757d", fontSize: 14, textAlign: "center" },
  smallTip: { marginTop: 8, color: "#2d6a4f", fontWeight: "800", fontSize: 12 },

  // Mandis
  mandiCard: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  mandiInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mandiCardTitle: { color: "#212529", fontWeight: "800", fontSize: 16 },
  mandiDistance: {
    color: "#2d6a4f",
    fontWeight: "900",
    fontSize: 14,
    marginTop: 4,
  },

  // Map
  mapWrap: {
    marginTop: 12,
    height: 240,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },

  // Compare
  compareHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compareHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  compareSub: { color: "#6c757d", fontSize: 12, marginTop: 2 },

  table: {
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  th: { color: "#6c757d", fontWeight: "900", fontSize: 12 },
  tr: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    alignItems: "center",
  },
  trBest: {
    backgroundColor: "#fff3cd",
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  td: { color: "#212529", fontSize: 14, fontWeight: "700" },

  // Watchlist
  watchSubtitle: { color: "#6c757d", marginTop: 6, fontSize: 12 },
  watchCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
    padding: 16,
    marginHorizontal: 14,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  watchCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  watchCropName: { color: "#212529", fontWeight: "900", fontSize: 18 },
  watchAvgPrice: { color: "#6c757d", marginTop: 4, fontSize: 14 },
  removeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
});
