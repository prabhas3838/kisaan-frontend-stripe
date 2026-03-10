import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Platform,
    Alert,
    ActivityIndicator,
    Modal
} from "react-native";
import { Stack, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS } from "../services/api";
import { getProfile } from "../services/userServices";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import NavFarmer from "../components/navigation/NavFarmer";
import NotificationBell from "../components/notifications/NotificationBell";
import { chatService } from "../services/chatService";

// Helper to format currency
const formatCurr = (val: number) => `₹${val.toLocaleString("en-IN")}`;

// Timer Component
const AuctionTimer = ({ createdAt, status, extendedHours }: { createdAt: string, status: string, extendedHours: number }) => {
    const [timeLeft, setTimeLeft] = useState("");
    const [isEnded, setIsEnded] = useState(status === "CLOSED");

    useEffect(() => {
        if (status === "CLOSED") {
            setIsEnded(true);
            setTimeLeft("_");
            return;
        }

        const addedMillis = (24 + extendedHours) * 60 * 60 * 1000;
        const endTime = new Date(createdAt).getTime() + addedMillis;

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

    if (status === "CLOSED") {
        return <Text style={styles.timeValueEnded}>_</Text>;
    }

    return (
        <Text style={[styles.timeValue, isEnded ? { color: '#EF4444' } : null]}>
            {timeLeft}
        </Text>
    );
};

export default function FarmerLiveAuctions() {
    const router = useRouter();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [auctions, setAuctions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [filter, setFilter] = useState<"All" | "Active" | "Ended">("All");

    useEffect(() => {
        loadAuctions();
    }, []);

    const loadAuctions = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const profileRes = await getProfile();
            let currentUser = profileRes?.user;
            if (currentUser) setUser(currentUser);

            const res = await fetch(`${ENDPOINTS.AUCTIONS.GET_ALL}?status=ALL`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch auctions");
            const allAuctions = await res.json();
            console.log("Total auctions from backend:", allAuctions.length);
            console.log("Current user ID:", currentUser?._id);
            if (allAuctions.length > 0) {
                console.log("Sample farmerId from first auction:", allAuctions[0].farmerId);
            }

            // Filter for only this farmer's auctions
            const myAuctions = allAuctions.filter((a: any) => {
                const fid = a.farmerId?._id || a.farmerId;
                const match = String(fid) === String(currentUser?._id);
                return match;
            });
            console.log("My auctions count:", myAuctions.length);

            // Map backend data to UI expected format
            const formatted = myAuctions.map((a: any) => {
                let maxBid = 0;
                let formattedBids = [];
                if (a.bids && a.bids.length > 0) {
                    maxBid = Math.max(...a.bids.map((b: any) => b.amount));
                    formattedBids = a.bids.map((b: any) => ({
                        id: b._id,
                        amount: b.amount,
                        time: new Date(b.time).toLocaleString(),
                        buyer: b.buyerId?.name || "Unknown Buyer"
                    })).sort((a: any, b: any) => b.amount - a.amount);
                }

                return {
                    id: a._id,
                    crop: a.crop,
                    createdAt: a.createdAt,
                    quantity: `${a.quantityKg} kg`,
                    basePrice: a.basePrice,
                    reservePrice: a.reservePrice || (a.basePrice * 1.5),
                    currentHighBid: maxBid,
                    totalBids: a.bids ? a.bids.length : 0,
                    status: a.status,
                    recentBids: formattedBids,
                    winnerName: a.winningBid?.buyerId?.name || null,
                    winnerId: a.winningBid?.buyerId?._id || a.winningBid?.buyerId || null,
                    winnerPhone: a.winningBid?.buyerId?.phone || null,
                    winningAmount: a.winningBid?.amount || 0,
                };
            });

            setAuctions(formatted);
            if (formatted.length > 0) setExpandedId(formatted[0].id);

        } catch (e) {
            console.log("Error fetching my auctions", e);
            Alert.alert("Error", "Could not load auctions");
        } finally {
            setLoading(false);
        }
    };

    const handleEndAuction = async (auction: any) => {
        const hasBids = auction.totalBids > 0;
        const highestBid = auction.currentHighBid;
        // Since auction.recentBids is sorted descending, [0] is the highest bid
        const topBidderName = hasBids && auction.recentBids.length > 0 ? auction.recentBids[0].buyer : "No one";

        const doClose = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                console.log("Token available:", !!token);
                console.log("Closing auction ID:", auction.id);
                console.log("URL:", ENDPOINTS.AUCTIONS.CLOSE(auction.id));

                const res = await fetch(ENDPOINTS.AUCTIONS.CLOSE(auction.id), {
                    method: 'POST',
                    headers: { "Authorization": `Bearer ${token}` }
                });

                console.log("End Auction Status:", res.status);

                if (res.ok) {
                    // Reload auctions to get populated winner data
                    await loadAuctions();
                    if (Platform.OS === 'web') {
                        window.alert("Auction successfully closed!");
                    } else {
                        Alert.alert("Success", "Auction successfully closed.");
                    }
                } else {
                    const data = await res.json();
                    console.log("End Auction Error:", data);
                    const msg = `[${res.status}] ` + (data.message || "Failed to close auction");
                    if (Platform.OS === 'web') {
                        window.alert("Error: " + msg);
                    } else {
                        Alert.alert("Error", msg);
                    }
                }
            } catch (e) {
                console.log("Network error ending auction:", e);
                if (Platform.OS === 'web') {
                    window.alert("Network request failed.");
                } else {
                    Alert.alert("Error", "Network request failed.");
                }
            }
        };

        const confirmTitle = "End Auction?";
        const confirmMessage = hasBids
            ? `Highest bid: ${formatCurr(highestBid)} by ${topBidderName}\n\nIf you continue, this buyer will win the auction.`
            : "No bids have been placed. If you continue, the auction will be closed with no winner.";

        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${confirmTitle}\n\n${confirmMessage}`);
            if (confirmed) doClose();
        } else {
            Alert.alert(
                confirmTitle,
                confirmMessage,
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Confirm Winner", style: "destructive", onPress: doClose }
                ]
            );
        }
    };


    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const renderProgressionBar = (current: number, base: number, reserve: number, status: string) => {
        let percentage = (current / reserve) * 100;
        if (percentage < 0) percentage = 0;
        if (percentage > 100) percentage = 100;

        const isMet = current >= reserve;
        const progressColor = isMet ? "#10B981" : "#3B82F6";

        return (
            <View style={styles.chartContainer}>
                <View style={styles.chartLabels}>
                    <Text style={styles.chartLabelText}>Base: {formatCurr(base)}</Text>
                    <Text style={styles.chartLabelText}>Reserve: {formatCurr(reserve)}{isMet ? " ✓" : ""}</Text>
                </View>

                <View style={styles.barBackground}>
                    {current > 0 ? (
                        <View style={[styles.barFill, { width: `${percentage}%`, backgroundColor: progressColor }]} />
                    ) : (
                        <View style={[styles.barFill, { width: `2%`, backgroundColor: "#E5E7EB" }]} />
                    )}
                </View>
            </View>
        );
    };

    const activeCount = auctions.filter(a => a.status === "OPEN").length;
    const filteredAuctions = auctions.filter(a => {
        if (filter === "All") return true;
        if (filter === "Active") return a.status === "OPEN";
        if (filter === "Ended") return a.status === "CLOSED";
        return true;
    });

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <NavFarmer />

            {/* Header Area */}
            <View style={styles.topHeader}>
                <View style={styles.headerTopRow}>
                    <TouchableOpacity style={{ marginRight: 10 }} onPress={() => router.replace("/farmer-dashboard")}>
                        <Ionicons name="arrow-back" size={24} color="#111827" />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.headerTitle}>Live Auction Monitor</Text>
                        <Text style={styles.headerSubtitle}>{activeCount} active auctions</Text>
                    </View>
                    <NotificationBell color="#0F172A" />
                </View>
                <View style={styles.filterRow}>
                    {["All", "Active", "Ended"].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                            onPress={() => setFilter(f as any)}
                        >
                            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
                ) : filteredAuctions.length === 0 ? (
                    <Text style={styles.emptyText}>No auctions found.</Text>
                ) : filteredAuctions.map((auction, index) => {
                    const isExpanded = expandedId === auction.id;
                    const hasBids = auction.totalBids > 0;
                    const isMet = auction.currentHighBid >= auction.reservePrice;
                    const isEnded = auction.status === "CLOSED";

                    const brightColors = ["#FEF08A", "#BAE6FD", "#A7F3D0", "#FBCFE8"]; // Yellow, Sky, Emerald, Pink
                    const cardBgColor = brightColors[index % brightColors.length];

                    return (
                        <View key={auction.id} style={[styles.card, { backgroundColor: cardBgColor }]}>
                            {/* Card Header */}
                            <TouchableOpacity activeOpacity={0.7} onPress={() => toggleExpand(auction.id)} style={styles.cardHeader}>
                                <View style={styles.cropInfoRow}>
                                    <Text style={styles.cropTitle}>{auction.crop}</Text>
                                    <Text style={styles.cropSubtitle}>{auction.quantity}</Text>

                                    <View style={[styles.statusBadge, isEnded ? styles.statusBadgeEnded : styles.statusBadgeLive]}>
                                        <Text style={[styles.statusText, isEnded ? styles.statusTextEnded : styles.statusTextLive]}>
                                            {isEnded ? "✓ ENDED" : "● LIVE"}
                                        </Text>
                                    </View>
                                </View>
                                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                            </TouchableOpacity>

                            {/* Stats Grid */}
                            <View style={styles.statsRow}>
                                {/* Highest Bid */}
                                <View style={styles.statCol}>
                                    <View style={styles.statHeaderRow}>
                                        <Feather name="trending-up" size={14} color="#6B7280" />
                                        <Text style={styles.statLabel}>HIGHEST BID</Text>
                                    </View>
                                    <Text style={[
                                        styles.statValueBid,
                                        !hasBids ? styles.statValueGray : (isMet ? styles.statValueGreen : styles.statValueBlack)
                                    ]}>
                                        {hasBids ? formatCurr(auction.currentHighBid) : "No Bids"}
                                    </Text>
                                </View>

                                {/* Total Bids */}
                                <View style={styles.statCol}>
                                    <View style={styles.statHeaderRow}>
                                        <Feather name="hash" size={14} color="#6B7280" />
                                        <Text style={styles.statLabel}>TOTAL BIDS</Text>
                                    </View>
                                    <Text style={styles.statValueBlack}>{auction.totalBids}</Text>
                                </View>

                                {/* Time Left */}
                                <View style={styles.statCol}>
                                    <View style={styles.statHeaderRow}>
                                        <Feather name="clock" size={14} color="#6B7280" />
                                        <Text style={styles.statLabel}>TIME LEFT</Text>
                                    </View>
                                    <AuctionTimer createdAt={auction.createdAt} status={auction.status} extendedHours={0} />
                                </View>
                            </View>

                            {/* Progression Bar visible on card body */}
                            <View style={styles.progressSection}>
                                {renderProgressionBar(auction.currentHighBid, auction.basePrice, auction.reservePrice, auction.status)}
                            </View>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <View style={[styles.expandedSection, { backgroundColor: cardBgColor }]}>

                                    {/* Winner Card — shown first for CLOSED auctions */}
                                    {isEnded && auction.winnerName ? (
                                        <View style={styles.winnerCard}>
                                            <View style={styles.winnerHeader}>
                                                <Ionicons name="trophy" size={18} color="#D97706" />
                                                <Text style={styles.winnerHeaderText}>WINNER DETAILS</Text>
                                            </View>
                                            <View style={styles.winnerInfo}>
                                                <View style={styles.winnerRow}>
                                                    <Ionicons name="person" size={15} color="#374151" />
                                                    <Text style={styles.winnerLabel}>Name:</Text>
                                                    <Text style={styles.winnerValue}>{auction.winnerName}</Text>
                                                </View>
                                                <View style={styles.winnerRow}>
                                                    <Ionicons name="cash" size={15} color="#374151" />
                                                    <Text style={styles.winnerLabel}>Bid:</Text>
                                                    <Text style={[styles.winnerValue, { color: '#059669', fontWeight: '900' }]}>{formatCurr(auction.winningAmount)}</Text>
                                                </View>
                                                {auction.winnerPhone && (
                                                    <View style={styles.winnerRow}>
                                                        <Ionicons name="call" size={15} color="#374151" />
                                                        <Text style={styles.winnerLabel}>Phone:</Text>
                                                        <Text style={styles.winnerValue}>{auction.winnerPhone}</Text>
                                                    </View>
                                                )}
                                                <TouchableOpacity
                                                    style={styles.msgBuyerBtn}
                                                    onPress={async () => {
                                                        try {
                                                            const res = await chatService.getOrCreateChat(auction.winnerId, auction.id);
                                                            if (res?.success) {
                                                                router.push(`/chat/${res.chat._id}?dealId=${auction.id}`);
                                                            } else {
                                                                Alert.alert("Error", "Could not start chat.");
                                                            }
                                                        } catch (err) {
                                                            console.log("Chat init error", err);
                                                            Alert.alert("Error", "Could not start chat.");
                                                        }
                                                    }}>
                                                    <Ionicons name="chatbubble-ellipses" size={14} color="#FFF" />
                                                    <Text style={styles.msgBuyerBtnText}>Message Buyer</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ) : isEnded ? (
                                        <View style={styles.noBidsEndedCard}>
                                            <Ionicons name="information-circle-outline" size={18} color="#6B7280" />
                                            <Text style={styles.noBidsEndedText}>Auction ended with no bids</Text>
                                        </View>
                                    ) : null}

                                    {/* Bid Progression — for OPEN auctions */}
                                    {!isEnded && (
                                        <>
                                            <View style={styles.sectionHeaderRow}>
                                                <Feather name="trending-up" size={16} color="#6B7280" />
                                                <Text style={styles.sectionHeading}>BID PROGRESSION</Text>
                                            </View>
                                            <View style={styles.progressionBox}>
                                                {hasBids ? (
                                                    <Text style={styles.bidProgressText}>
                                                        Highest: {formatCurr(auction.currentHighBid)} · {auction.totalBids} bids placed
                                                    </Text>
                                                ) : (
                                                    <Text style={styles.emptyText}>Waiting for first bid...</Text>
                                                )}
                                            </View>
                                        </>
                                    )}

                                    <View style={[styles.sectionHeaderRow, { marginTop: 16 }]}>
                                        <Feather name="clock" size={16} color="#6B7280" />
                                        <Text style={styles.sectionHeading}>RECENT BIDS</Text>
                                    </View>
                                    {hasBids ? (
                                        <View style={styles.historyBox}>
                                            {auction.recentBids.map((bid: any, index: number) => (
                                                <View key={bid.id} style={[styles.historyRow, index % 2 === 0 ? styles.historyRowEven : styles.historyRowOdd]}>
                                                    <View>
                                                        <Text style={styles.historyBuyer}>{bid.buyer}</Text>
                                                        <Text style={styles.historyTime}>{bid.time}</Text>
                                                    </View>
                                                    <Text style={styles.historyAmount}>{formatCurr(bid.amount)}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={styles.emptyHistory}>No bids have been placed yet.</Text>
                                    )}

                                    {/* End Auction — only for OPEN */}
                                    {!isEnded && (
                                        <View style={styles.actionsRow}>
                                            <TouchableOpacity style={styles.cancelBtn} onPress={() => handleEndAuction(auction)}>
                                                <Feather name="x" size={16} color="#FFF" style={{ marginRight: 6 }} />
                                                <Text style={styles.cancelBtnText}>End Auction</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}

                        </View>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F9FAFB" },
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },

    topHeader: {
        backgroundColor: "#FFF",
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        paddingBottom: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
    },
    headerTopRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },
    headerSubtitle: { fontSize: 13, color: "#6B7280", marginTop: 2, fontWeight: "500" },
    filterRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
    },
    filterBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        backgroundColor: "#FFF"
    },
    filterBtnActive: {
        backgroundColor: "#111827",
        borderColor: "#111827"
    },
    filterText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#4B5563"
    },
    filterTextActive: {
        color: "#FFF"
    },
    notificationBtn: {
        width: 36, height: 36,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
    },
    badge: {
        position: "absolute",
        top: -4, right: -4,
        backgroundColor: "#EF4444",
        width: 18, height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center"
    },
    badgeText: { color: "#FFF", fontSize: 10, fontWeight: "800" },

    card: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        overflow: "hidden"
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    cropInfoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    cropTitle: { fontSize: 18, fontWeight: "800", color: "#111827" },
    cropSubtitle: { fontSize: 15, fontWeight: "500", color: "#6B7280" },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeLive: { backgroundColor: "#10B981" },
    statusBadgeEnded: { backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" },
    statusText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
    statusTextLive: { color: "#FFF" },
    statusTextEnded: { color: "#6B7280" },

    statsRow: {
        flexDirection: "row",
        paddingHorizontal: 20,
        paddingBottom: 16,
        justifyContent: "space-between"
    },
    statCol: { flex: 1 },
    statHeaderRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
    statLabel: { fontSize: 10, color: "#6B7280", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
    statValueBid: { fontSize: 18, fontWeight: "800" },
    statValueBlack: { fontSize: 18, fontWeight: "800", color: "#111827" },
    statValueGreen: { color: "#10B981" },
    statValueGray: { color: "#6B7280" },
    timeValue: { fontSize: 16, fontWeight: "800", color: "#10B981" },
    timeValueEnded: { fontSize: 16, fontWeight: "800", color: "#111827" },

    progressSection: {
        paddingHorizontal: 20,
        paddingBottom: 20
    },
    chartContainer: {
        gap: 6
    },
    chartLabels: { flexDirection: "row", justifyContent: "space-between" },
    chartLabelText: { fontSize: 11, color: "#6B7280", fontWeight: "500" },
    barBackground: { height: 8, backgroundColor: "#E5E7EB", borderRadius: 4, overflow: "hidden" }, // Darkened slightly for better contrast on alternating BGs
    barFill: { height: "100%", borderRadius: 4 },

    expandedSection: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#F3F4F6",
        // backgroundColor is set dynamically in component
    },
    sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 },
    sectionHeading: { fontSize: 11, fontWeight: "700", color: "#6B7280", letterSpacing: 0.5 },
    progressionBox: {
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        padding: 40,
        alignItems: "center",
        justifyContent: "center"
    },
    emptyText: { color: "#6B7280", fontSize: 13, fontWeight: "500", textAlign: "center" },
    emptyHistory: { fontStyle: "italic", color: "#6B7280", fontSize: 13, marginBottom: 16 },

    historyBox: { backgroundColor: "#FFF", borderRadius: 8, borderWidth: 1, borderColor: "#E5E7EB", overflow: "hidden", marginBottom: 16 },
    historyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
    historyRowEven: { backgroundColor: "#F9FAFB" },
    historyRowOdd: { backgroundColor: "#FFF" },
    historyBuyer: { fontSize: 13, fontWeight: "700", color: "#111827", marginBottom: 2 },
    historyTime: { fontSize: 11, color: "#6B7280", fontWeight: "500" },
    historyAmount: { fontSize: 14, fontWeight: "800", color: "#111827" },

    actionsRow: { flexDirection: "row", gap: 12, marginTop: 4 },
    cancelBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EF4444",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 6
    },
    cancelBtnText: { color: "#FFF", fontWeight: "700", fontSize: 13 },

    winnerCard: {
        backgroundColor: "#FFF",
        borderRadius: 10,
        marginTop: 12,
        borderWidth: 1,
        borderColor: "#FDE68A",
        overflow: "hidden",
    },
    winnerHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FEF3C7",
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    winnerHeaderText: { fontSize: 11, fontWeight: "800", color: "#92400E", letterSpacing: 0.5 },
    winnerInfo: { padding: 14, gap: 8 },
    bidProgressText: { fontSize: 14, fontWeight: "700", color: "#111827" },
    winnerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    winnerLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280", width: 52 },
    winnerValue: { fontSize: 15, fontWeight: "700", color: "#111827", flex: 1 },
    msgBuyerBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#D97706",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        marginTop: 6,
        alignSelf: "flex-start",
        gap: 6
    },
    msgBuyerBtnText: { color: "#FFF", fontSize: 12, fontWeight: "700" },

    noBidsEndedCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#F3F4F6",
        borderRadius: 8,
        padding: 14,
        marginTop: 12,
    },
    noBidsEndedText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
});
