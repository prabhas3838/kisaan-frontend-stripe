import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { COLORS, Header, Card, StatCard, AdminSidebar } from "../../components/admin/AdminComponents";
import { LineChart, PieChart } from "react-native-chart-kit";
import * as Lucide from "lucide-react-native";
import { adminService } from "../../services/adminService";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function AnalyticsScreen() {
    const [menuVisible, setMenuVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        loadAnalytics("6m");
    }, []);

    const loadAnalytics = async (tf: string = "6m") => {
        try {
            if (!refreshing) setLoading(true);
            const res = await adminService.getAnalytics(tf);
            if (res.success) {
                setData(res.analytics);
            }
        } catch (e) {
            console.error("Load Analytics Error:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    if (loading && !refreshing) {
        return (
            <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <Header title="Analytics" subtitle="Performance & Trends" onMenu={() => setMenuVisible(true)} />
            <AdminSidebar visible={menuVisible} onClose={() => setMenuVisible(false)} />

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAnalytics("6m"); }} />}
            >
                <View style={styles.grid}>
                    <StatCard label="Monthly Revenue" value={`₹${(data?.revenueGrowth?.data?.reduce((a: any, b: any) => a + b, 0) || 0).toFixed(1)}k`} icon="TrendingUp" color={COLORS.primary} trend="+5.4%" trendUp={true} />
                    <StatCard label="Categories" value={data?.categoryDistribution?.length || 0} icon="Layers" color={COLORS.info} />
                </View>

                <View style={s.chartHeader}>
                    <Text style={styles.sectionTitle}>Revenue Trend (in ₹'000)</Text>
                    <TouchableOpacity onPress={() => router.push("/admin/yearly-stats" as any)}>
                        <Text style={s.viewFullLink}>See for year</Text>
                    </TouchableOpacity>
                </View>

                <Card style={styles.chartCard}>
                    {data?.revenueGrowth && (
                        <LineChart
                            data={{
                                labels: data.revenueGrowth.labels,
                                datasets: [{ data: data.revenueGrowth.data }],
                            }}
                            width={width - 72}
                            height={220}
                            chartConfig={{
                                backgroundColor: COLORS.card,
                                backgroundGradientFrom: COLORS.card,
                                backgroundGradientTo: COLORS.card,
                                decimalPlaces: 1,
                                color: (opacity = 1) => COLORS.primary,
                                labelColor: (opacity = 1) => COLORS.textLight,
                                style: { borderRadius: 16 },
                                propsForDots: { r: "6", strokeWidth: "2", stroke: COLORS.primary },
                            }}
                            bezier
                            style={styles.chart}
                        />
                    )}
                </Card>

                <Text style={styles.sectionTitle}>Category Distribution</Text>
                <Card style={styles.chartCard}>
                    {data?.categoryDistribution && (
                        <PieChart
                            data={data.categoryDistribution}
                            width={width - 40}
                            height={200}
                            chartConfig={{ color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})` }}
                            accessor={"population"}
                            backgroundColor={"transparent"}
                            paddingLeft={"15"}
                            center={[10, 0]}
                            absolute
                        />
                    )}
                </Card>

                <Text style={styles.sectionTitle}>Top Selling Products</Text>
                {data?.topProducts?.map((item: any, idx: number) => (
                    <View key={idx} style={styles.topItem}>
                        <Text style={styles.rank}>{idx + 1}</Text>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemVolume}>{item.volume} sold</Text>
                        </View>
                        <Text style={styles.itemSales}>{item.sales}</Text>
                    </View>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: 20 },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text, marginBottom: 12, marginTop: 16 },
    chartCard: { padding: 16, alignItems: 'center' },
    chart: { marginVertical: 8, borderRadius: 16 },
    topItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
    rank: { fontSize: 18, fontWeight: '900', color: COLORS.primary, opacity: 0.5, width: 24 },
    itemName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
    itemVolume: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    itemSales: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
});

const s = StyleSheet.create({
    chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    viewFullLink: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
    toggleContainer: { flexDirection: 'row', backgroundColor: COLORS.border, borderRadius: 20, padding: 2, height: 32 },
    toggleBtn: { paddingHorizontal: 16, justifyContent: 'center', borderRadius: 18 },
    activeToggle: { backgroundColor: COLORS.primary },
    toggleText: { fontSize: 11, fontWeight: '700', color: COLORS.textLight },
    activeToggleText: { color: '#fff' },
});
