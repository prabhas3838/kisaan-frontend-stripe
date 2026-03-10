import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import NavAuto from "../components/navigation/NavAuto";

import {
    FlatList,
    StyleSheet,
    Text,
    View,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    Linking,
    TextInput,
} from "react-native";
import { govtService, Scheme } from "../services/govtService";

/**
 * Govt Schemes Page
 * Displays agricultural schemes for farmers and buyers.
 */

export default function GovtSchemesScreen() {
    const [schemes, setSchemes] = useState<Scheme[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadSchemes = async () => {
        try {
            const data = await govtService.getSchemes();
            setSchemes(data);
        } catch (e) {
            console.log("Error loading schemes:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadSchemes();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadSchemes();
    };

    const filtered = schemes.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.category.toLowerCase().includes(search.toLowerCase())
    );

    const renderItem = ({ item }: { item: Scheme }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                </View>
                <Ionicons name="bookmark-outline" size={20} color="#64748b" />
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.desc}>{item.description}</Text>

            <View style={styles.detailsBox}>
                <Text style={styles.detailTitle}>Benefits:</Text>
                <Text style={styles.detailText}>{item.benefits}</Text>

                <Text style={[styles.detailTitle, { marginTop: 8 }]}>Eligibility:</Text>
                <Text style={styles.detailText}>{item.eligibility}</Text>
            </View>

            {item.link && (
                <Pressable
                    onPress={() => Linking.openURL(item.link!)}
                    style={styles.linkBtn}
                >
                    <Text style={styles.linkBtnText}>Official Website</Text>
                    <Ionicons name="open-outline" size={14} color="#2563eb" />
                </Pressable>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                title: "Govt Schemes",
                headerShadowVisible: false,
                headerShown: false,
            }} />
            <NavAuto />


            <View style={styles.searchBar}>
                <Ionicons name="search" size={20} color="#94a3b8" />
                <TextInput
                    placeholder="Search schemes or categories..."
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                />
            </View>

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1e3a8a" />
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>No Schemes Found</Text>
                            <Text style={styles.emptySub}>Try a different search term.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f1f5f9",
        margin: 16,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
    },
    list: {
        padding: 16,
        paddingTop: 0,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: "#f1f5f9",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    categoryBadge: {
        backgroundColor: "#f0fdf4",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        color: "#16a34a",
        fontSize: 12,
        fontWeight: "600",
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1e293b",
        lineHeight: 24,
    },
    desc: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 8,
        lineHeight: 20,
    },
    detailsBox: {
        backgroundColor: "#f8fafc",
        padding: 12,
        borderRadius: 12,
        marginTop: 16,
    },
    detailTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#334155",
        textTransform: "uppercase",
    },
    detailText: {
        fontSize: 13,
        color: "#475569",
        marginTop: 4,
        lineHeight: 18,
    },
    linkBtn: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16,
    },
    linkBtnText: {
        color: "#2563eb",
        fontSize: 14,
        fontWeight: "600",
        marginRight: 4,
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#64748b",
    },
    emptySub: {
        fontSize: 14,
        color: "#94a3b8",
        marginTop: 4,
    },
});
