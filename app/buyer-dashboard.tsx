import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SafeAreaView,
  Animated,
  Pressable,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import NavBuyer from "../components/navigation/NavBuyer";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProfile } from "../services/userServices";
import { fetchMandiPrices } from "../services/mandiService";
import { apiFetch } from "../services/http";
import { ENDPOINTS } from "../services/api";

const { width } = Dimensions.get("window");

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topPrice, setTopPrice] = useState<any>(null);
  const [bidStats, setBidStats] = useState({ active: 0, leading: 0, won: 0 });

  const loadData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        router.replace("/login");
        return;
      }
      const res = await getProfile();
      if (res?.success) {
        setUser(res.user);
      }

      // --- DYNAMIC DATA LOGIC ---
      let cropToLoad = "Wheat";
      let mandiToLoad = res?.user?.location || "Azadpur Mandi";

      try {
        const bidRes = await fetch(ENDPOINTS.AUCTIONS.MY_BIDS, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (bidRes.ok) {
          const myAuctionsWithBids = await bidRes.json();
          if (myAuctionsWithBids.length > 0) {
            cropToLoad = myAuctionsWithBids[0].crop;
          }
        }
      } catch (e) {
        console.log("Error determining dynamic crop for buyer:", e);
      }

      // Load latest price and AI prediction for the main card
      try {
        const query = `?crop=${encodeURIComponent(cropToLoad)}&mandi=${encodeURIComponent(mandiToLoad)}&days=7`;
        const aiRes = await apiFetch<any>(ENDPOINTS.ANALYTICS.FORECAST + query);

        if (aiRes.success) {
          const historical = aiRes.data.historical;
          const predicted = aiRes.data.predicted;

          const latest = historical[historical.length - 1];
          const trendDir = predicted[predicted.length - 1].price > latest.price ? "up" : "down";
          const trendPct = ((Math.abs(predicted[predicted.length - 1].price - latest.price) / latest.price) * 100).toFixed(1);

          setTopPrice({
            crop: cropToLoad,
            locationName: mandiToLoad,
            pricePerQuintal: latest.price,
            trend: `${predicted[predicted.length - 1].price > latest.price ? '+' : '-'}${trendPct}% predicted`,
            isUp: trendDir === "up"
          });
        } else {
          const resPrices = await fetchMandiPrices({ crop: cropToLoad, limit: 1 });
          if (resPrices.data && resPrices.data.length > 0) {
            setTopPrice(resPrices.data[0]);
          }
        }
      } catch (err) {
        console.warn("Dashboard Price Load Error:", err);
      }

      // Fetch bid stats
      try {
        const bidRes = await fetch(ENDPOINTS.AUCTIONS.MY_BIDS, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (bidRes.ok) {
          const myAuctions = await bidRes.json();
          const profileData = res?.user || user;
          let active = 0, leading = 0, won = 0;
          myAuctions.forEach((a: any) => {
            if (a.status === "OPEN") {
              active++;
              const highest = a.bids?.length > 0 ? Math.max(...a.bids.map((b: any) => b.amount)) : 0;
              const myBest = a.bids?.filter((b: any) => String(b.buyerId?._id || b.buyerId) === String(profileData?._id))
                .sort((x: any, y: any) => y.amount - x.amount)[0];
              if (myBest && myBest.amount === highest) leading++;
            } else if (a.status === "CLOSED" && a.winningBid && String(a.winningBid.buyerId) === String(profileData?._id)) {
              won++;
            }
          });
          setBidStats({ active, leading, won });
        }
      } catch (e) { console.log("Bid stats error:", e); }
    } catch (e) {
      console.log("Dashboard load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ headerShown: false }} />
      <NavBuyer />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText} numberOfLines={1}>Welcome, {user?.name || "Buyer"} </Text>
          <Text style={styles.subtext}>Find the best deals & place your bids</Text>
        </View>

        {/* BID ACTIVITY */}
        {bidStats.active > 0 && (
          <>
            <SectionHeader title="BID ACTIVITY" />
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderLeftColor: '#2563EB' }]}>
                <Text style={styles.statNum}>{bidStats.active}</Text>
                <Text style={styles.statLab}>Active Bids</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#10B981' }]}>
                <Text style={[styles.statNum, { color: '#10B981' }]}>{bidStats.leading}</Text>
                <Text style={styles.statLab}>Leading</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#D97706' }]}>
                <Text style={[styles.statNum, { color: '#D97706' }]}>{bidStats.won}</Text>
                <Text style={styles.statLab}>Won</Text>
              </View>
            </View>
          </>
        )}

        {/* TODAY'S TOP PRICE */}
        <SectionHeader title="TODAY'S TOP PRICE" />
        <View style={styles.topPriceCard}>
          <View style={styles.priceHeader}>
            <View>
              <Text style={styles.cropName}>{topPrice?.crop || "Wheat"}</Text>
              <View style={styles.mandiRow}>
                <Ionicons name="location-sharp" size={14} color="#94A3B8" />
                <Text style={styles.mandiName} numberOfLines={1}>{topPrice?.locationName || topPrice?.mandi || "Azadpur Mandi"}</Text>
              </View>
              <Text style={styles.unitText}>per quintal</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.priceVal}>₹{topPrice?.pricePerQuintal?.toLocaleString() || "2,340"}</Text>
              <View style={styles.trendRow}>
                <MaterialCommunityIcons
                  name={topPrice?.isUp !== false ? "trending-up" : "trending-down"}
                  size={16}
                  color={topPrice?.isUp !== false ? "#22C55E" : "#EF4444"}
                />
                <Text style={[styles.trendText, topPrice?.isUp === false && { color: '#EF4444' }]}>
                  {topPrice?.trend || "+4.2% this week"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.priceActions}>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => router.push("/mandi-prices")}
            >
              <Ionicons name="bar-chart" size={18} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.seeAllText}>See All Prices</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.buyNowBtn}
              onPress={() => router.push("/buyer-auctions" as any)}
            >
              <Text style={styles.buyNowText}>Browse Auctions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* BUY & BID */}
        <SectionHeader title="BUY & BID" />
        <View style={styles.grid}>
          <View style={styles.row}>
            <BuySellCard
              title="Live Auctions"
              subtitle="Browse & bid on crops"
              icon="flash"
              color="#3B83F6"
              onPress={() => router.push("/buyer-auctions" as any)}
            />
            <BuySellCard
              title="My Bids"
              subtitle="Track your bids"
              icon="list"
              color="#7C3AED"
              onPress={() => router.push("/my-bids" as any)}
            />
          </View>
          <View style={styles.row}>
            <BuySellCard
              title="Sellers"
              subtitle="Verified Directory"
              icon="people"
              color="#F59E0B"
              onPress={() => router.push("/buyer-marketplace")}
            />
            <BuySellCard
              title="Deals"
              subtitle="Your negotiations"
              icon="handshake-outline"
              iconFamily="MaterialCommunityIcons"
              color="#111827"
              onPress={() => router.push("/not-available")}
            />
          </View>
        </View>

        {/* HELP & SUPPORT */}
        <SectionHeader title="HELP & SUPPORT" />
        <View style={styles.supportList}>
          <SupportItem
            title="Messages"
            subtitle="Chat with farmers"
            icon="chatbubble-ellipses"
            color="#3B82F6"
            onPress={() => router.push("/messages")}
          />
          <SupportItem
            title="Call Support"
            subtitle="Talk to an expert"
            icon="call"
            color="#F59E0B"
            onPress={() => router.push("/call-support")}
          />
          <SupportItem
            title="Settings"
            subtitle="Account & preferences"
            icon="settings"
            color="#64748B"
            onPress={() => router.push("/settings")}
          />
          <SupportItem
            title="Help Center"
            subtitle="FAQs & guides"
            icon="help-circle"
            color="#A855F7"
            onPress={() => Alert.alert("Help Center", "Redirecting to help portal...")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function MarketCard({ title, subtitle, icon, color, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.marketCard, { backgroundColor: color }]} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#FFF" />
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardSubtitle} numberOfLines={2}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

