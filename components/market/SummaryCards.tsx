import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SummaryProps {
    totalCrops: number;
    highestPrice: number;
    lowestPrice: number;
    avgPrice: number;
}

export const SummaryCards: React.FC<SummaryProps> = ({
    totalCrops, highestPrice, lowestPrice, avgPrice
}) => {
    return (
        <View style={styles.container}>
            <View style={[styles.card, { backgroundColor: '#EFF6FF', borderLeftColor: '#2563EB' }]}>
                <Text style={styles.label}>Total Crops</Text>
                <Text style={[styles.value, { color: '#2563EB' }]}>{totalCrops}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#F0FDF4', borderLeftColor: '#16A34A' }]}>
                <Text style={styles.label}>Highest Price</Text>
                <Text style={[styles.value, { color: '#16A34A' }]}>₹{highestPrice}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#FEF2F2', borderLeftColor: '#DC2626' }]}>
                <Text style={styles.label}>Lowest Price</Text>
                <Text style={[styles.value, { color: '#DC2626' }]}>₹{lowestPrice}</Text>
            </View>
            <View style={[styles.card, { backgroundColor: '#F5F3FF', borderLeftColor: '#7C3AED' }]}>
                <Text style={styles.label}>Avg Price</Text>
                <Text style={[styles.value, { color: '#7C3AED' }]}>₹{Math.round(avgPrice)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    card: {
        flex: 1,
        minWidth: '45%',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    label: {
        fontSize: 11,
        color: '#64748B',
        fontWeight: 'BOLD' as any,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    value: {
        fontSize: 18,
        fontWeight: '800',
    },
});
