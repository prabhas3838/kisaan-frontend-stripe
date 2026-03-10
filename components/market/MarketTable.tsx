import React from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MandiPriceDoc } from '../../services/mandiService';

interface TableProps {
    data: MandiPriceDoc[];
    loading: boolean;
    refreshing: boolean;
    onRefresh: () => void;
    error: string | null;
}

export const MarketTable: React.FC<TableProps> = ({
    data, loading, refreshing, onRefresh, error
}) => {
    const renderItem = ({ item }: { item: MandiPriceDoc }) => (
        <View style={styles.row}>
            <View style={styles.cropCol}>
                <Text style={styles.cropName}>{item.crop}</Text>
                <Text style={styles.date}>{item.date ? new Date(item.date).toLocaleDateString() : 'Today'}</Text>
            </View>
            <View style={styles.mandiCol}>
                <Text style={styles.mandiName} numberOfLines={1}>
                    {item.locationName || item.mandi || 'Unknown'}
                </Text>
                <View style={styles.updateRow}>
                    <Ionicons name="time-outline" size={10} color="#94A3B8" />
                    <Text style={styles.updateTime}>
                        {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '---'}
                    </Text>
                </View>
            </View>
            <View style={styles.priceCol}>
                <View style={styles.priceRow}>
                    <Text style={styles.price}>₹{item.pricePerQuintal}</Text>
                    {/* Simple Trend (Randomized placeholder or logic if available) */}
                    <Ionicons
                        name={item.isBestPrice ? "trending-up" : "trending-down"}
                        size={14}
                        color={item.isBestPrice ? "#16A34A" : "#94A3B8"}
                    />
                </View>
                <Text style={styles.unit}>per quintal</Text>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading market data...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.headerText, styles.cropCol]}>Crop</Text>
                <Text style={[styles.headerText, styles.mandiCol]}>Market</Text>
                <Text style={[styles.headerText, styles.priceCol, { textAlign: 'right' }]}>Price</Text>
            </View>

            <FlatList
                data={data}
                keyExtractor={(item) => item._id}
                renderItem={renderItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name={error ? "alert-circle-outline" : "file-tray-outline"} size={48} color="#CBD5E1" />
                        <Text style={styles.emptyText}>{error || "No data found for selected filters."}</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        backgroundColor: '#F8FAFC',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    headerText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    cropCol: { flex: 2 },
    mandiCol: { flex: 2.5 },
    priceCol: { flex: 1.5, alignItems: 'flex-end' },
    cropName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
    date: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
    mandiName: { fontSize: 13, color: '#475569', fontWeight: '500' },
    updateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    updateTime: { fontSize: 10, color: '#94A3B8' },
    priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    price: { fontSize: 16, fontWeight: '800', color: '#166534' },
    unit: { fontSize: 9, color: '#94A3B8' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    loadingText: { marginTop: 12, color: '#64748B', fontSize: 14 },
    empty: { padding: 40, alignItems: 'center' },
    emptyText: { marginTop: 12, color: '#94A3B8', textAlign: 'center', fontSize: 14 },
});
