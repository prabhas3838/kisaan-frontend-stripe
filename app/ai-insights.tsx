import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    RefreshControl
} from "react-native";
import { Svg, Polyline, Line, Circle } from "react-native-svg";
import NavFarmer from "../components/navigation/NavFarmer";
import { apiFetch } from "../services/http";
import { ENDPOINTS } from "../services/api";
import { getProfile } from "../services/userServices";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type PricePoint = {
    date: string;
    price: number;
};

type ForecastData = {
    historical: PricePoint[];
    predicted: PricePoint[];
    recommendation: string;
};

export default function AIInsightsScreen() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ForecastData | null>(null);
    const [crop, setCrop] = useState("Wheat");
    const [mandi, setMandi] = useState("Azadpur Mandi");

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        const initialize = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const profileRes = await getProfile();

                if (profileRes?.success) {
                    const user = profileRes.user;
                    if (user.location) setMandi(user.location);

                    // Try to find recent crop from auctions
                    const auctionsRes = await fetch(`${ENDPOINTS.AUCTIONS.GET_ALL}?status=ALL`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (auctionsRes.ok) {
                        const all = await auctionsRes.json();
                        const mine = all.filter((a: any) => String(a.farmerId?._id || a.farmerId) === String(user._id));
                        if (mine.length > 0) {
                            setCrop(mine[0].crop);
                        }
                    }
                }
            } catch (e) {
                console.log("AI Insights initialization error:", e);
            }
        };
        initialize();
    }, []);

    const loadForecast = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);
            const query = `?crop=${encodeURIComponent(crop)}&mandi=${encodeURIComponent(mandi)}&days=7`;
            const res = await apiFetch<any>(ENDPOINTS.ANALYTICS.FORECAST + query);
            if (res.success) {
                setData(res.data);
            }
        } catch (e) {
            console.error("Forecast Error:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (crop && mandi) {
            loadForecast();
        }
    }, [crop, mandi]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        loadForecast(true);
    }, [crop, mandi]);

    // Graph points calculation
    const getHistoricalPoints = () => {
        if (!data || data.historical.length < 2) return "";
        const allPrices = [...data.historical.map(p => p.price), ...data.predicted.map(p => p.price)];
        const max = Math.max(...allPrices);
        const min = Math.min(...allPrices);
        const range = max - min || 1;

        const chartWidth = SCREEN_WIDTH - 80;
        const sliceWidth = chartWidth / (data.historical.length + data.predicted.length - 1);

        return data.historical.map((p, i) => {
            const x = i * sliceWidth;
            const y = 80 - ((p.price - min) / range) * 60;
            return `${x},${y}`;
        }).join(" ");
    };

    const getPredictedPoints = () => {
        if (!data || data.predicted.length < 1) return "";
        const allPrices = [...data.historical.map(p => p.price), ...data.predicted.map(p => p.price)];
        const max = Math.max(...allPrices);
        const min = Math.min(...allPrices);
        const range = max - min || 1;

        const chartWidth = SCREEN_WIDTH - 80;
        const totalPoints = data.historical.length + data.predicted.length;
        const sliceWidth = chartWidth / (totalPoints - 1);

        // Start from the last historical point
        const historical = data.historical;
        const lastH = historical[historical.length - 1];
        const startX = (historical.length - 1) * sliceWidth;
        const startY = 80 - ((lastH.price - min) / range) * 60;

        let points = `${startX},${startY} `;

        points += data.predicted.map((p, i) => {
            const x = (historical.length + i) * sliceWidth;
            const y = 80 - ((p.price - min) / range) * 60;
            return `${x},${y}`;
        }).join(" ");

        return points;
    };

    const peakInfo = React.useMemo(() => {
        if (!data) return null;
        const maxPrice = Math.max(...data.predicted.map(p => p.price));
        const day = data.predicted.find(p => p.price === maxPrice);

        // Simple date format: "15 Mar"
        let dateStr = day?.date || "";
        try {
            const dateObj = new Date(dateStr);
            dateStr = dateObj.toLocaleDateString("en-IN", { day: 'numeric', month: 'short' });
        } catch (e) { }

        return { price: maxPrice, date: dateStr };
    }, [data]);

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />
            <NavFarmer />

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Text style={styles.title} numberOfLines={1}>Market Price Guide</Text>
                    <Text style={styles.subtitle} numberOfLines={2}>See when to sell your {crop} in {mandi} for more profit</Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} />
                ) : !data ? (
                    <Text style={styles.errorText}>Could not load prices. Try again later.</Text>
                ) : (
                    <View>
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle} numberOfLines={1}>Price Trend</Text>
                                <View style={styles.legend}>
                                    <View style={[styles.dot, { backgroundColor: "#3B82F6" }]} />
                                    <Text style={styles.legendText}>Past</Text>
                                    <View style={[styles.dot, { backgroundColor: "#10B981", marginLeft: 10 }]} />
                                    <Text style={styles.legendText}>Future</Text>
                                </View>
                            </View>

                            <View style={styles.chartContainer}>
                                <Svg height="100" width="100%">
                                    <Polyline
                                        points={getHistoricalPoints()}
                                        fill="none"
                                        stroke="#3B82F6"
                                        strokeWidth="3"
                                    />
                                    <Polyline
                                        points={getPredictedPoints()}
                                        fill="none"
                                        stroke="#10B981"
                                        strokeWidth="3"
                                        strokeDasharray="5,5"
                                    />
                                    {(() => {
                                        if (!data) return null;
                                        const chartWidth = SCREEN_WIDTH - 80;
                                        const totalPoints = data.historical.length + data.predicted.length;
                                        const sliceWidth = chartWidth / (totalPoints - 1);
                                        const x = (data.historical.length - 1) * sliceWidth;
                                        return (
                                            <Line x1={x} y1="0" x2={x} y2="100" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2,2" />
                                        );
                                    })()}
                                </Svg>
                                <View style={styles.chartLabels}>
                                    <Text style={styles.chartLabelText}>Last 30 Days</Text>
                                    <View style={{ alignItems: 'center' }}>
                                        <Text style={[styles.chartLabelText, { fontWeight: 'bold', color: '#64748B' }]}>Today</Text>
                                    </View>
                                    <Text style={styles.chartLabelText}>Next 7 Days</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.forecastGrid}>
                            <View style={[styles.forecastCard, { backgroundColor: "#DBEAFE" }]}>
                                <Text style={styles.forecastLabel}>Best Price</Text>
                                <Text style={styles.forecastValue}>₹{peakInfo?.price?.toFixed(0)}</Text>
                                <Text style={styles.forecastSub}>Likely on {peakInfo?.date}</Text>
                            </View>
                            <View style={[styles.forecastCard, { backgroundColor: "#DCFCE7" }]}>
                                <Text style={styles.forecastLabel}>Market Trend</Text>
                                <Text style={styles.forecastValue}>
                                    {data.predicted[data.predicted.length - 1].price > data.historical[data.historical.length - 1].price ? "Going Up" : "Going Down"}
                                </Text>
                                <Text style={styles.forecastSub}>Next 7 days</Text>
                            </View>
                        </View>

                        <View style={styles.adviceCard}>
                            <View style={styles.adviceHeader}>
                                <Ionicons name="bulb" size={24} color="#F59E0B" />
                                <Text style={styles.adviceTitle}>Advice for You</Text>
                            </View>
                            <Text style={styles.adviceText}>
                                {data.recommendation}
                            </Text>
                            <TouchableOpacity style={styles.actionBtn}>
                                <Text style={styles.actionBtnText}>See Local Markets</Text>
                                <Ionicons name="arrow-forward" size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.weatherStrip}>
                            <Ionicons name="cloudy-night" size={24} color="#3B82F6" />
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.weatherTitle}>Tip from Kisaan Saathi</Text>
                                <Text style={styles.weatherDesc}>These prices are estimated based on market patterns. Use them as a guide for your sales.</Text>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}



