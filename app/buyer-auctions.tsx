import React, { useState, useEffect } from "react";
import NavBuyer from "../components/navigation/NavBuyer";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
    ActivityIndicator,
    TextInput,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../services/api";
import { getProfile } from "../services/userServices";
import { Ionicons, Feather } from "@expo/vector-icons";

const formatCurr = (val: number) => `₹${val.toLocaleString("en-IN")}`;

// Timer Component
const AuctionTimer = ({ createdAt, status }: { createdAt: string, status: string }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isEnded, setIsEnded] = useState(status === "CLOSED");

    useEffect(() => {
        if (status === "CLOSED") {
            setIsEnded(true);
            setTimeLeft("Ended");
            return;
        }

        const endTime = new Date(createdAt).getTime() + (24 * 60 * 60 * 1000);

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = endTime - now;

            if (diff <= 0) {
                setIsEnded(true);
                setTimeLeft("0s");
                return;
            }

            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            let timeStr = "";
            if (h > 0) timeStr += `${h}h `;
            if (m > 0 || h > 0) timeStr += `${m}m `;
            timeStr += `${s}s`;

            setTimeLeft(timeStr);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [createdAt, status]);

    return (
        <Text style={[styles.timerText, isEnded ? { color: '#EF4444' } : null]}>
            {timeLeft}
        </Text>
    );
};

export default function BuyerAuctions() {
    const router = useRouter();
    const [auctions, setAuctions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadAuctions();

        // Auto-refresh every 15 seconds
        const refreshInterval = setInterval(() => {
            loadAuctions();
        }, 15000);

        return () => clearInterval(refreshInterval);
    }, []);

    const loadAuctions = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const profileRes = await getProfile();
            if (profileRes?.user) setUser(profileRes.user);

            const res = await fetch(ENDPOINTS.AUCTIONS.GET_ALL, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch auctions");
            const allAuctions = await res.json();

            const formatted = allAuctions.map((a: any) => {
                let maxBid = 0;
                let totalBids = 0;
                if (a.bids && a.bids.length > 0) {
                    maxBid = Math.max(...a.bids.map((b: any) => b.amount));
                    totalBids = a.bids.length;
                }

                return {
                    id: a._id,
                    crop: a.crop,
                    createdAt: a.createdAt,
                    quantity: `${a.quantityKg} kg`,
                    quantityKg: a.quantityKg,
                    basePrice: a.basePrice,
                    currentHighBid: maxBid,
                    totalBids,
                    status: a.status,
                    farmer: a.farmerId?.name || "Verified Farmer",
                    farmerId: a.farmerId?._id || a.farmerId,
                };
            });

            setAuctions(formatted);
        } catch (e) {
            console.log("Error fetching auctions", e);
        } finally {
            setLoading(false);
        }
    };

    const filteredAuctions = auctions.filter(a => {
        if (!searchQuery.trim()) return true;
        return a.crop.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <NavBuyer />

            {/* Header */}
            <View style={styles.topHeader}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity style={{ marginRight: 10 }} onPress={() => router.replace("/buyer-dashboard")}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Live Auctions</Text>
                        <Text style={styles.headerSubtitle}>{auctions.length} auctions available</Text>
                    </View>
                    <TouchableOpacity onPress={loadAuctions}>
                        <Ionicons name="refresh" size={22} color="#FFF" />
                    </TouchableOpacity>
                </View>

                {/* Search */}
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search by crop name..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
                ) : filteredAuctions.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>No auctions found</Text>
                    </View>
                ) : filteredAuctions.map((auction, index) => (
                    <TouchableOpacity
                        key={auction.id}
                        style={styles.auctionCard}
                        activeOpacity={0.7}
                        onPress={() => router.push({ pathname: "/auction-detail" as any, params: { id: auction.id } })}
                    >
                        {/* Card Header */}
                        <View style={styles.cardTopRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cropName}>{auction.crop}</Text>
                                <Text style={styles.farmerName}>
                                    <Ionicons name="person" size={12} color="#64748B" /> {auction.farmer} ✓
                                </Text>
                            </View>
                            <View style={styles.liveBadge}>
                                <Text style={styles.liveBadgeText}>● LIVE</Text>
                            </View>
                        </View>

                        {/* Stats Grid */}
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>QUANTITY</Text>
                                <Text style={styles.statValue}>{auction.quantity}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>HIGHEST BID</Text>
                                <Text style={[styles.statValue, { color: auction.currentHighBid > 0 ? "#2563EB" : "#94A3B8" }]}>
                                    {auction.currentHighBid > 0 ? formatCurr(auction.currentHighBid) : "No Bids"}
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>BIDS</Text>
                                <Text style={styles.statValue}>{auction.totalBids}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>TIME LEFT</Text>
                                <AuctionTimer createdAt={auction.createdAt} status={auction.status} />
                            </View>
                        </View>

                        {/* Base Price + View Button */}
                        <View style={styles.cardFooter}>
                            <Text style={styles.baseText}>Base: {formatCurr(auction.basePrice)}</Text>
                            <View style={styles.viewBtn}>
                                <Text style={styles.viewBtnText}>View Auction</Text>
                                <Ionicons name="arrow-forward" size={14} color="#FFF" />
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F1F5F9" },
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },

    topHeader: {
        backgroundColor: "#3B82F6",
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFF" },
    headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2, fontWeight: "500" },

    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF",
        borderRadius: 8,
        paddingHorizontal: 12,
        marginTop: 12,
        height: 44,
    },
    searchInput: { flex: 1, fontSize: 15, color: "#1E293B" },

    emptyContainer: { alignItems: "center", marginTop: 60, gap: 12 },
    emptyText: { color: "#94A3B8", fontSize: 16, fontWeight: "600" },

    auctionCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        marginBottom: 14,
        padding: 18,
        borderLeftWidth: 4,
        borderLeftColor: "#2563EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 14,
    },
    cropName: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
    farmerName: { fontSize: 13, color: "#64748B", fontWeight: "500", marginTop: 4 },

    liveBadge: {
        backgroundColor: "#10B981",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    liveBadgeText: { color: "#FFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: 14,
        gap: 2,
    },
    statItem: {
        width: "48%",
        marginBottom: 10,
    },
    statLabel: { fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 0.5, marginBottom: 2 },
    statValue: { fontSize: 16, fontWeight: "800", color: "#0F172A" },

    timerText: { fontSize: 16, fontWeight: "800", color: "#2563EB" },

    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        paddingTop: 14,
    },
    baseText: { fontSize: 13, color: "#64748B", fontWeight: "600" },
    viewBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2563EB",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        gap: 6,
    },
    viewBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },
});
