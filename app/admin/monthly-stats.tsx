import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { COLORS, Header, Card, StatCard, AdminSidebar } from "../../components/admin/AdminComponents";
import { BarChart } from "react-native-chart-kit";
import { adminService } from "../../services/adminService";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

export default function MonthlyStatsScreen() {
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
            const res = await adminService.getMonthlyDetail();
            if (res.success) {
                setData(res.data);
            }
        } catch (e) {
            console.error("Load Monthly Stats Error:", e);
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

    const currentMonthName = new Date().toLocaleString('default', { month: 'long' });

    return (
        <View style={styles.root}>
            <Header title="Monthly Stats" subtitle={`${currentMonthName} Breakdown`} onMenu={() => setMenuVisible(true)} />
            <AdminSidebar visible={menuVisible} onClose={() => setMenuVisible(false)} />

            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
            >
                <Text style={styles.sectionTitle}>Daily Revenue (₹'000)</Text>
                <Card style={styles.chartCard}>
                    {data && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart
                                data={{
                                    labels: data.labels,
                                    datasets: [{ data: data.revenue }],
                                }}
                                width={Math.max(width * 2, data.labels.length * 40)}
                                height={300}
                                yAxisLabel="₹"
                                yAxisSuffix="k"
                                chartConfig={{
                                    backgroundColor: COLORS.card,
                                    backgroundGradientFrom: COLORS.card,
                                    backgroundGradientTo: COLORS.card,
                                    decimalPlaces: 1,
                                    color: (opacity = 1) => COLORS.primary,
                                    labelColor: (opacity = 1) => COLORS.textLight,
                                    style: { borderRadius: 16 },
                                    barPercentage: 0.6,
                                }}
                                style={styles.chart}
                                verticalLabelRotation={0}
                                fromZero
                            />
                        </ScrollView>
                    )}
                    <Text style={styles.hint}>Horizontal scroll to see all days</Text>
                </Card>

                <View style={styles.summaryContainer}>
                    <StatCard
                        label="Total for Month"
                        value={`₹${(data?.revenue?.reduce((a: number, b: number) => a + b, 0) || 0).toFixed(1)}k`}
                        icon="TrendingUp"
                        color={COLORS.success}
                    />
                    <StatCard
                        label="Avg. Daily"
                        value={`₹${((data?.revenue?.reduce((a: number, b: number) => a + b, 0) || 0) / (data?.revenue?.filter((v: number) => v > 0).length || 1)).toFixed(1)}k`}
                        icon="Activity"
                        color={COLORS.info}
                    />
                </View>

                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Text style={styles.backBtnText}>Back to Dashboard</Text>
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
    summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    backBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    backBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 }
});
