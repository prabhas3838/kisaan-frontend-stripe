import React, { useState } from "react";
import {
    FlatList,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import NavBuyer from "../components/navigation/NavBuyer";


// ─── Filter option lists ───
const STATES = ["All States", "Maharashtra", "Karnataka", "Madhya Pradesh", "Uttar Pradesh", "Punjab"];
const DISTRICTS = ["All Districts", "Pune", "Bangalore", "Indore", "Lucknow", "Nagpur"];
const COMMODITIES = ["All Commodities", "Tomato", "Onion", "Potato", "Wheat", "Rice", "Maize"];

// ─── Mock auction data ───
type AuctionRow = {
    id: string;
    crop: string;
    lotId: string;
    weightKg: number;
    currentBid: number;
    bids: number;
    timeLeftMin: number;
    seller: string;
};

const MOCK_AUCTIONS: AuctionRow[] = [];

// ─── Reusable dropdown-like pill selector ───
function PillSelector({
    label,
    options,
    selected,
    onSelect,
}: {
    label: string;
    options: string[];
    selected: string;
    onSelect: (v: string) => void;
}) {
    const [open, setOpen] = useState(false);

    return (
        <View style={filterStyles.pillWrapper}>
            <Pressable style={filterStyles.pill} onPress={() => setOpen(!open)}>
                <Text style={filterStyles.pillLabel} numberOfLines={1}>
                    {selected || label}
                </Text>
                <Ionicons name={open ? "chevron-up" : "chevron-down"} size={14} color="#475569" />
            </Pressable>

            {open && (
                <View style={filterStyles.dropdown}>
                    <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                        {options.map((opt) => (
                            <Pressable
                                key={opt}
                                style={[filterStyles.dropdownItem, selected === opt && filterStyles.dropdownItemActive]}
                                onPress={() => { onSelect(opt); setOpen(false); }}
                            >
                                <Text style={[filterStyles.dropdownText, selected === opt && filterStyles.dropdownTextActive]}>
                                    {opt}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

export default function LiveAuctionsBuyer() {
    const [state, setState] = useState(STATES[0]);
    const [district, setDistrict] = useState(DISTRICTS[0]);
    const [commodity, setCommodity] = useState(COMMODITIES[0]);
    const [search, setSearch] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    // ─── Filtered data ───
    const filtered = MOCK_AUCTIONS.filter((a) => {
        if (commodity !== "All Commodities" && a.crop !== commodity) return false;
        if (search && !a.crop.toLowerCase().includes(search.toLowerCase()) && !a.lotId.toLowerCase().includes(search.toLowerCase())) return false;
        if (minPrice && a.currentBid < Number(minPrice)) return false;
        if (maxPrice && a.currentBid > Number(maxPrice)) return false;
        return true;
    });

    // ─── Helpers ───
    const formatTime = (mins: number) => {
        if (mins < 1) return "<1m";
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    };

    const urgencyColor = (mins: number) => {
        if (mins <= 5) return "#dc2626";
        if (mins <= 15) return "#f59e0b";
        return "#16a34a";
    };

    return (
        <SafeAreaView style={s.safe}>
            <Stack.Screen options={{ headerShown: false }} />
            <NavBuyer />


            <View style={s.root}>
                {/* ── Page header ── */}
                <View style={s.header}>
                    <Text style={s.headerTitle}>Live Auctions</Text>
                    <Text style={s.headerSub}>
                        {filtered.length} active lot{filtered.length !== 1 ? "s" : ""}
                    </Text>
                </View>

                {/* ── Top filter bar ── */}
                <View style={[filterStyles.bar, { zIndex: 100 }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={filterStyles.barScroll}>
                        <PillSelector label="State" options={STATES} selected={state} onSelect={setState} />
                        <PillSelector label="District" options={DISTRICTS} selected={district} onSelect={setDistrict} />
                        <PillSelector label="Commodity" options={COMMODITIES} selected={commodity} onSelect={setCommodity} />

                        {/* Search */}
                        <View style={filterStyles.searchBox}>
                            <Ionicons name="search" size={16} color="#94a3b8" />
                            <TextInput
                                style={filterStyles.searchInput}
                                placeholder="Search crop / lot"
                                placeholderTextColor="#94a3b8"
                                value={search}
                                onChangeText={setSearch}
                            />
                        </View>

                        {/* Price range */}
                        <View style={filterStyles.rangeBox}>
                            <Text style={filterStyles.rangeLabel}>₹</Text>
                            <TextInput
                                style={filterStyles.rangeInput}
                                placeholder="Min"
                                placeholderTextColor="#94a3b8"
                                keyboardType="numeric"
                                value={minPrice}
                                onChangeText={setMinPrice}
                            />
                            <Text style={filterStyles.rangeDash}>–</Text>
                            <TextInput
                                style={filterStyles.rangeInput}
                                placeholder="Max"
                                placeholderTextColor="#94a3b8"
                                keyboardType="numeric"
                                value={maxPrice}
                                onChangeText={setMaxPrice}
                            />
                        </View>
                    </ScrollView>
                </View>

                {/* ── Table ── */}
                <View style={{ flex: 1, zIndex: 1 }}>
                    {/* Column headers */}
                    <View style={[tableStyles.row, tableStyles.headerRow]}>
                        <Text style={[tableStyles.cell, tableStyles.headerCell, { flex: 1.2 }]}>Crop</Text>
                        <Text style={[tableStyles.cell, tableStyles.headerCell, { flex: 1.2 }]}>Lot ID</Text>
                        <Text style={[tableStyles.cell, tableStyles.headerCell, { flex: 1 }]}>Weight</Text>
                        <Text style={[tableStyles.cell, tableStyles.headerCell, { flex: 1.4 }]}>Current Bid</Text>
                        <Text style={[tableStyles.cell, tableStyles.headerCell, { flex: 0.7 }]}>Bids</Text>
                        <Text style={[tableStyles.cell, tableStyles.headerCell, { flex: 1.2 }]}>Time Left</Text>
                        <Text style={[tableStyles.cell, tableStyles.headerCell, { flex: 1.2 }]}>Seller</Text>
                        <Text style={[tableStyles.cell, tableStyles.headerCell, { flex: 1.2 }]}>Action</Text>
                    </View>

                    {/* Data rows */}
                    <FlatList
                        data={filtered}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingBottom: 24 }}
                        ListEmptyComponent={
                            <View style={s.empty}>
                                <Text style={s.emptyText}>No auctions match your filters</Text>
                            </View>
                        }
                        renderItem={({ item, index }) => (
                            <View style={[tableStyles.row, index % 2 === 0 && tableStyles.rowEven]}>
                                {/* Crop */}
                                <View style={[tableStyles.cell, { flex: 1.2 }]}>
                                    <Text style={tableStyles.cropText}>{item.crop}</Text>
                                </View>

                                {/* Lot ID */}
                                <View style={[tableStyles.cell, { flex: 1.2 }]}>
                                    <Text style={tableStyles.lotText}>{item.lotId}</Text>
                                </View>

                                {/* Weight */}
                                <View style={[tableStyles.cell, { flex: 1 }]}>
                                    <Text style={tableStyles.cellText}>{item.weightKg} kg</Text>
                                </View>

                                {/* Current Bid */}
                                <View style={[tableStyles.cell, { flex: 1.4 }]}>
                                    <Text style={tableStyles.bidText}>₹{item.currentBid.toLocaleString()}</Text>
                                </View>

                                {/* Bids */}
                                <View style={[tableStyles.cell, { flex: 0.7 }]}>
                                    <Text style={tableStyles.cellText}>{item.bids}</Text>
                                </View>

                                {/* Time Left */}
                                <View style={[tableStyles.cell, { flex: 1.2 }]}>
                                    <View style={[tableStyles.timeBadge, { backgroundColor: urgencyColor(item.timeLeftMin) + "18" }]}>
                                        <Ionicons name="time-outline" size={13} color={urgencyColor(item.timeLeftMin)} />
                                        <Text style={[tableStyles.timeText, { color: urgencyColor(item.timeLeftMin) }]}>
                                            {formatTime(item.timeLeftMin)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Seller */}
                                <View style={[tableStyles.cell, { flex: 1.2 }]}>
                                    <Text style={tableStyles.cellText}>{item.seller}</Text>
                                </View>

                                {/* Action */}
                                <View style={[tableStyles.cell, { flex: 1.2 }]}>
                                    <Pressable style={tableStyles.bidBtn}>
                                        <Text style={tableStyles.bidBtnText}>Place Bid</Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    />
                </View>
            </View>
        </SafeAreaView >
    );
}

// ═══════════════════════════════ STYLES ═══════════════════════════════

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#f0f4f8" },
    root: { flex: 1 },
    header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
    headerTitle: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
    headerSub: { fontSize: 15, color: "#64748b", marginTop: 2 },
    empty: { padding: 32, alignItems: "center" },
    emptyText: { fontSize: 16, color: "#94a3b8" },
});

const filterStyles = StyleSheet.create({
    bar: { backgroundColor: "#ffffff", borderBottomWidth: 1, borderColor: "#e2e8f0", zIndex: 100, overflow: "visible" },
    barScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, alignItems: "center", overflow: "visible" },

    pillWrapper: { position: "relative", zIndex: 10 },
    pill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    pillLabel: { fontSize: 15, color: "#334155", maxWidth: 120 },

    dropdown: {
        position: "absolute",
        top: 40,
        left: 0,
        minWidth: 160,
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#e2e8f0",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        zIndex: 100,
    },
    dropdownItem: { paddingHorizontal: 14, paddingVertical: 10 },
    dropdownItemActive: { backgroundColor: "#eff6ff" },
    dropdownText: { fontSize: 15, color: "#334155" },
    dropdownTextActive: { color: "#1d4ed8", fontWeight: "600" },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    searchInput: { fontSize: 15, color: "#0f172a", minWidth: 120, paddingVertical: 2 },

    rangeBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "#f1f5f9",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e2e8f0",
    },
    rangeLabel: { fontSize: 16, fontWeight: "600", color: "#475569" },
    rangeInput: { fontSize: 15, color: "#0f172a", width: 55, paddingVertical: 2, textAlign: "center" },
    rangeDash: { fontSize: 16, color: "#94a3b8" },
});

const tableStyles = StyleSheet.create({
    row: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#f1f5f9" },
    headerRow: { backgroundColor: "#1e3a5f" },
    rowEven: { backgroundColor: "#f8fafc" },

    cell: { paddingHorizontal: 10, paddingVertical: 12, justifyContent: "center" },
    headerCell: { color: "#ffffff", fontWeight: "700", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.4 },

    cellText: { fontSize: 15, color: "#334155" },
    cropText: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
    lotText: { fontSize: 14, color: "#6366f1", fontWeight: "500" },
    bidText: { fontSize: 16, fontWeight: "700", color: "#16a34a" },

    timeBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    timeText: { fontSize: 14, fontWeight: "600" },

    bidBtn: {
        backgroundColor: "#0EA5E9",
        paddingVertical: 7,
        paddingHorizontal: 14,
        borderRadius: 7,
        alignItems: "center",
    },
    bidBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
