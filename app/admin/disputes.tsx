import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { COLORS, Header, Badge, Card } from "../../components/admin/AdminComponents";
import * as Lucide from "lucide-react-native";

const MOCK_DISPUTES = [
    { id: "DSP-101", complainant: "Amit Varma", orderId: "ORD-9905", status: "open", issue: "Delayed delivery by 4 days", time: "2h ago", preview: "The farmer mentioned he was waiting for transport..." },
    { id: "DSP-102", complainant: "Fresh Mart", orderId: "ORD-9882", status: "review", issue: "Quality mismatch (C grade received)", time: "5h ago", preview: "I ordered A grade wheat but the moisture content is high..." },
    { id: "DSP-103", complainant: "Suresh Patil", orderId: "ORD-9912", status: "open", issue: "Payment not reflected in bank", time: "1d ago", preview: "The buyer says he paid but I haven't received anything..." },
    { id: "DSP-104", complainant: "Anita Devi", orderId: "ORD-9765", status: "resolved", issue: "Incorrect weight delivered", time: "2d ago", preview: "Issue resolved. Farmer sent the remaining 10kg." },
];

export default function DisputeManagement() {
    const [search, setSearch] = useState("");

    const filtered = MOCK_DISPUTES.filter(d =>
        d.complainant.toLowerCase().includes(search.toLowerCase()) || d.orderId.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }: { item: typeof MOCK_DISPUTES[0] }) => (
        <Card style={styles.disputeCard}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <View style={styles.idRow}>
                        <Text style={styles.disputeId}>{item.id}</Text>
                        <Badge text={item.status} type={item.status === 'open' ? 'danger' : item.status === 'review' ? 'warning' : 'success'} />
                    </View>
                    <Text style={styles.issueTitle}>{item.issue}</Text>
                </View>
                <Text style={styles.time}>{item.time}</Text>
            </View>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <Text style={styles.mLabel}>By</Text>
                    <Text style={styles.mValue}>{item.complainant}</Text>
                </View>
                <View style={styles.metaDivider} />
                <View style={styles.metaItem}>
                    <Text style={styles.mLabel}>Order</Text>
                    <Text style={styles.mValue}>{item.orderId}</Text>
                </View>
            </View>

            <View style={styles.chatPreview}>
                <Lucide.MessageSquare size={14} color={COLORS.textLight} />
                <Text style={styles.previewText} numberOfLines={2}>"{item.preview}"</Text>
            </View>

            <View style={styles.actionRow}>
                <TouchableOpacity style={styles.secondaryBtn}>
                    <Text style={styles.btnTextSecondary}>View Evidence</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn}>
                    <Text style={styles.btnTextPrimary}>Resolve Now</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    return (
        <View style={styles.root}>
            <Header title="Disputes" subtitle="Conflict Resolution Center" showBack={false} />

            <View style={styles.content}>
                <View style={styles.searchBox}>
                    <Lucide.Search size={20} color={COLORS.textLight} />
                    <TextInput
                        placeholder="Search by Order ID or Name..."
                        style={styles.input}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                <FlatList
                    data={filtered}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    content: { flex: 1, paddingHorizontal: 20 },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 20,
    },
    input: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
    list: { paddingBottom: 40 },
    disputeCard: { marginBottom: 16 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    idRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
    disputeId: { fontSize: 12, fontWeight: '800', color: COLORS.textLight },
    issueTitle: { fontSize: 15, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
    time: { fontSize: 11, color: COLORS.textLight, fontWeight: '600' },
    metaRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, padding: 12, borderRadius: 10, marginBottom: 12 },
    metaItem: { flex: 1, gap: 2 },
    mLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textLight, textTransform: 'uppercase' },
    mValue: { fontSize: 13, fontWeight: '700', color: COLORS.text },
    metaDivider: { width: 1, height: 20, backgroundColor: COLORS.border, mx: 12 },
    chatPreview: { flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#F8FAFC', borderRadius: 8, marginBottom: 16 },
    previewText: { fontSize: 12, color: COLORS.textLight, fontStyle: 'italic', flex: 1 },
    actionRow: { flexDirection: 'row', gap: 12 },
    primaryBtn: { flex: 1, backgroundColor: COLORS.primary, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    btnTextPrimary: { color: '#fff', fontWeight: '800', fontSize: 13 },
    secondaryBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    btnTextSecondary: { color: COLORS.text, fontWeight: '800', fontSize: 13 },
});
