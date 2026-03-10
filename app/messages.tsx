import React, { useEffect, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Platform,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NavAuto from "../components/navigation/NavAuto";
import { chatService } from "../services/chatService";


type ChatItem = {
    _id: string;
    participants: Array<{ _id: string; name: string; phone: string; role: string }>;
    dealId?: string;
    messages: Array<{ sender: string; content: string; type: string; timestamp: string }>;
    lastMessage?: string;
};

export default function MessagesList() {
    const router = useRouter();
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [myId, setMyId] = useState<string>("");
    const [error, setError] = useState("");

    useEffect(() => {
        loadMyId();
        loadChats();
    }, []);

    const loadMyId = async () => {
        try {
            const profileRaw = await AsyncStorage.getItem("profile");
            if (profileRaw) {
                const p = JSON.parse(profileRaw);
                setMyId(p._id || "");
            }
        } catch { }
    };

    const loadChats = async () => {
        try {
            setError("");
            const res = await chatService.getUserChats();
            if (res?.success) {
                setChats(res.chats || []);
            }
        } catch (err: any) {
            console.log("Error loading chats:", err);
            setError("Could not load conversations. Pull to retry.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadChats();
    }, []);

    const getOtherParticipant = (item: ChatItem) => {
        if (!myId) return item.participants?.[0];
        return item.participants?.find(p => p._id !== myId) || item.participants?.[0];
    };

    const getTimeLabel = (dateStr?: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
        return d.toLocaleDateString([], { month: "short", day: "numeric" });
    };

    const renderChatItem = ({ item }: { item: ChatItem }) => {
        const other = getOtherParticipant(item);
        const lastMsg = item.messages?.[item.messages.length - 1];
        const unread = lastMsg && lastMsg.sender !== myId;
        const initial = other?.name?.[0]?.toUpperCase() || "?";
        const roleBadge = other?.role === "buyer" ? "Buyer" : "Farmer";
        const roleColor = other?.role === "buyer" ? "#2563EB" : "#16A34A";

        return (
            <TouchableOpacity
                style={styles.chatCard}
                activeOpacity={0.7}
                onPress={() =>
                    router.push({
                        pathname: "/chat/[id]",
                        params: { id: item._id, dealId: item.dealId || "" },
                    })
                }
            >
                {/* Avatar */}
                <View style={[styles.avatar, { backgroundColor: roleColor + "18" }]}>
                    <Text style={[styles.avatarText, { color: roleColor }]}>{initial}</Text>
                </View>

                {/* Chat info */}
                <View style={styles.chatInfo}>
                    <View style={styles.chatTopRow}>
                        <View style={styles.nameRow}>
                            <Text style={styles.chatName} numberOfLines={1}>
                                {other?.name || "User"}
                            </Text>
                            <View style={[styles.roleBadge, { backgroundColor: roleColor + "14" }]}>
                                <Text style={[styles.roleText, { color: roleColor }]}>{roleBadge}</Text>
                            </View>
                        </View>
                        <Text style={styles.chatDate}>
                            {getTimeLabel(lastMsg?.timestamp || item.lastMessage)}
                        </Text>
                    </View>
                    <Text
                        style={[styles.lastMsg, unread && styles.lastMsgUnread]}
                        numberOfLines={1}
                    >
                        {lastMsg?.type === "image"
                            ? "📷 Photo"
                            : lastMsg?.content || "No messages yet"}
                    </Text>
                </View>

                {/* Chevron */}
                <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <NavAuto />


            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Messages</Text>
                    <Text style={styles.subtitle}>
                        {chats.length
                            ? `${chats.length} conversation${chats.length !== 1 ? "s" : ""}`
                            : "Your conversations"}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.newChatBtn}
                    onPress={() => router.push("/new-chat")}
                >
                    <Ionicons name="create-outline" size={20} color="#FFF" />
                    <Text style={styles.newChatText}>New</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading conversations...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerBox}>
                    <Ionicons name="cloud-offline-outline" size={48} color="#CBD5E1" />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={onRefresh}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={chats}
                    keyExtractor={(item) => item._id}
                    renderItem={renderChatItem}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#2563EB"]}
                            tintColor="#2563EB"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.centerBox}>
                            <View style={styles.emptyIconWrap}>
                                <Ionicons name="chatbubbles-outline" size={56} color="#CBD5E1" />
                            </View>
                            <Text style={styles.emptyTitle}>No conversations yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Start chatting from the Marketplace or a deal
                            </Text>
                        </View>
                    }
                    contentContainerStyle={[
                        styles.list,
                        chats.length === 0 && { flex: 1 },
                    ]}
                />
            )}


        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F1F5F9" },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    title: {
        fontSize: 24,
        fontWeight: "900",
        color: "#0F172A",
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
        marginTop: 2,
    },
    newChatBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2563EB",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    newChatText: {
        color: "#FFF",
        fontWeight: "800",
        fontSize: 14,
    },
    list: { padding: 12, paddingBottom: 100 },

    // Chat card
    chatCard: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        padding: 14,
        borderRadius: 0,
        marginBottom: 1,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 2,
            },
            android: { elevation: 1 },
        }),
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 2,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: { fontSize: 20, fontWeight: "900" },
    chatInfo: { flex: 1, marginLeft: 14 },
    chatTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
    chatName: { fontSize: 15, fontWeight: "800", color: "#0F172A" },
    roleBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 2,
    },
    roleText: { fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
    chatDate: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
    lastMsg: { fontSize: 13, color: "#64748B", fontWeight: "500" },
    lastMsgUnread: { color: "#0F172A", fontWeight: "700" },

    // States
    centerBox: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
    errorText: { marginTop: 12, color: "#64748B", fontSize: 14, textAlign: "center" },
    retryBtn: {
        marginTop: 16,
        backgroundColor: "#2563EB",
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 2,
    },
    retryText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
    emptyIconWrap: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "#F1F5F9",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyTitle: { fontSize: 18, fontWeight: "800", color: "#334155" },
    emptySubtitle: { marginTop: 6, color: "#94A3B8", fontSize: 13, textAlign: "center" },
});
