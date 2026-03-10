import React, { useState, useEffect, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Dimensions,
    Alert,
    Modal,
    Platform,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import NavBuyer from "../components/navigation/NavBuyer";

import { fetchMandiPrices } from "../services/mandiService";
import { getUsers, getPublicProfile } from "../services/userServices";
import { chatService } from "../services/chatService";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

type TabKey = "Prices" | "Farmers";

export default function BuyerMarketplace() {
    const router = useRouter();
    const { q } = useLocalSearchParams<{ q?: string }>();
    const [tab, setTab] = useState<TabKey>("Prices");
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(q || "");

    const [prices, setPrices] = useState<any[]>([]);
    const [farmers, setFarmers] = useState<any[]>([]);
    const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
    const [farmerLoading, setFarmerLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem("token");
            if (!token) return;

            if (tab === "Prices") {
                const res = await fetchMandiPrices({ sort: "latest" });
                setPrices(res.data || []);
            } else {
                const res = await getUsers();
                if (Array.isArray(res)) {
                    // Filter only farmers
                    const list = res.filter((u: any) => u.role === "farmer");
                    setFarmers(list);
                } else if (res?.success && Array.isArray(res.users)) {
                    const list = res.users.filter((u: any) => u.role === "farmer");
                    setFarmers(list);
                }
            }
        } catch (e) {
            console.log("Marketplace load error:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [tab]);

    const handleViewFarmer = async (farmerId: string) => {
        setFarmerLoading(true);
        try {
            const res = await getPublicProfile(farmerId);
            if (res.success) {
                setSelectedFarmer(res.user);
            }
        } catch (e) {
            Alert.alert("Error", "Could not load farmer details.");
        } finally {
            setFarmerLoading(false);
        }
    };

    const handleContactFarmer = async (farmerId: string) => {
        try {
            const res = await chatService.getOrCreateChat(farmerId);
            if (res.success) {
                setSelectedFarmer(null);
                router.push(`/chat/${res.chat._id}`);
            }
        } catch (e) {
            Alert.alert("Error", "Could not start chat.");
        }
    };

    const filteredFarmers = useMemo(() => {
        if (!search) return farmers;
        const s = search.toLowerCase();
        return farmers.filter(f =>
            f.name?.toLowerCase().includes(s) ||
            f.location?.toLowerCase().includes(s)
        );
    }, [farmers, search]);

    const filteredPrices = useMemo(() => {
        if (!search) return prices;
        const s = search.toLowerCase();
        return prices.filter(p => p.crop?.toLowerCase().includes(s));
    }, [prices, search]);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <NavBuyer />


            {/* Search Header */}
            <View style={styles.searchHeader}>
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color="#94A3B8" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={tab === "Prices" ? "Search Crops..." : "Search Farmers..."}
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search.length > 0 && (
                        <TouchableOpacity onPress={() => setSearch("")}>
                            <Ionicons name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Custom Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tab, tab === "Prices" && styles.tabActive]}
                    onPress={() => setTab("Prices")}
                >
                    <Text style={[styles.tabText, tab === "Prices" && styles.tabTextActive]}>Mandi Prices</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === "Farmers" && styles.tabActive]}
                    onPress={() => setTab("Farmers")}
                >
                    <Text style={[styles.tabText, tab === "Farmers" && styles.tabTextActive]}>Farmers Directory</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#1e3a8a" />
                    <Text style={styles.loadingText}>Fetching latest data...</Text>
                </View>
            ) : (
                <FlatList
                    data={tab === "Prices" ? filteredPrices : filteredFarmers}
                    keyExtractor={(item) => item._id || String(Math.random())}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        tab === "Prices"
                            ? <PriceCard item={item} />
                            : <FarmerCard
                                item={item}
                                onPress={() => handleViewFarmer(item._id)}
                                onContact={() => handleContactFarmer(item._id)}
                            />
                    )}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="search-outline" size={48} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No results found for "{search}"</Text>
                        </View>
                    }
                />
            )}

            {/* Farmer Detail Modal */}
            <Modal
                visible={!!selectedFarmer}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedFarmer(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Farmer Profile</Text>
                            <TouchableOpacity onPress={() => setSelectedFarmer(null)}>
                                <Ionicons name="close" size={24} color="#1E293B" />
                            </TouchableOpacity>
                        </View>

                        {selectedFarmer && (
                            <ScrollView style={styles.modalBody}>
                                <View style={styles.profileHeader}>
                                    <View style={styles.profileAvatar}>
                                        <Text style={styles.avatarInitial}>{selectedFarmer.name?.charAt(0)}</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.profileName}>{selectedFarmer.name}</Text>
                                        <View style={styles.badgeRow}>
                                            <View style={[styles.statusBadge, selectedFarmer.verificationStatus === "approved" ? styles.verified : styles.unverified]}>
                                                <Ionicons name={selectedFarmer.verificationStatus === "approved" ? "checkmark-circle" : "time"} size={12} color="#fff" />
                                                <Text style={styles.badgeText}>{selectedFarmer.verificationStatus === "approved" ? "Verified Seller" : "Unverified"}</Text>
                                            </View>
                                            <Text style={styles.trustText}>Trust Score: {selectedFarmer.trustScore}/10</Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.statsGrid}>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>Location</Text>
                                        <Text style={styles.statValue}>{selectedFarmer.location || "Not Set"}</Text>
                                    </View>
                                    <View style={styles.statBox}>
                                        <Text style={styles.statLabel}>Experience</Text>
                                        <Text style={styles.statValue}>Standard Partner</Text>
                                    </View>
                                </View>

                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Available Crops</Text>
                                    <View style={styles.listingInfo}>
                                        <Ionicons name="information-circle" size={20} color="#64748B" />
                                        <Text style={styles.listingText}>
                                            Crops listed by this farmer will appear here. Contact for availability.
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.modalActionBtn}
                                    onPress={() => handleContactFarmer(selectedFarmer._id)}
                                >
                                    <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                                    <Text style={styles.modalActionText}>Message Farmer</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

