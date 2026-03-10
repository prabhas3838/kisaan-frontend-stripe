import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import NavAuto from "../components/navigation/NavAuto";

import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { getWatchlist, removeFromWatchlist, WatchlistItem } from "../services/watchlistService";
import { fetchMandiPrices, MandiPriceDoc } from "../services/mandiService";

export default function WatchlistScreen() {
    const router = useRouter();
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [prices, setPrices] = useState<Record<string, MandiPriceDoc>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const items = await getWatchlist();
            setWatchlist(items);

            // Fetch current prices for watched items
            const priceMap: Record<string, MandiPriceDoc> = {};
            await Promise.all(items.map(async (item) => {
                const res = await fetchMandiPrices({ crop: item.crop, mandi: item.mandi, limit: 1 });
                if (res.data && res.data.length > 0) {
                    priceMap[`${item.crop}-${item.mandi}`] = res.data[0];
                }
            }));
            setPrices(priceMap);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const removeItem = async (id: string) => {
        try {
            await removeFromWatchlist(id);
            setWatchlist(prev => prev.filter(i => i._id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const renderItem = ({ item }: { item: WatchlistItem }) => {
        const priceData = prices[`${item.crop}-${item.mandi}`];

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.cropName}>{item.crop}</Text>
                        <Text style={styles.mandiName}>{item.mandi}</Text>
                    </View>
                    <TouchableOpacity onPress={() => removeItem(item._id)}>
                        <Ionicons name="notifications-off-outline" size={22} color="#EF4444" />
                    </TouchableOpacity>
                </View>

                <View style={styles.priceRow}>
                    <View>
                        <Text style={styles.priceLabel}>Current Price</Text>
                        <Text style={styles.priceValue}>{priceData ? `₹${priceData.pricePerQuintal}` : "Calculating..."}</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.detailsBtn}
                        onPress={() => router.push({ pathname: "/mandi-prices", params: { crop: item.crop } })}
                    >
                        <Text style={styles.detailsBtnText}>View Trends</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.alertNote}>
                    <Ionicons name="information-circle-outline" size={14} color="#3B82F6" />
                    <Text style={styles.alertNoteText}>You will receive SMS alerts for price changes in this mandi.</Text>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ title: "My Watchlist", headerShown: false }} />
            <NavAuto />


            <FlatList
                data={watchlist}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    loading ? (
                        <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
                    ) : (
                        <View style={styles.empty}>
                            <Ionicons name="bookmark-outline" size={60} color="#CBD5E1" />
                            <Text style={styles.emptyTitle}>Your watchlist is empty</Text>
                            <Text style={styles.emptySub}>Add crops from the Mandi Prices screen to get alerts.</Text>
                            <TouchableOpacity
                                style={styles.browseBtn}
                                onPress={() => router.push("/mandi-prices")}
                            >
                                <Text style={styles.browseBtnText}>Browse Prices</Text>
                            </TouchableOpacity>
                        </View>
                    )
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F8FAFC" },
    list: { padding: 16 },
    card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0", elevation: 2 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
    cropName: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
    mandiName: { fontSize: 13, color: "#64748B", marginTop: 2 },

    priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#F1F5F9" },
    priceLabel: { fontSize: 12, color: "#64748B", marginBottom: 4 },
    priceValue: { fontSize: 22, fontWeight: "800", color: "#166534" },

    detailsBtn: { backgroundColor: "#EFF6FF", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    detailsBtnText: { color: "#3B82F6", fontWeight: "bold", fontSize: 13 },

    alertNote: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 6 },
    alertNoteText: { fontSize: 11, color: "#64748B", flex: 1 },

    empty: { alignItems: "center", marginTop: 80, paddingHorizontal: 40 },
    emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#334155", marginTop: 16 },
    emptySub: { fontSize: 14, color: "#64748B", textAlign: "center", marginTop: 8, lineHeight: 20 },
    browseBtn: { marginTop: 24, backgroundColor: "#3B82F6", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    browseBtnText: { color: "#fff", fontWeight: "bold" },
});
