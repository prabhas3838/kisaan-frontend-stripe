import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../services/api";
import { getProfile } from "../services/userServices";
import { Ionicons, Feather } from "@expo/vector-icons";
import NavBuyer from "../components/navigation/NavBuyer";

const formatCurr = (val: number) => `₹${val.toLocaleString("en-IN")}`;

type BidStatus = "Leading" | "Outbid" | "Won" | "Lost";

const statusColors: Record<BidStatus, { bg: string, text: string }> = {
    Leading: { bg: "#D1FAE5", text: "#059669" },
    Outbid: { bg: "#FEE2E2", text: "#DC2626" },
    Won: { bg: "#FEF3C7", text: "#D97706" },
    Lost: { bg: "#F1F5F9", text: "#64748B" },
};

export default function MyBids() {
    const router = useRouter();
    const [bids, setBids] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        loadMyBids();
    }, []);

    const loadMyBids = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const profileRes = await getProfile();
            const currentUser = profileRes?.user;
            if (currentUser) setUser(currentUser);

            const res = await fetch(ENDPOINTS.AUCTIONS.MY_BIDS, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch my bids");
            const myAuctions = await res.json();

            const formatted = myAuctions.map((a: any) => {
                const allBids = a.bids || [];
                const myBid = allBids
                    .filter((b: any) => {
                        const bid_id = b.buyerId?._id || b.buyerId;
                        return String(bid_id) === String(currentUser?._id);
                    })
                    .sort((x: any, y: any) => y.amount - x.amount)[0];

                const highestBid = allBids.length > 0
                    ? Math.max(...allBids.map((b: any) => b.amount))
                    : 0;

                let status: BidStatus = "Outbid";
                if (a.status === "CLOSED") {
                    const winning = a.winningBid;
                    if (winning && String(winning.buyerId) === String(currentUser?._id)) {
                        status = "Won";
                    } else {
                        status = "Lost";
                    }
                } else {
                    if (myBid && myBid.amount === highestBid) {
                        status = "Leading";
                    } else {
                        status = "Outbid";
                    }
                }

                return {
                    id: a._id,
                    crop: a.crop,
                    quantityKg: a.quantityKg,
                    myBidAmount: myBid?.amount || 0,
                    highestBid,
                    status,
                    auctionStatus: a.status,
                    farmer: a.farmerId?.name || "Farmer",
                    winningBid: a.winningBid,
                };
            });

            setBids(formatted);
        } catch (e) {
            console.log("Error loading my bids:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <NavBuyer />

            {/* Header */}
            <View style={styles.topHeader}>
                <TouchableOpacity onPress={() => router.replace("/buyer-dashboard")} style={{ marginRight: 12 }}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>My Bids</Text>
                    <Text style={styles.headerSub}>{bids.length} auctions participated</Text>
                </View>
                <TouchableOpacity onPress={loadMyBids}>
                    <Ionicons name="refresh" size={22} color="#FFF" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }} />
                ) : bids.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="pricetag-outline" size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>You haven't placed any bids yet</Text>
                        <TouchableOpacity
                            style={styles.browseBtn}
                            onPress={() => router.push("/buyer-auctions" as any)}
                        >
                            <Text style={styles.browseBtnText}>Browse Live Auctions</Text>
                        </TouchableOpacity>
                    </View>
                ) : bids.map((bid) => {
                    const sc = statusColors[bid.status];
                    return (
                        <TouchableOpacity
                            key={bid.id}
                            style={styles.bidCard}
                            activeOpacity={0.7}
                            onPress={() => {
                                if (bid.auctionStatus === "OPEN") {
                                    router.push({ pathname: "/auction-detail" as any, params: { id: bid.id } });
                                }
                            }}
                        >
                            {/* Card Top */}
                            <View style={styles.cardTop}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cropName}>{bid.crop}</Text>
                                    <Text style={styles.farmerText}>{bid.quantityKg} kg · {bid.farmer}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                                    <Text style={[styles.statusText, { color: sc.text }]}>{bid.status}</Text>
                                </View>
                            </View>

                            {/* Bid Details */}
                            <View style={styles.bidDetails}>
                                <View style={styles.bidCol}>
                                    <Text style={styles.bidLabel}>MY BID</Text>
                                    <Text style={styles.bidValue}>{formatCurr(bid.myBidAmount)}</Text>
                                </View>
                                <View style={styles.bidCol}>
                                    <Text style={styles.bidLabel}>CURRENT HIGHEST</Text>
                                    <Text style={[styles.bidValue, { color: "#2563EB" }]}>{formatCurr(bid.highestBid)}</Text>
                                </View>
                                <View style={styles.bidCol}>
                                    <Text style={styles.bidLabel}>STATUS</Text>
                                    <Text style={styles.bidValue}>{bid.auctionStatus === "CLOSED" ? "Closed" : "Live"}</Text>
                                </View>
                            </View>

                            {/* Won Banner */}
                            {bid.status === "Won" && (
                                <View style={styles.wonBanner}>
                                    <Ionicons name="trophy" size={16} color="#D97706" />
                                    <Text style={styles.wonText}>
                                        You won this auction! Final price: {formatCurr(bid.winningBid?.amount || bid.myBidAmount)}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F1F5F9" },
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },

    topHeader: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#7C3AED",
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFF" },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2, fontWeight: "500" },

    emptyContainer: { alignItems: "center", marginTop: 60, gap: 12 },
    emptyText: { color: "#94A3B8", fontSize: 16, fontWeight: "600" },
    browseBtn: {
        backgroundColor: "#2563EB",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 8,
    },
    browseBtnText: { color: "#FFF", fontWeight: "700", fontSize: 14 },

    bidCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        marginBottom: 14,
        padding: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 14,
    },
    cropName: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
    farmerText: { fontSize: 13, color: "#64748B", fontWeight: "500", marginTop: 4 },

    statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: "800" },

    bidDetails: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        paddingTop: 14,
        gap: 8,
    },
    bidCol: { flex: 1 },
    bidLabel: { fontSize: 10, fontWeight: "700", color: "#94A3B8", letterSpacing: 0.5, marginBottom: 4 },
    bidValue: { fontSize: 15, fontWeight: "800", color: "#0F172A" },

    wonBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FEF3C7",
        borderRadius: 8,
        padding: 12,
        marginTop: 14,
    },
    wonText: { fontSize: 13, fontWeight: "600", color: "#92400E", flex: 1 },
});
