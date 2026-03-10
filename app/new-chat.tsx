import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Platform,
    Alert,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getUsers } from "../services/userServices";
import { chatService } from "../services/chatService";
import AsyncStorage from "@react-native-async-storage/async-storage";

type User = {
    _id: string;
    name: string;
    phone: string;
    role: string;
};

export default function NewChat() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [startingChat, setStartingChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState<"ALL" | "FARMER" | "BUYER">("ALL");
    const [myId, setMyId] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const profileRaw = await AsyncStorage.getItem("profile");
            if (profileRaw) {
                const p = JSON.parse(profileRaw);
                setMyId(p._id || "");
            }

            const res = await getUsers();
            if (res?.success) {
                setUsers(res.users || []);
            }
        } catch (err: any) {
            console.log("Error loading users:", err);
            Alert.alert("Error", "Could not load users.");
        } finally {
            setLoading(false);
        }
    };

    const handleStartChat = async (recipientId: string) => {
        try {
            setStartingChat(true);
            const res = await chatService.getOrCreateChat(recipientId);
            if (res?.success) {
                // Navigate and replace so going back goes to inbox
                router.replace({
                    pathname: "/chat/[id]",
                    params: { id: res.chat._id },
                });
            } else {
                Alert.alert("Error", "Could not start conversation.");
            }
        } catch (err: any) {
            console.log("Error starting chat:", err);
            Alert.alert("Error", "Could not start conversation.");
        } finally {
            setStartingChat(false);
        }
    };

    const filteredUsers = users.filter((u) => {
        // Exclude self
        if (u._id === myId) return false;

        // Role filter
        if (selectedRole === "FARMER" && u.role !== "farmer") return false;
        if (selectedRole === "BUYER" && u.role !== "buyer") return false;

        // Search query
        if (searchQuery.trim() === "") return true;
        return u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (u.phone && u.phone.includes(searchQuery));
    });

    const renderUser = ({ item }: { item: User }) => {
        const isBuyer = item.role === "buyer";
        const roleColor = isBuyer ? "#2563EB" : "#16A34A";
        const roleLabel = isBuyer ? "Buyer" : "Farmer";
        const initial = item.name ? item.name.charAt(0).toUpperCase() : "?";

        return (
            <TouchableOpacity
                style={styles.userCard}
                activeOpacity={0.7}
                onPress={() => handleStartChat(item._id)}
                disabled={startingChat}
            >
                <View style={[styles.avatar, { backgroundColor: roleColor + "18" }]}>
                    <Text style={[styles.avatarText, { color: roleColor }]}>{initial}</Text>
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
                    <View style={styles.userPhoneRow}>
                        <Ionicons name="call" size={12} color="#94A3B8" />
                        <Text style={styles.userPhone}>{item.phone || "No phone"}</Text>
                    </View>
                </View>

                <View style={[styles.roleBadge, { backgroundColor: roleColor + "18" }]}>
                    <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.root}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Message</Text>
            </View>

            {/* Filters */}
            <View style={styles.filterSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        placeholderTextColor="#94A3B8"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <View style={styles.tabsRow}>
                    {["ALL", "FARMER", "BUYER"].map((role) => (
                        <TouchableOpacity
                            key={role}
                            style={[
                                styles.tabBtn,
                                selectedRole === role && styles.tabBtnActive,
                            ]}
                            onPress={() => setSelectedRole(role as any)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    selectedRole === role && styles.tabTextActive,
                                ]}
                            >
                                {role === "ALL" ? "All Users" : role === "FARMER" ? "Farmers" : "Buyers"}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.loadingText}>Loading users...</Text>
                </View>
            ) : filteredUsers.length === 0 ? (
                <View style={styles.centerBox}>
                    <Ionicons name="people-outline" size={48} color="#CBD5E1" />
                    <Text style={styles.emptyTitle}>No users found</Text>
                    <Text style={styles.emptySubtitle}>Try adjusting your filters</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    keyExtractor={(item) => item._id}
                    renderItem={renderUser}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                />
            )}

            {/* Loading Overlay */}
            {startingChat && (
                <View style={styles.overlay}>
                    <ActivityIndicator size="large" color="#2563EB" />
                    <Text style={styles.overlayText}>Starting chat...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#F1F5F9" },
    header: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingTop: Platform.OS === "ios" ? 50 : 20,
        paddingBottom: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
    filterSection: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F8FAFC",
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    searchInput: { flex: 1, fontSize: 15, color: "#0F172A" },
    tabsRow: { flexDirection: "row", gap: 8 },
    tabBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#F1F5F9",
    },
    tabBtnActive: { backgroundColor: "#0F172A" },
    tabText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
    tabTextActive: { color: "#FFFFFF" },

    listContent: { padding: 12, paddingBottom: 40 },
    userCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        padding: 14,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    avatarText: { fontSize: 18, fontWeight: "800" },
    userInfo: { flex: 1, marginLeft: 14 },
    userName: { fontSize: 16, fontWeight: "800", color: "#0F172A", marginBottom: 2 },
    userPhoneRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    userPhone: { fontSize: 13, color: "#64748B", fontWeight: "500" },
    roleBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginLeft: 12,
    },
    roleText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },

    centerBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
    loadingText: { marginTop: 12, color: "#64748B", fontSize: 14 },
    emptyTitle: { fontSize: 18, fontWeight: "800", color: "#334155", marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: "#94A3B8", marginTop: 4 },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(255,255,255,0.8)",
        justifyContent: "center",
        alignItems: "center",
    },
    overlayText: { marginTop: 12, color: "#0F172A", fontSize: 16, fontWeight: "700" },
});
