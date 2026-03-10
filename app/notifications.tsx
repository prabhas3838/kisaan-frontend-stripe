import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { apiFetch } from "../services/http";
import { ENDPOINTS } from "../services/api";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import { notificationService } from "../services/NotificationService";

type Notification = {
    _id: string;
    title: string;
    message: string;
    type: "deal" | "auction" | "chat" | "order" | "system";
    relatedEntityId?: string;
    read: boolean;
    createdAt: string;
};

export default function NotificationsScreen() {
    const { t } = useTranslation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await apiFetch<any>(ENDPOINTS.NOTIFICATIONS.GET_ALL);
            if (res.success) {
                setNotifications(res.data);
                // Sync the global service count
                notificationService.fetchUnreadCount();
            }
        } catch (error) {
            console.error("Fetch Notifications Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Refresh and auto-mark as read when screen is focused
    useEffect(() => {
        const load = async () => {
            await fetchNotifications();
            // Clear the badge automatically when viewing the notifications
            setTimeout(markAllAsRead, 1000);
        };
        load();
    }, []);

    const markAllAsRead = async () => {
        try {
            await apiFetch(ENDPOINTS.NOTIFICATIONS.READ_ALL, { method: "PATCH" });
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            notificationService.fetchUnreadCount();
        } catch (error) {
            console.error("Mark Read Error:", error);
        }
    };

    const handleNotificationPress = async (item: Notification) => {
        // 1. Mark as read in UI & Backend
        if (!item.read) {
            try {
                await apiFetch(`${ENDPOINTS.NOTIFICATIONS.BASE}/${item._id}/read`, {
                    method: "PATCH",
                });
                setNotifications(
                    notifications.map((n) => (n._id === item._id ? { ...n, read: true } : n))
                );
                notificationService.fetchUnreadCount();
            } catch (error) {
                console.error("Mark Read Error:", error);
            }
        }

        // 2. Navigate based on type
        switch (item.type) {
            case "auction":
                if (item.relatedEntityId) {
                    router.push({
                        pathname: "/auction-detail",
                        params: { id: item.relatedEntityId }
                    } as any);
                } else {
                    router.push("/farmer-auctions" as any);
                }
                break;
            case "chat":
                router.push("/messages" as any);
                break;
            case "deal":
                router.push("/negotiations" as any);
                break;
            default:
                // Just stay on notification page or go to dashboard
                break;
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await apiFetch(`${ENDPOINTS.NOTIFICATIONS.BASE}/${id}`, {
                method: "DELETE",
            });
            setNotifications(notifications.filter((n) => n._id !== id));
            notificationService.fetchUnreadCount();
        } catch (error) {
            console.error("Delete Error:", error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "deal":
                return "briefcase";
            case "auction":
                return "hammer";
            case "chat":
                return "chatbubble";
            case "order":
                return "cart";
            default:
                return "notifications";
        }
    };

    const renderItem = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.notificationItem, !item.read && styles.unreadItem]}
            onPress={() => handleNotificationPress(item)}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, (styles[item.type as keyof typeof styles] as any) || styles.system]}>
                <Ionicons name={getIcon(item.type) as any} size={20} color="#fff" />
            </View>
            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, !item.read && styles.boldText]}>{item.title}</Text>
                    <Text style={styles.time}>
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </Text>
                </View>
                <Text style={styles.message} numberOfLines={2}>
                    {item.message}
                </Text>
            </View>
            <TouchableOpacity onPress={() => deleteNotification(item._id)} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.root}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={styles.readAll}>Mark all read</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={fetchNotifications} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="notifications-off-outline" size={60} color="#CBD5E1" />
                            <Text style={styles.emptyText}>No notifications yet</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F8FAFC" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    headerTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
    backBtn: { padding: 4 },
    readAll: { fontSize: 13, color: "#10B981", fontWeight: "700" },
    list: { paddingBottom: 20 },
    notificationItem: {
        flexDirection: "row",
        padding: 16,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
        alignItems: "center",
    },
    unreadItem: { backgroundColor: "#F1F5F9" },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    deal: { backgroundColor: "#3B82F6" },
    auction: { backgroundColor: "#F59E0B" },
    chat: { backgroundColor: "#10B981" },
    order: { backgroundColor: "#8B5CF6" },
    system: { backgroundColor: "#64748B" },
    content: { flex: 1 },
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 2 },
    title: { fontSize: 14, fontWeight: "600", color: "#1E293B" },
    boldText: { fontWeight: "800" },
    time: { fontSize: 10, color: "#94A3B8" },
    message: { fontSize: 13, color: "#64748B", lineHeight: 18 },
    deleteBtn: { padding: 8, marginLeft: 4 },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", marginTop: 100 },
    emptyText: { marginTop: 16, fontSize: 16, color: "#94A3B8", fontWeight: "600" },
});
