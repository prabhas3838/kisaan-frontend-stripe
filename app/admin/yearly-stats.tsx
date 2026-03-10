import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { COLORS, Header, Card, StatCard, AdminSidebar } from "../../components/admin/AdminComponents";
import { LineChart } from "react-native-chart-kit";
import { adminService } from "../../services/adminService";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function YearlyStatsScreen() {
    const [menuVisible, setMenuVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            if (!refreshing) setLoading(true);
            const res = await adminService.getAnalytics("1y");
            if (res.success) {
                setData(res.analytics);
            }
        } catch (e) {
            console.error("Load Yearly Stats Error:", e);
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
            <Header title="Yearly Performance" subtitle={`Last 12 Months Trend`} onMenu={() => setMenuVisible(true)} />
            <AdminSidebar visible={menuVisible} onClose={() => setMenuVisible(false)} />

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
            >
                <Text style={styles.sectionTitle}>Annual Revenue Growth (₹'000)</Text>
                <Card style={styles.chartCard}>
                    {data?.revenueGrowth && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <LineChart
                                data={{
                                    labels: data.revenueGrowth.labels,
                                    datasets: [{ data: data.revenueGrowth.data }],
                                }}
                                width={Math.max(width * 1.5, data.revenueGrowth.labels.length * 60)}
                                height={350}
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
                        </ScrollView>
                    )}
                    <Text style={styles.hint}>Horizontal scroll to see full year trend</Text>
                </Card>

                <View style={styles.summaryContainer}>
                    <StatCard
                        label="Total Revenue (1Y)"
                        value={`₹${(data?.revenueGrowth?.data?.reduce((a: number, b: number) => a + b, 0) || 0).toFixed(1)}k`}
                        icon="TrendingUp"
                        color={COLORS.primary}
                    />
                </View>



                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Back to Analytics</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
    chartCard: { padding: 16, borderRadius: 16, backgroundColor: COLORS.card, marginBottom: 20 },
    chart: { marginVertical: 8, borderRadius: 16 },
    hint: { fontSize: 12, color: COLORS.textLight, textAlign: 'center', marginTop: 10, fontStyle: 'italic' },
    summaryContainer: { marginBottom: 20 },
    infoText: { fontSize: 14, color: COLORS.textLight, lineHeight: 22, textAlign: 'center', marginBottom: 30, paddingHorizontal: 10 },
    backBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    backBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});