function PriceCard({ item }: any) {
    return (
        <View style={styles.priceCard}>
            <View style={styles.cardUpper}>
                <View style={styles.cropIconBg}>
                    <Ionicons name="leaf" size={20} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cropName}>{item.crop}</Text>
                    <View style={styles.mandiRow}>
                        <Ionicons name="location" size={12} color="#64748B" />
                        <Text style={styles.mandiName}> {item.locationName || item.mandi}</Text>
                    </View>
                </View>
                <View style={styles.priceColumn}>
                    <Text style={styles.priceVal}>₹{item.pricePerQuintal / 100}/kg</Text>
                    <Text style={styles.priceSub}>₹{item.pricePerQuintal}/q</Text>
                </View>
            </View>
            <View style={styles.cardFooter}>
                <Text style={styles.footerTime}>Updated {new Date(item.updatedAt || item.date).toLocaleDateString()}</Text>
                <TouchableOpacity style={styles.insightBtn} onPress={() => Alert.alert("Coming Soon", "Detailed price history is being integrated.")}>
                    <Text style={styles.insightBtnText}>Trends</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function FarmerCard({ item, onPress, onContact }: any) {
    return (
        <TouchableOpacity style={styles.farmerCard} onPress={onPress}>
            <View style={styles.cardUpper}>
                <View style={[styles.cropIconBg, { backgroundColor: "#DBEAFE" }]}>
                    <Ionicons name="person" size={20} color="#1d4ed8" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cropName}>{item.name}</Text>
                    <View style={styles.mandiRow}>
                        <Ionicons name="location-outline" size={14} color="#64748B" />
                        <Text style={styles.mandiName}>{item.location || "Unknown Location"}</Text>
                    </View>
                </View>
                {item.verificationStatus === "approved" && (
                    <View style={styles.verifyBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#fff" />
                        <Text style={styles.verifyText}>Verified</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardFooter}>
                <View style={styles.mandiRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.trustText}> Trust: {item.trustScore}/10</Text>
                </View>
                <TouchableOpacity style={styles.contactBtn} onPress={onContact}>
                    <Ionicons name="mail" size={14} color="#fff" />
                    <Text style={styles.contactBtnText}>Contract</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    loading: { flex: 1, justifyContent: "center", alignItems: "center" },
    loadingText: { marginTop: 12, color: "#64748B", fontSize: 14, fontWeight: "600" },
    searchHeader: { padding: 16, backgroundColor: "#fff" },
    searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#F1F5F9", borderRadius: 12, paddingHorizontal: 12, height: 48 },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: "#1E293B" },
    tabsContainer: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", backgroundColor: "#fff" },
    tab: { flex: 1, alignItems: "center", paddingVertical: 14 },
    tabActive: { borderBottomWidth: 3, borderBottomColor: "#1e3a8a" },
    tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
    tabTextActive: { color: "#1e3a8a", fontWeight: "700" },
    list: { padding: 16 },
    priceCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    farmerCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#F1F5F9", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
    cardUpper: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
    cropIconBg: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center" },
    cropName: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
    mandiRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
    mandiName: { fontSize: 14, color: "#64748B" },
    priceColumn: { alignItems: "flex-end" },
    priceVal: { fontSize: 18, fontWeight: "800", color: "#059669" },
    priceSub: { fontSize: 11, color: "#94A3B8" },
    cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F8FAFC" },
    footerTime: { fontSize: 11, color: "#94A3B8" },
    insightBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#F1F5F9" },
    insightBtnText: { fontSize: 12, fontWeight: "600", color: "#1e3a8a" },
    verifyBadge: { flexDirection: "row", alignItems: "center", backgroundColor: "#059669", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    verifyText: { color: "#fff", fontSize: 10, fontWeight: "700" },
    trustText: { fontSize: 14, color: "#64748B", fontWeight: "600" },
    contactBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#1e3a8a", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, gap: 6 },
    contactBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    empty: { alignItems: "center", marginTop: 100 },
    emptyText: { color: "#94A3B8", fontSize: 16, marginTop: 12 },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, height: "80%", padding: 24 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: "800", color: "#1E293B" },
    modalBody: { flex: 1 },
    profileHeader: { flexDirection: "row", alignItems: "center", gap: 20, marginBottom: 30 },
    profileAvatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#1e3a8a", alignItems: "center", justifyContent: "center" },
    avatarInitial: { color: "#fff", fontSize: 28, fontWeight: "800" },
    profileName: { fontSize: 24, fontWeight: "800", color: "#1E293B" },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
    statusBadge: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, gap: 4 },
    verified: { backgroundColor: "#059669" },
    unverified: { backgroundColor: "#D97706" },
    badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
    statsGrid: { flexDirection: "row", gap: 16, marginBottom: 30 },
    statBox: { flex: 1, backgroundColor: "#F8FAFC", padding: 16, borderRadius: 16 },
    statLabel: { fontSize: 12, color: "#64748B", fontWeight: "700", textTransform: "uppercase", marginBottom: 4 },
    statValue: { fontSize: 15, fontWeight: "700", color: "#1E293B" },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1E293B", marginBottom: 12 },
    listingInfo: { flexDirection: "row", alignItems: "center", backgroundColor: "#EFF6FF", padding: 16, borderRadius: 16, gap: 12 },
    listingText: { flex: 1, color: "#1E40AF", fontSize: 14, lineHeight: 20 },
    modalActionBtn: { height: 60, backgroundColor: "#1e3a8a", borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: 10 },
    modalActionText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
