import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { COLORS, Header, Badge, Card, AdminSidebar } from "../../components/admin/AdminComponents";
import * as Lucide from "lucide-react-native";
import { adminService } from "../../services/adminService";

export default function OrderManagement() {
    const [search, setSearch] = useState("");
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const res = await adminService.getAllOrders();
            if (res.success) {
                setOrders(res.orders || []);
            }
        } catch (e) {
            console.error("Load Orders Error:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filtered = orders.filter(o =>
        o.id.toLowerCase().includes(search.toLowerCase()) || o.buyer.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusType = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'paid' || s === 'delivered' || s === 'accepted') return 'success';
        if (s === 'pending' || s === 'processing' || s === 'shipped') return 'warning';
        if (s === 'failed' || s === 'cancelled' || s === 'rejected' || s === 'expired') return 'danger';
        return 'info';
    };

    const renderItem = ({ item }: { item: any }) => (
        <Card style={styles.orderCard}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.orderId}>#{item.id}</Text>
                    <Text style={styles.orderDate}>{item.date}</Text>
                </View>
                <Text style={styles.totalAmount}>₹{item.total.toLocaleString()}</Text>
            </View>

            <View style={styles.participants}>
                <View style={styles.participant}>
                    <View style={[styles.pIcon, { backgroundColor: COLORS.info + '15' }]}><Lucide.User size={14} color={COLORS.info} /></View>
                    <View>
                        <Text style={styles.pLabel}>Buyer</Text>
                        <Text style={styles.pName}>{item.buyer}</Text>
                    </View>
                </View>
                <View style={styles.path} />
                <View style={styles.participant}>
                    <View style={[styles.pIcon, { backgroundColor: COLORS.primary + '15' }]}><Lucide.Leaf size={14} color={COLORS.primary} /></View>
                    <View>
                        <Text style={styles.pLabel}>Farmer</Text>
                        <Text style={styles.pName}>{item.farmer}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.statusRow}>
                <View style={styles.statusGroup}>
                    <Text style={styles.sLabel}>Payment</Text>
                    <Badge text={item.payStatus} type={getStatusType(item.payStatus)} />
                </View>
                <View style={styles.statusGroup}>
                    <Text style={styles.sLabel}>Delivery</Text>
                    <Badge text={item.delStatus} type={getStatusType(item.delStatus)} />
                </View>
                <TouchableOpacity style={styles.expandBtn}>
                    <Lucide.ChevronRight size={20} color={COLORS.textLight} />
                </TouchableOpacity>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.resolveBtn}>
                    <Text style={styles.resolveText}>View Logistics</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={styles.root}>
            <Header title="Orders" subtitle="Transaction Management" onMenu={() => setMenuVisible(true)} />
            <AdminSidebar visible={menuVisible} onClose={() => setMenuVisible(false)} />

            <View style={styles.content}>
                <View style={styles.searchBox}>
                    <Lucide.Search size={20} color={COLORS.textLight} />
                    <TextInput
                        placeholder="Search by Order ID or Buyer name..."
                        style={styles.input}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} />
                        }
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    content: { flex: 1, paddingHorizontal: 20 },
    searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
    input: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
    list: { paddingBottom: 40 },
    orderCard: { marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    orderId: { fontSize: 15, fontWeight: '800', color: COLORS.text },
    orderDate: { fontSize: 11, color: COLORS.textLight, marginTop: 2, fontWeight: '600' },
    totalAmount: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
    participants: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, backgroundColor: COLORS.background, padding: 12, borderRadius: 12 },
    participant: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    pIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    pLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase' },
    pName: { fontSize: 13, fontWeight: '700', color: COLORS.text },
    path: { width: 1, height: 20, backgroundColor: COLORS.border, marginHorizontal: 12 },
    statusRow: { flexDirection: 'row', gap: 20, alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    statusGroup: { gap: 4 },
    sLabel: { fontSize: 10, fontWeight: '800', color: COLORS.textLight },
    expandBtn: { marginLeft: 'auto' },
    actionRow: { marginTop: 12 },
    resolveBtn: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
    resolveText: { color: COLORS.text, fontWeight: '700', fontSize: 13 },
});
