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
    Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
const FS: any = FileSystem;
import * as Sharing from "expo-sharing";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatService } from "../services/chatService";
import { dealService } from "../services/dealService";
import { ENDPOINTS } from "../services/api";

/**
 * Invoices Page
 * Lists completed (ACCEPTED) deals and provides PDF download for invoices.
 */

export default function InvoicesScreen() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);

    const loadInvoices = async () => {
        try {
            const res = await chatService.getUserChats();
            if (res.success) {
                const chatsWithDeals = res.chats.filter((c: any) => c.dealId);

                const myId = await AsyncStorage.getItem("userId"); // Assuming this is stored
                const role = await AsyncStorage.getItem("role");

                const dealPromises = chatsWithDeals.map(async (chat: any) => {
                    try {
                        const dRes = await dealService.getDeal(chat.dealId);
                        if (dRes.success && dRes.deal.status === "ACCEPTED") {
                            // Find the OTHER party
                            const otherParty = chat.participants.find((p: any) => p._id !== myId);
                            return {
                                ...dRes.deal,
                                otherPartyName: otherParty?.name || (role === "farmer" ? "Buyer" : "Farmer"),
                                otherPartyRole: otherParty?.role || (role === "farmer" ? "buyer" : "farmer")
                            };
                        }
                    } catch (e) {
                        return null;
                    }
                });

                const resolved = (await Promise.all(dealPromises)).filter(Boolean);
                setInvoices(resolved);
            }
        } catch (e) {
            console.log("Error loading invoices:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadInvoices();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadInvoices();
    };

    const downloadInvoice = async (dealId: string) => {
        try {
            setDownloading(dealId);
            const url = ENDPOINTS.INVOICE(dealId);
            const token = await AsyncStorage.getItem("token");
            const fileUri = `${FS.documentDirectory}invoice-${dealId.substring(0, 8)}.pdf`;

            const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (downloadRes.status === 200) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(downloadRes.uri, {
                        mimeType: "application/pdf",
                        dialogTitle: "Save Invoice",
                    });
                } else {
                    Alert.alert("Success", "Invoice downloaded successfully.");
                }
            } else {
                Alert.alert("Error", "Failed to download invoice.");
            }
        } catch (err) {
            console.log("Download error:", err);
            Alert.alert("Error", "Could not download invoice.");
        } finally {
            setDownloading(null);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardInfo}>
                <Ionicons name="document-text" size={24} color="#6366f1" />
                <View style={styles.textContainer}>
                    <Text style={styles.invoiceId}>INV-{item._id.substring(0, 8).toUpperCase()}</Text>
                    <Text style={styles.invoiceDetails}>{item.crop} • {item.quantityKg}kg</Text>
                    <Text style={styles.sellerName}>{item.otherPartyRole === "farmer" ? "Seller" : "Buyer"}: {item.otherPartyName}</Text>
                </View>
            </View>

            <Pressable
                onPress={() => downloadInvoice(item._id)}
                disabled={downloading === item._id}
                style={styles.downloadBtn}
            >
                {downloading === item._id ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <Ionicons name="download-outline" size={18} color="#fff" />
                        <Text style={styles.downloadText}>PDF</Text>
                    </>
                )}
            </Pressable>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{
                title: "Invoices",
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
                    data={invoices}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={64} color="#e2e8f0" />
                            <Text style={styles.emptyTitle}>No Invoices</Text>
                            <Text style={styles.emptySub}>Accepted deals will appear here for invoice download.</Text>
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
    list: {
        padding: 20,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#f8fafc",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    cardInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    textContainer: {
        marginLeft: 12,
    },
    invoiceId: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1e293b",
    },
    invoiceDetails: {
        fontSize: 12,
        color: "#64748b",
        marginTop: 2,
    },
    sellerName: {
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 2,
    },
    downloadBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1e3a8a",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        minWidth: 70,
        justifyContent: "center",
    },
    downloadText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 4,
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
    },
});
