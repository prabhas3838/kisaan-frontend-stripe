import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';

interface FilterProps {
    selectedMarket: string;
    onMarketChange: (market: string) => void;
    markets: string[];
    sortOrder: 'price_asc' | 'price_desc' | 'latest';
    onSortChange: (sort: 'price_asc' | 'price_desc' | 'latest') => void;
}

export const FilterBar: React.FC<FilterProps> = ({
    selectedMarket, onMarketChange, markets,
    sortOrder, onSortChange,
}) => {
    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <View style={styles.flex1}>
                    <Text style={styles.label}>Market</Text>
                    <View style={styles.pickerWrap}>
                        <Picker
                            selectedValue={selectedMarket}
                            onValueChange={(itemValue) => onMarketChange(itemValue)}
                            style={styles.picker}
                            mode="dropdown"
                            dropdownIconColor="#3B82F6"
                        >
                            <Picker.Item label="All Markets" value="All" />
                            {markets.map(m => (
                                <Picker.Item key={m} label={m} value={m} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.flex1}>
                    <Text style={styles.label}>Sort By</Text>
                    <View style={styles.pickerWrap}>
                        <Picker
                            selectedValue={sortOrder}
                            onValueChange={(itemValue) => onSortChange(itemValue)}
                            style={styles.picker}
                            mode="dropdown"
                            dropdownIconColor="#3B82F6"
                        >
                            <Picker.Item label="Latest First" value="latest" />
                            <Picker.Item label="Price: High to Low" value="price_desc" />
                            <Picker.Item label="Price: Low to High" value="price_asc" />
                        </Picker>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    flex1: { flex: 1 },
    label: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '700',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    pickerWrap: {
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        height: 50, // Increased from 44 to 50
        justifyContent: 'center',
    },
    picker: {
        height: 50, // Increased from 44 to 50
        width: '100%',
        color: '#0F172A',
        ...Platform.select({
            android: {
                backgroundColor: 'transparent',
                // Android Pickers often have internal padding that causes cutoff
                marginLeft: -8,
            },
        }),
    },
});

