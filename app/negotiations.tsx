import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatService } from "../services/chatService";
import { dealService } from "../services/dealService";

/**
 * Negotiations Page
 * Lists active and past negotiations by scanning chats for linked deals.
 */

export default function NegotiationsScreen() {
    const router = useRouter();
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadNegotiations = async () => {
        try {
            const res = await chatService.getUserChats();
            if (res?.success && Array.isArray(res.chats)) {
                // Filter chats that have a dealId
                const chatsWithDeals = res.chats.filter((c: any) => c.dealId);

                const myId = await AsyncStorage.getItem("userId");
                const role = await AsyncStorage.getItem("role");

                const dealPromises = chatsWithDeals.map(async (chat: any) => {
                    try {
                        const dRes = await dealService.getDeal(chat.dealId);
                        if (dRes?.success) {
                            const otherParty = chat.participants?.find((p: any) => p._id !== myId);
                            return {
                                ...dRes.deal,
                                chatId: chat._id,
                                otherPartyName: otherParty?.name || (role === "farmer" ? "Buyer" : "Farmer"),
                                otherPartyRole: otherParty?.role || (role === "farmer" ? "buyer" : "farmer")
                            };
                        }
                    } catch (e) {
                        return null;
                    }
                });

                const resolvedDeals = (await Promise.all(dealPromises)).filter(Boolean);
                setDeals(resolvedDeals);
            }
        } catch (e) {
            console.log("Error loading negotiations:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadNegotiations();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadNegotiations();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "ACCEPTED": return "#10b981";
            case "REJECTED": return "#ef4444";
            case "EXPIRED": return "#64748b";
            default: return "#f59e0b";
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <Pressable
            onPress={() => router.push(`/chat/${item.chatId}?dealId=${item._id}`)}
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <View style={styles.cropBadge}>
                    <Text style={styles.cropText}>{item.crop}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "20" }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Ionicons name="person-outline" size={16} color="#64748b" />
                    <Text style={styles.infoText}>
                        {item.otherPartyRole === "farmer" ? "Farmer" : "Buyer"}: {item.otherPartyName}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="pricetag-outline" size={16} color="#64748b" />
                    <Text style={styles.priceText}>₹{item.currentOffer}/kg</Text>
                    <Text style={styles.qtyText}>for {item.quantityKg}kg</Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.dateText}>
                    {item.status === "PENDING" ? "Expires soon" : "Transaction complete"}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                title: "My Negotiations",
                headerShadowVisible: false,
                headerShown: false,
            }} />
            <NavAuto />


            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1e3a8a" />
                </View>
            ) : (
                <FlatList
                    data={deals}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubbles-outline" size={64} color="#e2e8f0" />
                            <Text style={styles.emptyTitle}>No Negotiations Yet</Text>
                            <Text style={styles.emptySub}>Start a chat with a farmer to begin negotiating prices.</Text>
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
        backgroundColor: "#f8fafc",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    list: {
        padding: 16,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
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
    cropBadge: {
        backgroundColor: "#eff6ff",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    cropText: {
        color: "#2563eb",
        fontWeight: "700",
        fontSize: 14,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    cardBody: {
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    infoText: {
        marginLeft: 8,
        color: "#334155",
        fontSize: 14,
    },
    priceText: {
        marginLeft: 8,
        color: "#1e3a8a",
        fontWeight: "800",
        fontSize: 16,
    },
    qtyText: {
        marginLeft: 6,
        color: "#64748b",
        fontSize: 14,
    },
    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: "#f1f5f9",
        paddingTop: 12,
    },
    dateText: {
        fontSize: 12,
        color: "#94a3b8",
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 100,
        paddingHorizontal: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#334155",
        marginTop: 16,
    },
    emptySub: {
        fontSize: 14,
        color: "#64748b",
        textAlign: "center",
        marginTop: 8,
        lineHeight: 20,
    },
});
