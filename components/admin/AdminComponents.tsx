import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ViewStyle, TextStyle, Modal, Pressable } from "react-native";
import * as Lucide from "lucide-react-native";
import { useRouter } from "expo-router";
import NotificationBell from "../notifications/NotificationBell";

export const COLORS = {
    primary: "#1B5E20",
    primaryLight: "#4C8C4A",
    secondary: "#81C784",
    accent: "#A1887F",
    background: "#FDFBF7",
    card: "#FFFFFF",
    text: "#0F172A",
    textLight: "#64748B",
    border: "#E2E8F0",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
};

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const Card = ({ children, style }: CardProps) => (
    <View style={[styles.card, style]}>{children}</View>
);

export const AdminSidebar = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const router = useRouter();
    const [user, setUser] = React.useState<any>(null);

    React.useEffect(() => {
        if (visible) {
            const { getProfile } = require("../../services/userServices");
            getProfile().then((res: any) => {
                if (res.success) setUser(res.user);
            }).catch(() => { });
        }
    }, [visible]);

    const menuItems = [
        { label: "Dashboard", icon: "LayoutDashboard", route: "/admin" },
        { label: "Farmers", icon: "Users", route: "/admin/farmers" },
        { label: "Buyers", icon: "ShoppingBag", route: "/admin/buyers" },
        { label: "Products", icon: "Package", route: "/admin/products" },
        { label: "Orders", icon: "ShoppingCart", route: "/admin/orders" },
        { label: "Analytics", icon: "PieChart", route: "/admin/analytics" },
        { label: "Profile", icon: "User", route: "/admin/profile" },
    ];

    const navigate = (route: any) => {
        onClose();
        router.push(route);
    };

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <Pressable style={styles.dismissArea} onPress={onClose} />
                <View style={styles.sidebar}>
                    <View style={s.sidebarHeader}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.name?.[0] || 'A'}</Text>
                        </View>
                        <View>
                            <Text style={s.adminName}>{user?.name || "System Admin"}</Text>
                            <Text style={s.adminRole}>{user?.role?.toUpperCase() || "MASTER CONTROL"}</Text>
                        </View>
                    </View>

                    <ScrollView style={s.menuList}>
                        {menuItems.map((item) => {
                            const Icon = Lucide[item.icon as keyof typeof Lucide] as any;
                            return (
                                <TouchableOpacity key={item.route} style={s.menuItem} onPress={() => navigate(item.route)}>
                                    <Icon size={20} color={COLORS.textLight} style={s.menuIcon} />
                                    <Text style={s.menuLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    <TouchableOpacity style={s.logoutBtn} onPress={() => router.replace("/login")}>
                        <Lucide.LogOut size={20} color={COLORS.danger} />
                        <Text style={[s.menuLabel, { color: COLORS.danger }]}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};


export const StatCard = ({ label, value, icon, color, trend, trendUp }: { label: string; value: string | number; icon: keyof typeof Lucide; color: string; trend?: string; trendUp?: boolean }) => {
    const IconComponent = Lucide[icon] as any;
    return (
        <Card style={styles.statCard}>
            <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
                <IconComponent size={20} color={color} />
            </View>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
            {trend && (
                <View style={styles.trendRow}>
                    <Lucide.TrendingUp size={12} color={trendUp ? COLORS.success : COLORS.danger} style={{ transform: [{ rotate: trendUp ? "0deg" : "180deg" }] }} />
                    <Text style={[styles.trendText, { color: trendUp ? COLORS.success : COLORS.danger }]}>{trend}</Text>
                </View>
            )}
        </Card>
    );
};

export const Badge = ({ text, type = "info" }: { text: string; type?: "success" | "warning" | "danger" | "info" }) => {
    const bgColor = COLORS[type] + "15";
    const textColor = COLORS[type];
    return (
        <View style={[styles.badge, { backgroundColor: bgColor }]}>
            <Text style={[styles.badgeText, { color: textColor }]}>{text.toUpperCase()}</Text>
        </View>
    );
};

export const Header = ({ title, subtitle, showBack = false, onBack, onMenu }: { title: string; subtitle?: string; showBack?: boolean; onBack?: () => void; onMenu?: () => void }) => {
    const router = useRouter();
    return (
        <View style={styles.header}>
            <View style={styles.headerRow}>
                {onMenu ? (
                    <TouchableOpacity onPress={onMenu} style={styles.backBtn}>
                        <Lucide.Menu size={24} color={COLORS.text} />
                    </TouchableOpacity>
                ) : showBack ? (
                    <TouchableOpacity onPress={onBack} style={styles.backBtn}>
                        <Lucide.ChevronLeft size={24} color={COLORS.text} />
                    </TouchableOpacity>
                ) : null}
                <View>
                    <Text style={styles.headerTitle}>{title}</Text>
                    {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
                </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <NotificationBell color={COLORS.primary} />
                <TouchableOpacity style={styles.profileBtn} onPress={() => { router.push("/admin/profile") }}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>A</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, borderWidth: 1, borderColor: COLORS.border },
    statCard: { width: "48%", marginBottom: 12 },
    iconContainer: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 12 },
    statLabel: { fontSize: 12, fontWeight: "600", color: COLORS.textLight, marginBottom: 4 },
    statValue: { fontSize: 20, fontWeight: "800", color: COLORS.text },
    trendRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 4 },
    trendText: { fontSize: 10, fontWeight: "700" },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start" },
    badgeText: { fontSize: 10, fontWeight: "800" },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 15, backgroundColor: COLORS.background },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
    headerTitle: { fontSize: 22, fontWeight: "900", color: COLORS.text, letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 12, color: COLORS.textLight, fontWeight: "600" },
    profileBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', borderWidth: 2, borderColor: COLORS.primary },
    avatar: { width: 40, height: 40, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontWeight: '900', fontSize: 18 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', flexDirection: 'row' },
    dismissArea: { flex: 1 },
    sidebar: { width: 280, height: '100%', backgroundColor: COLORS.card, shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 10 },
});

const s = StyleSheet.create({
    sidebarHeader: { padding: 30, paddingTop: 60, backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', gap: 15 },
    adminName: { color: '#fff', fontSize: 18, fontWeight: '800' },
    adminRole: { color: COLORS.secondary, fontSize: 12, fontWeight: '700' },
    menuList: { flex: 1, padding: 20 },
    menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderRadius: 10, marginBottom: 5 },
    menuIcon: { marginRight: 15 },
    menuLabel: { fontSize: 16, fontWeight: '700', color: COLORS.text },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', padding: 25, borderTopWidth: 1, borderTopColor: COLORS.border, gap: 15 },
});
