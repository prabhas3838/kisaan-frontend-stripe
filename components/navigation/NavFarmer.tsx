import React, { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    Animated,
    Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NotificationBell from "../notifications/NotificationBell";

export default function NavFarmer() {
    const router = useRouter();
    const [profileOpen, setProfileOpen] = useState(false);
    const profileAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(profileAnim, {
            toValue: profileOpen ? 1 : 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
        }).start();
    }, [profileOpen]);

    const handleLogout = async () => {
        setProfileOpen(false);
        await AsyncStorage.removeItem("token");
        router.replace("/login");
    };

    return (
        <View style={styles.container}>
            <View style={styles.navbar}>
                {/* App Name — tapping goes to dashboard */}
                <TouchableOpacity
                    style={styles.brandBtn}
                    onPress={() => router.replace("/farmer-dashboard")}
                    activeOpacity={0.7}
                >
                    <Ionicons name="leaf" size={20} color="#BBF7D0" style={{ marginRight: 8 }} />
                    <Text style={styles.brandText}>Kisaan Saathi</Text>
                </TouchableOpacity>

                <View style={{ flex: 1 }} />

                <NotificationBell color="#FFF" />

                {/* Profile */}
                <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => setProfileOpen(!profileOpen)}
                >
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={18} color="#FFF" />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Profile Dropdown */}
            {profileOpen && (
                <>
                    <Pressable style={styles.backdrop} onPress={() => setProfileOpen(false)} />
                    <Animated.View style={[styles.dropdown, {
                        opacity: profileAnim,
                        transform: [{ scale: profileAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }]
                    }]}>
                        <View style={styles.dropdownHeader}>
                            <Text style={styles.dropdownTitle}>Farmer Account</Text>
                        </View>
                        <DropdownItem icon="person-outline" label="Edit Profile" onPress={() => { setProfileOpen(false); router.push("/edit-profile"); }} />
                        <DropdownItem icon="settings-outline" label="Settings" onPress={() => { setProfileOpen(false); router.push("/settings" as any); }} />
                        <View style={styles.divider} />
                        <DropdownItem icon="log-out-outline" label="Logout" danger onPress={handleLogout} />
                    </Animated.View>
                </>
            )}
        </View>
    );
}

function DropdownItem({ icon, label, onPress, danger = false }: any) {
    return (
        <TouchableOpacity style={styles.dropdownItem} onPress={onPress}>
            <Ionicons name={icon} size={18} color={danger ? "#EF4444" : "#374151"} style={{ marginRight: 10 }} />
            <Text style={[styles.dropdownText, danger && { color: "#EF4444" }]}>{label}</Text>
        </TouchableOpacity>
    );
}

const PRIMARY = "#15803D";
const PRIMARY_DARK = "#14532D";

const styles = StyleSheet.create({
    container: {
        backgroundColor: PRIMARY,
        zIndex: 1000,
        paddingTop: Platform.OS === "ios" ? 48 : 4,
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
            android: { elevation: 6 },
        }),
    },
    navbar: {
        flexDirection: "row",
        alignItems: "center",
        height: 54,
        paddingHorizontal: 16,
    },
    brandBtn: {
        flexDirection: "row",
        alignItems: "center",
    },
    brandText: {
        fontSize: 20,
        fontWeight: "800",
        color: "#FFF",
        letterSpacing: 0.3,
    },
    profileButton: {},
    avatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: PRIMARY_DARK,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "transparent",
        zIndex: 1500,
    },
    dropdown: {
        position: "absolute",
        top: Platform.OS === "ios" ? 100 : 62,
        right: 12,
        width: 210,
        backgroundColor: "#FFF",
        borderRadius: 10,
        padding: 6,
        zIndex: 2000,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        ...Platform.select({
            ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 12 },
            android: { elevation: 10 },
        }),
    },
    dropdownHeader: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    dropdownTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: "#94A3B8",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderRadius: 6,
    },
    dropdownText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#334155",
    },
    divider: {
        height: 1,
        backgroundColor: "#F1F5F9",
        marginVertical: 4,
    },
});
