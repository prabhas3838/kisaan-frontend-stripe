import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from "react-native";
import { COLORS, StatCard, Card, Header, AdminSidebar } from "../../components/admin/AdminComponents";
import { BarChart } from "react-native-chart-kit";
import * as Lucide from "lucide-react-native";
import { useRouter } from "expo-router";
import { adminService } from "../../services/adminService";

const { width } = Dimensions.get("window");

export default function AdminDashboardHome() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [activities, setActivities] = useState<any>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [statsRes, actRes] = await Promise.all([
                adminService.getStats(),
                adminService.getRecentActivities()
            ]);
            if (statsRes.success) setStats(statsRes.stats);
            if (actRes?.success) setActivities(actRes.activities);
        } catch (e) {
            console.error("Home Load Error:", e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <Header title="Admin Panel" subtitle="Agricultural Digital Marketplace" onMenu={() => setMenuVisible(true)} />
            <AdminSidebar visible={menuVisible} onClose={() => setMenuVisible(false)} />

            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.grid}>
                    <StatCard label="Total Farmers" value={stats?.totalFarmers || 0} icon="Users" color={COLORS.primary} trend="+12%" trendUp={true} />
                    <StatCard label="Total Buyers" value={stats?.totalBuyers || 0} icon="ShoppingBag" color={COLORS.info} trend="+5%" trendUp={true} />
                    <StatCard label="Active Listings" value={stats?.activeListings || 0} icon="Package" color={COLORS.warning} trend="+18%" trendUp={true} />
                    <StatCard label="Total Revenue" value={`₹${(stats?.monthlyRevenue / 1000).toFixed(1)}k`} icon="Activity" color={COLORS.success} trend="+8%" trendUp={true} />
                </View>

                {stats?.pendingApprovals > 0 && (
                    <Card style={styles.approvalCard}>
                        <View style={styles.row}>
                            <View>
                                <Text style={styles.approvalTitle}>Pending Approvals</Text>
                                <Text style={styles.approvalCount}>{stats.pendingApprovals} items require attention</Text>
                            </View>
                            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/admin/products")}>
                                <Text style={styles.actionBtnText}>Review</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Weekly Revenue Overview</Text>
                    <TouchableOpacity onPress={() => router.push("/admin/monthly-stats")}>
                        <Text style={styles.viewAll}>See for month</Text>
                    </TouchableOpacity>
                </View>
                <Card style={styles.chartCard}>
                    <BarChart
                        data={{
                            labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                            datasets: [{ data: stats?.weeklyRevenue || [0, 0, 0, 0, 0, 0, 0] }],
                        }}
                        width={width - 72}
                        height={220}
                        yAxisLabel="₹"
                        yAxisSuffix="k"
                        chartConfig={{
                            backgroundColor: COLORS.card,
                            backgroundGradientFrom: COLORS.card,
                            backgroundGradientTo: COLORS.card,
                            decimalPlaces: 0,
                            color: (opacity = 1) => `rgba(27, 94, 32, ${opacity})`,
                            labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
                            style: { borderRadius: 16 },
                            propsForDots: { r: "6", strokeWidth: "2", stroke: COLORS.primary },
                        }}
                        style={styles.chart}
                        verticalLabelRotation={0}
                    />
                </Card>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Activity</Text>
                    <TouchableOpacity onPress={() => router.push("/admin/orders")}><Text style={styles.viewAll}>View Orders</Text></TouchableOpacity>
                </View>

                {activities?.orders?.map((item: any) => (
                    <View key={item.id} style={styles.activityItem}>
                        <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
                        <View style={styles.activityContent}>
                            <Text style={styles.activityUser}>{item.buyer} bought {item.crop}</Text>
                            <Text style={styles.activityDesc}>Amount: ₹{item.amount.toLocaleString()} • from {item.farmer}</Text>
                        </View>
                        <Text style={styles.activityTime}>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                ))}

                {activities?.registrations?.map((item: any) => (
                    <View key={item.id} style={styles.activityItem}>
                        <View style={[styles.dot, { backgroundColor: COLORS.info }]} />
                        <View style={styles.activityContent}>
                            <Text style={styles.activityUser}>New {item.role}: {item.name}</Text>
                            <Text style={styles.activityDesc}>{item.location}</Text>
                        </View>
                        <Text style={styles.activityTime}>Joined</Text>
                    </View>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Quick Actions FAB - Optional but adding for "Premium" feel */}
            <TouchableOpacity style={styles.fab} onPress={() => router.push("/admin/analytics")}>
                <Lucide.PieChart size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: 20 },
    grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 },
    sectionTitle: { fontSize: 17, fontWeight: '800', color: COLORS.text },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 16 },
    viewAll: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
    chartCard: { padding: 16, alignItems: 'center', marginBottom: 20 },
    chart: { marginVertical: 8, borderRadius: 16 },
    approvalCard: { backgroundColor: COLORS.primary, marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    approvalTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
    approvalCount: { color: '#E8F5E9', fontSize: 12, marginTop: 4 },
    actionBtn: { backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    actionBtnText: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
    activityContent: { flex: 1 },
    activityUser: { fontSize: 14, fontWeight: '700', color: COLORS.text },
    activityDesc: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
    activityTime: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
    fab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    }
});
