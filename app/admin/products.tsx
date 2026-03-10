import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Dimensions, ActivityIndicator, ScrollView, RefreshControl } from "react-native";
import { COLORS, Header, Badge, Card, AdminSidebar } from "../../components/admin/AdminComponents";
import * as Lucide from "lucide-react-native";
import { adminService } from "../../services/adminService";

export default function ProductMonitoring() {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    const categories = ["All", "Grains", "Vegetables", "Fruits", "Spices"];

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const res = await adminService.getListings();
            if (res.success) {
                // If it's the auctions endpoint, data is in 'data'
                setProducts(res.data || res.inventory || []);
            }
        } catch (e) {
            console.error("Load Products Error:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filtered = products.filter(p => {
        const name = (p.cropType || p.crop || "").toLowerCase();
        const farmer = (p.farmerId?.name || "Farmer").toLowerCase();
        const matchesSearch = name.includes(search.toLowerCase()) || farmer.includes(search.toLowerCase());
        const matchesCategory = activeCategory === "All" || p.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const renderItem = ({ item }: { item: any }) => (
        <Card style={styles.productCard}>
            <View style={styles.imagePlaceholder}>
                <Lucide.Package size={32} color={COLORS.border} />
                <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{item.cropType || item.crop}</Text>
                </View>
            </View>

            <View style={styles.productInfo}>
                <View style={styles.infoRow}>
                    <Text style={styles.productName} numberOfLines={1}>{item.cropType || item.crop}</Text>
                    <Badge text={item.status} type={item.status === 'ACTIVE' ? 'success' : 'warning'} />
                </View>
                <Text style={styles.farmerName}>by {item.farmerId?.name || "Farmer"}</Text>

                <View style={styles.priceStockRow}>
                    <View>
                        <Text style={styles.pLabel}>Price</Text>
                        <Text style={styles.pValue}>₹{item.price || item.basePrice || 0}/kg</Text>
                    </View>
                    <View>
                        <Text style={styles.pLabel}>Quantity</Text>
                        <Text style={styles.pValue}>{item.quantity || item.quantityKg || 0}kg</Text>
                    </View>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.actionIconBtn}>
                        <Lucide.AlertTriangle size={18} color={COLORS.warning} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionIconBtn}>
                        <Lucide.Trash2 size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.manageBtn}>
                        <Text style={styles.manageText}>Audit</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    return (
        <View style={styles.root}>
            <Header title="Products" subtitle="Marketplace Monitoring" onMenu={() => setMenuVisible(true)} />
            <AdminSidebar visible={menuVisible} onClose={() => setMenuVisible(false)} />

            <View style={styles.content}>
                <View style={styles.searchBox}>
                    <Lucide.Search size={20} color={COLORS.textLight} />
                    <TextInput
                        placeholder="Search products or farmers..."
                        style={styles.input}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                    {categories.map(c => (
                        <TouchableOpacity
                            key={c}
                            style={[styles.catBtn, activeCategory === c && styles.catBtnActive]}
                            onPress={() => setActiveCategory(c)}
                        >
                            <Text style={[styles.catText, activeCategory === c && styles.catTextActive]}>{c}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : (
                    <FlatList
                        data={filtered}
                        keyExtractor={item => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProducts(); }} />
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
    searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
    input: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
    catScroll: { marginBottom: 16, maxHeight: 40 },
    catBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
    catBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    catText: { fontSize: 13, fontWeight: '700', color: COLORS.textLight },
    catTextActive: { color: '#fff' },
    list: { paddingBottom: 40 },
    productCard: { flexDirection: 'row', marginBottom: 16, padding: 12 },
    imagePlaceholder: { width: 100, height: 120, borderRadius: 12, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    categoryTag: { position: 'absolute', top: 6, left: 6, backgroundColor: COLORS.secondary + '30', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    categoryText: { fontSize: 9, fontWeight: '900', color: COLORS.primary },
    productInfo: { flex: 1, marginLeft: 16 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    productName: { fontSize: 15, fontWeight: '800', color: COLORS.text, flex: 1 },
    farmerName: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontWeight: '600' },
    priceStockRow: { flexDirection: 'row', gap: 24, marginVertical: 12 },
    pLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase' },
    pValue: { fontSize: 14, fontWeight: '800', color: COLORS.text, marginTop: 2 },
    actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    actionIconBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    manageBtn: { flex: 1, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.primary, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    manageText: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
});
