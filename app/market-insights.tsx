import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import NavAuto from "../components/navigation/NavAuto";

import {
    FlatList,
    StyleSheet,
    Text,
    View,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    Pressable,
} from "react-native";
import { fetchMandiPrices, MandiPriceDoc } from "../services/mandiService";

/**
 * Market Insights Page
 * Shows price trends and best prices across mandis.
 */

export default function MarketInsightsScreen() {
    const [prices, setPrices] = useState<MandiPriceDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState<any>("Tomato");

    const crops = ["Tomato", "Onion", "Potato", "Wheat", "Rice"];

    const loadPrices = async () => {
        try {
            const res = await fetchMandiPrices({ crop: selectedCrop as any, sort: "price_desc" });
            if (res.data && Array.isArray(res.data)) {
                setPrices(res.data);
            }
        } catch (e) {
            console.log("Error loading market insights:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadPrices();
    }, [selectedCrop]);

    const onRefresh = () => {
        setRefreshing(true);
        loadPrices();
    };

    const renderItem = ({ item, index }: { item: MandiPriceDoc, index: number }) => (
        <View style={[styles.priceCard, index === 0 && styles.bestPriceCard]}>
            {index === 0 && (
                <View style={styles.bestLabel}>
                    <Ionicons name="star" size={10} color="#fff" />
                    <Text style={styles.bestLabelText}>Best Price</Text>
                </View>
            )}
            <View style={styles.priceRow}>
                <View style={styles.mandiInfo}>
                    <Text style={styles.mandiName}>{item.mandi || "Local Mandi"}</Text>
                    <Text style={styles.locationName}>{item.locationName || "Unknown"}</Text>
                </View>
                <View style={styles.priceInfo}>
                    <Text style={[styles.priceValue, index === 0 && styles.bestPriceValue]}>₹{item.pricePerQuintal}</Text>
                    <Text style={styles.priceUnit}>per quintal</Text>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                title: "Price Insights",
                headerShadowVisible: false,
                headerShown: false,
            }} />
            <NavAuto />


            {/* Crop Selector */}
            <View style={{ height: 60 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropSelector}>
                    {crops.map(c => (
                        <Pressable
                            key={c}
                            onPress={() => setSelectedCrop(c)}
                            style={[styles.cropBtn, selectedCrop === c && styles.cropBtnActive]}
                        >
                            <Text style={[styles.cropBtnText, selectedCrop === c && styles.cropBtnTextActive]}>{c}</Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1e3a8a" />
                </View>
            ) : (
                <FlatList
                    data={prices}
                    keyExtractor={(item, idx) => item._id || String(idx)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="analytics-outline" size={64} color="#e2e8f0" />
                            <Text style={styles.emptyTitle}>No Data Available</Text>
                            <Text style={styles.emptySub}>We don't have recent prices for this crop yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    cropSelector: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: "#fff",
    },
    cropBtn: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#f1f5f9",
        marginRight: 10,
        height: 36,
    },
    cropBtnActive: {
        backgroundColor: "#1e3a8a",
    },
    cropBtnText: {
        color: "#64748b",
        fontWeight: "600",
    },
    cropBtnTextActive: {
        color: "#fff",
    },
    list: {
        padding: 16,
    },
    priceCard: {
        backgroundColor: "#f8fafc",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#f1f5f9",
    },
    bestPriceCard: {
        borderColor: "#10b981",
        backgroundColor: "#ecfdf5",
        borderWidth: 2,
    },
    bestLabel: {
        position: "absolute",
        top: -10,
        right: 16,
        backgroundColor: "#10b981",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
    },
    bestLabelText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "800",
        marginLeft: 4,
    },
    priceRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    mandiInfo: {
        flex: 1,
    },
    mandiName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
    },
    locationName: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
    },
    priceInfo: {
        alignItems: "flex-end",
    },
    priceValue: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1e3a8a",
    },
    bestPriceValue: {
        color: "#047857",
    },
    priceUnit: {
        fontSize: 10,
        color: "#94a3b8",
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 80,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#334155",
        marginTop: 16,
    },
    emptySub: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
        marginTop: 8,
    },
});

