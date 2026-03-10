import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    View,
    Pressable,
    ActivityIndicator,
    RefreshControl,
    SafeAreaView,
    Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { chatService } from "../../services/chatService";

/**
 * Chat Inbox Screen
 * Lists all conversations for the current user.
 */

export default function ChatInboxScreen() {
    const router = useRouter();
    const [chats, setChats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [myId, setMyId] = useState("");

    const loadChats = async () => {
        try {
            const profileRaw = await AsyncStorage.getItem("profile");
            if (profileRaw) {
                const p = JSON.parse(profileRaw);
                setMyId(p._id);
            }

            const res = await chatService.getUserChats();
            if (res.success) {
                setChats(res.chats);
            }
        } catch (e) {
            console.log("Error loading chats:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadChats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadChats();
    };

    const renderItem = ({ item }: { item: any }) => {
        const recipient = item.participants.find((p: any) => p._id !== myId) || item.participants[0];
        const lastMsg = item.messages[item.messages.length - 1];

        return (
            <Pressable
                onPress={() => router.push(`/chat/${item._id}${item.dealId ? `?dealId=${item.dealId}` : ""}`)}
                style={styles.chatItem}
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{recipient?.name?.charAt(0) || "U"}</Text>
                </View>

                <View style={styles.chatInfo}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatName}>{recipient?.name || "User"}</Text>
                        <Text style={styles.chatTime}>
                            {item.lastMessage ? new Date(item.lastMessage).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </Text>
                    </View>

                    <Text style={styles.lastMsg} numberOfLines={1}>
                        {lastMsg?.type === "image" ? "📷 Image" : lastMsg?.content || "No messages yet"}
                    </Text>

                    {item.dealId && (
                        <View style={styles.dealBadge}>
                            <Ionicons name="pricetag" size={10} color="#2563eb" />
                            <Text style={styles.dealBadgeText}>Negotiation Active</Text>
                        </View>
                    )}
                </View>
            </Pressable>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: "Messages" }} />

            {loading && !refreshing ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#1e3a8a" />
                </View>
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="chatbubble-ellipses-outline" size={64} color="#e2e8f0" />
                            <Text style={styles.emptyTitle}>No Messages</Text>
                            <Text style={styles.emptySub}>Your conversations with farmers will appear here.</Text>
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
        paddingVertical: 8,
    },
    chatItem: {
        flexDirection: "row",
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9",
        alignItems: "center",
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#e0e7ff",
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "700",
        color: "#4338ca",
    },
    chatInfo: {
        flex: 1,
        marginLeft: 16,
    },
    chatHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    chatName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1e293b",
    },
    chatTime: {
        fontSize: 12,
        color: "#94a3b8",
    },
    lastMsg: {
        fontSize: 14,
        color: "#64748b",
        marginTop: 2,
    },
    dealBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#eff6ff",
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginTop: 6,
    },
    dealBadgeText: {
        fontSize: 10,
        color: "#2563eb",
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
