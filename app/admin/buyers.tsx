import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Modal, ScrollView } from "react-native";
import { COLORS, Header, Badge, Card, AdminSidebar } from "../../components/admin/AdminComponents";
import * as Lucide from "lucide-react-native";
import { adminService } from "../../services/adminService";

export default function BuyerManagement() {
    const [search, setSearch] = useState("");
    const [buyers, setBuyers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedBuyer, setSelectedBuyer] = useState<any>(null);
    const [profileVisible, setProfileVisible] = useState(false);

    useEffect(() => {
        loadBuyers();
    }, []);

    const loadBuyers = async () => {
        try {
            setLoading(true);
            const res = await adminService.getUsers("buyer");
            if (res.success) {
                setBuyers(res.users || []);
            }
        } catch (e) {
            console.error("Load Buyers Error:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filtered = buyers.filter(b =>
        b.name?.toLowerCase().includes(search.toLowerCase()) || b.role?.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }: { item: any }) => (
        <Card style={styles.buyerCard}>
            <View style={styles.cardHeader}>
                <View style={styles.iconBox}>
                    <Lucide.ShoppingBag size={24} color={COLORS.primary} />
                    {item.verificationStatus === 'approved' && (
                        <View style={styles.verifiedBadge}>
                            <Lucide.Check size={8} color="#fff" strokeWidth={5} />
                        </View>
                    )}
                </View>
                <View style={styles.headerInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.buyerName}>{item.name}</Text>
                    </View>
                    <Text style={styles.buyerType}>{item.role?.toUpperCase()} • {item.location || "Location not set"}</Text>
                </View>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Contact</Text>
                    <Text style={styles.statValue}>{item.phone}</Text>
                </View>
                <View style={styles.stat}>
                    <Text style={styles.statLabel}>Status</Text>
                    <Badge text={item.verificationStatus || "none"} type={item.verificationStatus === 'approved' ? 'success' : item.verificationStatus === 'pending' ? 'warning' : 'danger'} />
                </View>
                <View style={[styles.stat, { alignItems: 'flex-end' }]}>
                    <Text style={styles.statLabel}>Trust Score</Text>
                    <Text style={styles.statValue}>{item.trustScore}/10</Text>
                </View>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.secondaryBtn}>
                    <Lucide.MessageSquare size={16} color={COLORS.primary} />
                    <Text style={styles.btnTextSecondary}>Contact</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={() => { setSelectedBuyer(item); setProfileVisible(true); }}
                >
                    <Text style={styles.btnTextPrimary}>View Profile</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={styles.root}>
            <Header title="Buyers" subtitle="Manage Consumer Accounts" onMenu={() => setMenuVisible(true)} />
            <AdminSidebar visible={menuVisible} onClose={() => setMenuVisible(false)} />

            <View style={styles.content}>
                <View style={styles.searchBox}>
                    <Lucide.Search size={20} color={COLORS.textLight} />
                    <TextInput
                        placeholder="Search buyers or business type..."
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
                        keyExtractor={item => item._id}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBuyers(); }} />
                        }
                    />
                )}
            </View>

            <Modal visible={profileVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Buyer Profile</Text>
                            <TouchableOpacity onPress={() => setProfileVisible(false)}>
                                <Lucide.X size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScroll}>
                            <View style={styles.profileHeader}>
                                <View style={styles.avatarLarge}>
                                    <Text style={styles.avatarText}>{selectedBuyer?.name?.charAt(0)}</Text>
                                </View>
                                <Text style={styles.profileName}>{selectedBuyer?.name}</Text>
                                <Text style={styles.profileRole}>{selectedBuyer?.role?.toUpperCase()}</Text>
                            </View>

                            <View style={styles.detailSection}>
                                <Text style={styles.detailLabel}>Contact Information</Text>
                                <View style={styles.detailItem}>
                                    <Text style={styles.dLabel}>Phone</Text>
                                    <Text style={styles.dValue}>{selectedBuyer?.phone}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <Text style={styles.dLabel}>Location</Text>
                                    <Text style={styles.dValue}>{selectedBuyer?.location || "Not set"}</Text>
                                </View>
                            </View>

                            <View style={styles.detailSection}>
                                <Text style={styles.detailLabel}>Account Summary</Text>
                                <View style={styles.statsGrid}>
                                    <View style={styles.miniStat}>
                                        <Text style={styles.dLabel}>Trust Score</Text>
                                        <Text style={styles.dValue}>{selectedBuyer?.trustScore}/10</Text>
                                    </View>
                                    <View style={styles.miniStat}>
                                        <Text style={styles.dLabel}>Status</Text>
                                        <Text style={[styles.dValue, { color: selectedBuyer?.verificationStatus === 'approved' ? COLORS.success : COLORS.warning }]}>
                                            {selectedBuyer?.verificationStatus?.toUpperCase() || "NONE"}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={[styles.footerBtn, { backgroundColor: COLORS.primary }]}
                                onPress={() => setProfileVisible(false)}
                            >
                                <Text style={styles.btnTextPrimary}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    content: { flex: 1, paddingHorizontal: 20 },
    searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 12, paddingHorizontal: 12, height: 50, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
    input: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
    list: { paddingBottom: 40 },
    buyerCard: { marginBottom: 16 },
    cardHeader: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
    verifiedBadge: { position: 'absolute', bottom: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    headerInfo: { flex: 1, marginLeft: 12 },
    buyerName: { fontSize: 16, fontWeight: '800', color: COLORS.text },
    buyerType: { fontSize: 12, color: COLORS.textLight, marginTop: 2, fontWeight: '600' },
    statusToggle: { padding: 4 },
    toggleTrack: { width: 36, height: 20, borderRadius: 10, padding: 2, justifyContent: 'center' },
    toggleCircle: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#fff' },
    statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.background, padding: 12, borderRadius: 12, marginVertical: 16 },
    stat: { gap: 2 },
    statLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase' },
    statValue: { fontSize: 14, fontWeight: '800', color: COLORS.text },
    actionRow: { flexDirection: 'row', gap: 12 },
    primaryBtn: { flex: 1, backgroundColor: COLORS.primary, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    btnTextPrimary: { color: '#fff', fontWeight: '800', fontSize: 13 },
    secondaryBtn: { flex: 1, flexDirection: 'row', gap: 6, borderWidth: 1, borderColor: COLORS.primary, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    btnTextSecondary: { color: COLORS.primary, fontWeight: '800', fontSize: 13 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    modalScroll: { marginBottom: 20 },
    profileHeader: { alignItems: 'center', marginBottom: 24 },
    avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    avatarText: { color: '#fff', fontSize: 32, fontWeight: '800' },
    profileName: { fontSize: 20, fontWeight: '800', color: COLORS.text },
    profileRole: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, marginTop: 4 },
    detailSection: { marginBottom: 24 },
    detailLabel: { fontSize: 12, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    detailItem: { marginBottom: 12 },
    statsGrid: { flexDirection: 'row', gap: 12 },
    miniStat: { flex: 1, backgroundColor: COLORS.background, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
    dLabel: { fontSize: 10, color: COLORS.textLight, fontWeight: '700', textTransform: 'uppercase' },
    dValue: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginTop: 2 },
    modalFooter: { paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
    footerBtn: { height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