const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F8FAFC" },
    content: { padding: 16, paddingBottom: 40 },
    header: { marginBottom: 24, marginTop: 10 },
    title: { fontSize: 24, fontWeight: "bold", color: "#0F172A" },
    subtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },

    card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: "#E2E8F0" },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    cardTitle: { fontSize: 16, fontWeight: "bold", color: "#334155" },
    legend: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 10, color: '#94A3B8', marginLeft: 4 },

    chartContainer: { height: 120, justifyContent: "center", paddingHorizontal: 10, marginTop: 10 },
    chartLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
    chartLabelText: { fontSize: 10, color: "#94A3B8" },

    forecastGrid: { flexDirection: "row", gap: 12, marginBottom: 20 },
    forecastCard: { flex: 1, padding: 16, borderRadius: 16, gap: 4 },
    forecastLabel: { fontSize: 11, color: "#1E3A8A", textTransform: "uppercase", fontWeight: "600" },
    forecastValue: { fontSize: 18, fontWeight: "bold", color: "#1E3A8A" },
    forecastSub: { fontSize: 11, color: "#1D4ED8" },

    adviceCard: { backgroundColor: "#FFFBEB", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "#FEF3C7", marginBottom: 20 },
    adviceHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    adviceTitle: { fontSize: 18, fontWeight: "bold", color: "#92400E" },
    adviceText: { fontSize: 14, color: "#92400E", lineHeight: 22 },
    actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#D97706", padding: 12, borderRadius: 12, marginTop: 16, gap: 8 },
    actionBtnText: { color: "#fff", fontWeight: "bold" },

    weatherStrip: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#E2E8F0" },
    weatherTitle: { fontSize: 14, fontWeight: "bold", color: "#0F172A" },
    weatherDesc: { fontSize: 12, color: "#64748B", marginTop: 2 },
    errorText: { textAlign: 'center', marginTop: 40, color: '#DC2626', fontWeight: 'bold' }
});
