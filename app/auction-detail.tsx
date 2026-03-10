import React, { useState, useEffect, useRef } from "react";
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
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENDPOINTS, SOCKET_URL } from "../services/api";
import { getProfile } from "../services/userServices";
import { Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import io from "socket.io-client";
import NavBuyer from "../components/navigation/NavBuyer";
import { chatService } from "../services/chatService";

const formatCurr = (val: number) => `₹${val.toLocaleString("en-IN")}`;

// Timer Component
const AuctionTimer = ({ createdAt, status }: { createdAt: string, status: string }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (status === "CLOSED") {
            setTimeLeft("Auction Ended");
            return;
        }

        const endTime = new Date(createdAt).getTime() + (24 * 60 * 60 * 1000);

        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = endTime - now;

            if (diff <= 0) {
                setTimeLeft("Ending...");
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft(`${h}h ${m}m ${s}s`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [createdAt, status]);

    return <Text style={styles.timerValue}>{timeLeft}</Text>;
};

export default function AuctionDetail() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const auctionId = id as string;

    const [auction, setAuction] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [bidAmount, setBidAmount] = useState("");
    const [placing, setPlacing] = useState(false);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        loadAuctionDetail();
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const loadAuctionDetail = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            const profileRes = await getProfile();
            const currentUser = profileRes?.user;
            if (currentUser) setUser(currentUser);

            // Fetch auction list and find the one we need
            const res = await fetch(ENDPOINTS.AUCTIONS.GET_ALL, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch");
            const allAuctions = await res.json();
            const found = allAuctions.find((a: any) => a._id === auctionId);

            if (found) {
                const maxBid = found.bids?.length > 0
                    ? Math.max(...found.bids.map((b: any) => b.amount))
                    : 0;

                const formattedBids = (found.bids || []).map((b: any) => ({
                    id: b._id,
                    amount: b.amount,
                    time: new Date(b.time).toLocaleString(),
                    buyer: b.buyerId?.name || "Buyer",
                    buyerId: b.buyerId?._id || b.buyerId,
                })).sort((a: any, b: any) => b.amount - a.amount);

                setAuction({
                    id: found._id,
                    crop: found.crop,
                    createdAt: found.createdAt,
                    quantityKg: found.quantityKg,
                    basePrice: found.basePrice,
                    reservePrice: found.reservePrice || (found.basePrice * 1.5),
                    currentHighBid: maxBid,
                    totalBids: found.bids?.length || 0,
                    status: found.status,
                    farmer: found.farmerId?.name || "Verified Farmer",
                    farmerId: found.farmerId?._id || found.farmerId,
                    farmerPhone: found.farmerId?.phone || null,
                    winningBid: found.winningBid || null,
                    bids: formattedBids,
                });
            }

            // Connect socket
            connectSocket(currentUser?._id);

        } catch (e) {
            console.log("Error loading auction:", e);
        } finally {
            setLoading(false);
        }
    };

    const connectSocket = (userId: string) => {
        const socket = io(SOCKET_URL, { transports: ["websocket"] });
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("Socket connected for auction:", auctionId);
            socket.emit("joinAuction", auctionId);
            if (userId) socket.emit("joinUserRoom", userId);
        });

        socket.on("newBid", (data: any) => {
            console.log("New bid received:", data);
            setAuction((prev: any) => {
                if (!prev) return prev;
                const newBid = {
                    id: Date.now().toString(),
                    amount: data.amount,
                    time: new Date().toLocaleString(),
                    buyer: "Buyer",
                    buyerId: data.buyerId,
                };
                const updatedBids = [newBid, ...prev.bids];
                return {
                    ...prev,
                    currentHighBid: Math.max(prev.currentHighBid, data.amount),
                    totalBids: prev.totalBids + 1,
                    bids: updatedBids,
                };
            });
        });

        socket.on("outbid", (data: any) => {
            if (Platform.OS === 'web') {
                window.alert(`You have been outbid! New highest: ${formatCurr(data.newAmount)}`);
            } else {
                Alert.alert("Outbid!", `You have been outbid! New highest bid: ${formatCurr(data.newAmount)}`);
            }
        });

        socket.on("auctionClosed", (data: any) => {
            console.log("Auction closed event received:", data);
            setAuction((prev: any) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    status: "CLOSED",
                    winningBid: data.winningBid || null,
                };
            });
        });

        socket.on("bidError", (msg: string) => {
            if (Platform.OS === 'web') {
                window.alert("Bid Error: " + msg);
            } else {
                Alert.alert("Bid Error", msg);
            }
            setPlacing(false);
        });
    };

    const handlePlaceBid = () => {
        const amount = Number(bidAmount);
        if (!amount || amount <= 0) {
            const msg = "Please enter a valid bid amount.";
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Invalid", msg);
            return;
        }

        const MIN_INCREMENT = 50;
        const minRequired = auction.currentHighBid > 0
            ? auction.currentHighBid + MIN_INCREMENT
            : auction.basePrice;

        if (auction && amount < minRequired) {
            const msg = auction.currentHighBid > 0
                ? `Minimum bid is ${formatCurr(minRequired)} (current highest ${formatCurr(auction.currentHighBid)} + ${formatCurr(MIN_INCREMENT)} increment)`
                : `Minimum bid is the base price: ${formatCurr(auction.basePrice)}`;
            Platform.OS === 'web' ? window.alert(msg) : Alert.alert("Bid Too Low", msg);
            return;
        }

        setPlacing(true);

        if (socketRef.current) {
            socketRef.current.emit("placeBid", {
                auctionId,
                buyerId: user?._id,
                amount,
            });
        }

        setBidAmount("");
        setTimeout(() => setPlacing(false), 2000);
    };

    if (loading) {
        return (
            <View style={styles.loadContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (!auction) {
        return (
            <View style={styles.loadContainer}>
                <Stack.Screen options={{ headerShown: false }} />
                <Text style={{ color: "#64748B", fontSize: 16 }}>Auction not found</Text>
            </View>
        );
    }

    const isMet = auction.currentHighBid >= auction.reservePrice;

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <NavBuyer />

            {/* Header */}
            <View style={styles.topHeader}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                    <Ionicons name="arrow-back" size={24} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>{auction.crop}</Text>
                    <Text style={styles.headerSub}>{auction.quantityKg} kg · {auction.farmer} ✓</Text>
                </View>
                <View style={[styles.statusBadge, auction.status === "OPEN" ? styles.badgeLive : styles.badgeEnded]}>
                    <Text style={styles.statusText}>{auction.status === "OPEN" ? "● LIVE" : "ENDED"}</Text>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
                {/* Auction Info Card */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoTitle}>Auction Details</Text>

                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Feather name="tag" size={14} color="#64748B" />
                            <Text style={styles.infoLabel}>Base Price</Text>
                            <Text style={styles.infoValue}>{formatCurr(auction.basePrice)}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Feather name="trending-up" size={14} color="#2563EB" />
                            <Text style={styles.infoLabel}>Highest Bid</Text>
                            <Text style={[styles.infoValue, { color: "#2563EB" }]}>
                                {auction.currentHighBid > 0 ? formatCurr(auction.currentHighBid) : "No Bids"}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Feather name="target" size={14} color={isMet ? "#10B981" : "#F59E0B"} />
                            <Text style={styles.infoLabel}>Reserve</Text>
                            <Text style={[styles.infoValue, { color: isMet ? "#10B981" : "#F59E0B" }]}>
                                {formatCurr(auction.reservePrice)} {isMet ? "✓" : ""}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Feather name="clock" size={14} color="#64748B" />
                            <Text style={styles.infoLabel}>Time Left</Text>
                            <AuctionTimer createdAt={auction.createdAt} status={auction.status} />
                        </View>
                    </View>

                    {/* Bid Count */}
                    <View style={styles.bidCountRow}>
                        <Feather name="hash" size={14} color="#64748B" />
                        <Text style={styles.bidCountText}>{auction.totalBids} total bids placed</Text>
                    </View>
                </View>

                {/* Place Bid Section — only if OPEN */}
                {auction.status === "OPEN" && (
                    <View style={styles.bidSection}>
                        <Text style={styles.bidSectionTitle}>Place Your Bid</Text>
                        <Text style={styles.bidHint}>
                            Min bid: {formatCurr(auction.currentHighBid > 0 ? auction.currentHighBid + 50 : auction.basePrice)}  (₹50 increment)
                        </Text>
                        <View style={styles.bidInputRow}>
                            <Text style={styles.rupeeSign}>₹</Text>
                            <TextInput
                                style={styles.bidInput}
                                placeholder="Enter amount"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                value={bidAmount}
                                onChangeText={setBidAmount}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.placeBidBtn, placing && { opacity: 0.6 }]}
                            onPress={handlePlaceBid}
                            disabled={placing}
                        >
                            <Ionicons name="flash" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.placeBidText}>{placing ? "Placing..." : "Place Bid"}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Auction Closed — Winner / Loser Banner */}
                {auction.status === "CLOSED" && (
                    <View style={styles.closedSection}>
                        {auction.winningBid && String(auction.winningBid.buyerId) === String(user?._id) ? (
                            <View style={styles.wonBanner}>
                                <Ionicons name="trophy" size={22} color="#D97706" />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.wonTitle}>You Won This Auction!</Text>
                                    <Text style={styles.wonDetail}>Final price: {formatCurr(auction.winningBid.amount)}</Text>
                                    {auction.farmer && (
                                        <View style={styles.contactRow}>
                                            <Ionicons name="person" size={14} color="#92400E" />
                                            <Text style={styles.contactText}>Farmer: {auction.farmer}</Text>
                                        </View>
                                    )}
                                    {auction.farmerPhone && (
                                        <View style={styles.contactRow}>
                                            <Ionicons name="call" size={14} color="#92400E" />
                                            <Text style={styles.contactText}>Phone: {auction.farmerPhone}</Text>
                                        </View>
                                    )}
                                    <TouchableOpacity
                                        style={styles.msgFarmerBtn}
                                        onPress={async () => {
                                            try {
                                                const res = await chatService.getOrCreateChat(auction.farmerId, auction.id);
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
                                        <Text style={styles.msgFarmerBtnText}>Message Farmer</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.lostBanner}>
                                <Ionicons name="close-circle" size={22} color="#DC2626" />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.lostTitle}>Auction Ended</Text>
                                    <Text style={styles.lostDetail}>
                                        {auction.winningBid
                                            ? `Winning bid: ${formatCurr(auction.winningBid.amount)}`
                                            : "No bids were placed"}
                                    </Text>
                                    <Text style={styles.lostDetail}>Status: You did not win</Text>
                                </View>
                            </View>
                        )}
                    </View>
                )}

                {/* Bid History */}
                <View style={styles.historySection}>
                    <View style={styles.historyHeader}>
                        <Feather name="clock" size={16} color="#64748B" />
                        <Text style={styles.historyTitle}>BID HISTORY</Text>
                    </View>

                    {auction.bids.length === 0 ? (
                        <Text style={styles.noBidsText}>No bids yet. Be the first!</Text>
                    ) : (
                        auction.bids.map((bid: any, index: number) => {
                            const isYou = bid.buyerId === user?._id;
                            const isHighest = index === 0;
                            return (
                                <View key={bid.id} style={[styles.bidRow, index % 2 === 0 && { backgroundColor: "#F8FAFC" }]}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                            <Text style={styles.bidBuyer}>{bid.buyer}</Text>
                                            {isYou && <Text style={styles.youTag}>You</Text>}
                                            {isHighest && <Text style={styles.highestTag}>Highest</Text>}
                                        </View>
                                        <Text style={styles.bidTime}>{bid.time}</Text>
                                    </View>
                                    <Text style={[styles.bidAmount, isHighest && { color: "#2563EB" }]}>
                                        {formatCurr(bid.amount)}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F1F5F9" },
    container: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    loadContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F1F5F9" },

    topHeader: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2563EB",
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        paddingBottom: 16,
        paddingHorizontal: 16,
    },
    headerTitle: { fontSize: 22, fontWeight: "800", color: "#FFF" },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2, fontWeight: "500" },

    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeLive: { backgroundColor: "#10B981" },
    badgeEnded: { backgroundColor: "#EF4444" },
    statusText: { color: "#FFF", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

    infoCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    infoTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 16 },
    infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
    infoItem: {
        width: "47%",
        backgroundColor: "#F8FAFC",
        borderRadius: 8,
        padding: 14,
        gap: 4,
    },
    infoLabel: { fontSize: 11, fontWeight: "600", color: "#94A3B8" },
    infoValue: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
    timerValue: { fontSize: 18, fontWeight: "800", color: "#2563EB" },

    bidCountRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
    },
    bidCountText: { fontSize: 14, color: "#64748B", fontWeight: "600" },

    bidSection: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#2563EB",
    },
    bidSectionTitle: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
    bidHint: { fontSize: 12, color: "#64748B", marginBottom: 14, fontWeight: "500" },
    bidInputRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    rupeeSign: { fontSize: 24, fontWeight: "800", color: "#0F172A" },
    bidInput: {
        flex: 1,
        height: 48,
        backgroundColor: "#F8FAFC",
        borderRadius: 8,
        paddingHorizontal: 14,
        fontSize: 18,
        fontWeight: "700",
        color: "#0F172A",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    placeBidBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#2563EB",
        paddingVertical: 15,
        borderRadius: 8,
    },
    placeBidText: { color: "#FFF", fontWeight: "800", fontSize: 16 },

    historySection: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
    },
    historyHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    historyTitle: { fontSize: 11, fontWeight: "700", color: "#64748B", letterSpacing: 0.5 },
    noBidsText: { padding: 20, color: "#94A3B8", fontSize: 14, fontWeight: "500", fontStyle: "italic" },

    bidRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F8FAFC",
    },
    bidBuyer: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
    bidTime: { fontSize: 11, color: "#94A3B8", marginTop: 2, fontWeight: "500" },
    bidAmount: { fontSize: 16, fontWeight: "800", color: "#0F172A" },
    youTag: {
        backgroundColor: "#DBEAFE",
        color: "#2563EB",
        fontSize: 10,
        fontWeight: "700",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    highestTag: {
        backgroundColor: "#D1FAE5",
        color: "#059669",
        fontSize: 10,
        fontWeight: "700",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },

    closedSection: { marginBottom: 16 },
    wonBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#FEF3C7",
        borderRadius: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: "#FDE68A",
    },
    wonTitle: { fontSize: 16, fontWeight: "800", color: "#92400E", marginBottom: 4 },
    wonDetail: { fontSize: 14, fontWeight: "600", color: "#92400E", marginBottom: 2 },
    contactRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
    contactText: { fontSize: 13, fontWeight: "600", color: "#92400E" },
    msgFarmerBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#D97706",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 6,
        marginTop: 12,
        alignSelf: "flex-start",
        gap: 6
    },
    msgFarmerBtnText: { color: "#FFF", fontSize: 12, fontWeight: "700" },
    lostBanner: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: "#FEE2E2",
        borderRadius: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: "#FECACA",
    },
    lostTitle: { fontSize: 16, fontWeight: "800", color: "#991B1B", marginBottom: 4 },
    lostDetail: { fontSize: 14, fontWeight: "600", color: "#991B1B", marginBottom: 2 },
});