function BuySellCard({ title, subtitle, icon, color, onPress, iconFamily }: any) {
  return (
    <TouchableOpacity style={[styles.buySellCard, { backgroundColor: color }]} onPress={onPress}>
      {iconFamily === "MaterialCommunityIcons" ? (
        <MaterialCommunityIcons name={icon} size={24} color="#FFF" />
      ) : (
        <Ionicons name={icon} size={24} color="#FFF" />
      )}
      <View style={{ marginTop: 12 }}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={2}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

function SupportItem({ title, subtitle, icon, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.supportItem} onPress={onPress}>
      <View style={[styles.supportIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 16 }}>
        <Text style={styles.supportTitle}>{title}</Text>
        <Text style={styles.supportSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFF" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingBottom: 100 },

  header: { paddingHorizontal: 20, paddingTop: 10, marginBottom: 20 },
  welcomeText: { fontSize: 26, fontWeight: "900", color: "#1E3A8A" },
  subtext: { fontSize: 16, color: "#64748B", marginTop: 4, fontWeight: "500" },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginLeft: 20,
    marginTop: 10,
    marginBottom: 12
  },

  topPriceCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 4,
    borderTopWidth: 6,
    borderTopColor: "#2563EB",
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4
  },
  priceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cropName: { fontSize: 28, fontWeight: "900", color: "#0F172A" },
  mandiRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  mandiName: { fontSize: 15, color: "#64748B", marginLeft: 4, fontWeight: "600" },
  unitText: { fontSize: 14, color: "#94A3B8", marginTop: 4, fontWeight: "500" },
  priceVal: { fontSize: 32, fontWeight: "900", color: "#0F172A" },
  trendRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  trendText: { fontSize: 14, color: "#22C55E", fontWeight: "700", marginLeft: 4 },

  priceActions: { flexDirection: "row", gap: 12, marginTop: 24 },
  seeAllBtn: {
    flex: 1.5,
    backgroundColor: "#1E3A8A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 4
  },
  seeAllText: { color: "#FFF", fontWeight: "800", fontSize: 15 },
  buyNowBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 4
  },
  buyNowText: { color: "#2563EB", fontWeight: "800", fontSize: 15 },

  grid: { paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  row: { flexDirection: "row", gap: 12 },

  marketCard: { flex: 1, padding: 20, borderRadius: 0, justifyContent: "center", minHeight: 120 },
  cardTitle: { color: "#FFF", fontSize: 18, fontWeight: "900", marginTop: 12 },
  cardSubtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600", marginTop: 2 },

  buySellCard: { flex: 1, padding: 20, borderRadius: 0, minHeight: 120 },

  supportList: { marginHorizontal: 20, backgroundColor: "#FFF", borderRadius: 12, overflow: "hidden", marginBottom: 40, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC"
  },
  supportIcon: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  supportTitle: { fontSize: 16, fontWeight: "800", color: "#1E293B" },
  supportSubtitle: { fontSize: 13, color: "#64748B", marginTop: 2, fontWeight: "500" },

  statsRow: { flexDirection: "row", gap: 10, marginHorizontal: 20, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 8,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statNum: { fontSize: 24, fontWeight: "900", color: "#2563EB" },
  statLab: { fontSize: 11, fontWeight: "600", color: "#64748B", marginTop: 2 },
});
