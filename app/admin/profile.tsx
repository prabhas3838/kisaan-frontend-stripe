import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from "react-native";
import { COLORS, Header, AdminSidebar, Card } from "../../components/admin/AdminComponents";
import * as Lucide from "lucide-react-native";
import { getProfile } from "../../services/userServices";
import { useRouter } from "expo-router";
import { apiFetch } from "../../services/http";
import { ENDPOINTS } from "../../services/api";

export default function AdminProfile() {
    const [menuVisible, setMenuVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [passwordModal, setPasswordModal] = useState(false);
    const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
    const [updating, setUpdating] = useState(false);
    const router = useRouter();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const res = await getProfile();
            if (res.success) {
                setUser(res.user);
            }
        } catch (e) {
            console.error("Load Profile Error:", e);
            Alert.alert("Error", "Failed to load user profile");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!passwords.current || !passwords.new || !passwords.confirm) {
            return Alert.alert("Error", "Please fill all fields");
        }
        if (passwords.new !== passwords.confirm) {
            return Alert.alert("Error", "New passwords do not match");
        }
        if (passwords.new.length < 4) {
            return Alert.alert("Error", "PIN must be at least 4 digits");
        }

        try {
            setUpdating(true);

            const res = await apiFetch<any>(`${ENDPOINTS.USER.PROFILE.replace('/profile', '/change-password')}`, {
                method: "POST",
                body: JSON.stringify({
                    currentPassword: passwords.current,
                    newPassword: passwords.new
                })
            });

            if (res.success) {
                Alert.alert("Success", "Password updated successfully");
                setPasswordModal(false);
                setPasswords({ current: "", new: "", confirm: "" });
            } else {
                Alert.alert("Error", res.message || "Failed to update password");
            }
        } catch (e) {
            Alert.alert("Error", "An unexpected error occurred");
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <View style={styles.root}>
            <Header title="My Profile" subtitle="Admin Settings" onMenu={() => setMenuVisible(true)} />
            <AdminSidebar visible={menuVisible} onClose={() => setMenuVisible(false)} />

            <ScrollView contentContainerStyle={styles.scroll}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarLarge}>
                        <Text style={styles.avatarLargeText}>{user?.name?.[0] || 'A'}</Text>
                        <View style={styles.onlineBadge} />
                    </View>
                    <Text style={styles.name}>{user?.name || "System Admin"}</Text>
                    <Text style={styles.role}>{user?.role?.toUpperCase() || "ADMINISTRATOR"}</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.statusBadge, { backgroundColor: COLORS.success + '20' }]}>
                            <Text style={[styles.statusText, { color: COLORS.success }]}>VERIFIED ACCOUNT</Text>
                        </View>
                    </View>
                </View>

                {/* Details Section */}
                <Text style={styles.sectionTitle}>Profile Details</Text>
                <Card style={styles.card}>
                    <DetailItem icon="Phone" label="Contact" value={user?.phone || "+91-9876543210"} />
                    <DetailItem icon="Mail" label="Email" value="admin@kisan-saathi.com" />
                    <DetailItem icon="Shield" label="Permissions" value="Full Access (Master)" />
                </Card>

                {/* App Settings */}
                <Text style={styles.sectionTitle}>Security Settings</Text>
                <Card style={styles.card}>
                    <TouchableOpacity style={styles.settingItem} onPress={() => setPasswordModal(true)}>
                        <View style={styles.settingIconWrap}>
                            <Lucide.Lock size={18} color={COLORS.primary} />
                        </View>
                        <Text style={styles.settingLabel}>Change Password</Text>
                        <Lucide.ChevronRight size={18} color={COLORS.textLight} />
                    </TouchableOpacity>
                </Card>

                {/* System Stats (Admin Specific) */}
                <Text style={styles.sectionTitle}>System Status</Text>
                <Card style={styles.card}>
                    <DetailItem icon="Server" label="Server Status" value="Healthy (Online)" color={COLORS.success} />
                    <DetailItem icon="Database" label="Database Sync" value="Last synced 2m ago" />
                    <DetailItem icon="Activity" label="App Version" value="v1.4.2-stable" />
                </Card>

                <TouchableOpacity style={styles.logoutBtn} onPress={() => router.replace("/login")}>
                    <Lucide.LogOut size={20} color="#fff" />
                    <Text style={styles.logoutBtnText}>Logout from System</Text>
                </TouchableOpacity>

                <Text style={styles.footerText}>© 2026 Kisan Saathi - Secured with End-to-End Encryption</Text>
            </ScrollView>

            {/* Password Modal */}
            <Modal visible={passwordModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Admin PIN</Text>
                        <Text style={styles.modalSub}>Your admin password is a 4-6 digit secure PIN.</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Current PIN"
                            placeholderTextColor="#000"
                            secureTextEntry
                            keyboardType="number-pad"
                            maxLength={6}
                            value={passwords.current}
                            onChangeText={(t) => setPasswords({ ...passwords, current: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="New PIN"
                            placeholderTextColor="#000"
                            secureTextEntry
                            keyboardType="number-pad"
                            maxLength={6}
                            value={passwords.new}
                            onChangeText={(t) => setPasswords({ ...passwords, new: t })}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New PIN"
                            placeholderTextColor="#000"
                            secureTextEntry
                            keyboardType="number-pad"
                            maxLength={6}
                            value={passwords.confirm}
                            onChangeText={(t) => setPasswords({ ...passwords, confirm: t })}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: COLORS.border }]}
                                onPress={() => setPasswordModal(false)}
                            >
                                <Text style={[styles.modalBtnText, { color: COLORS.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: COLORS.primary }]}
                                onPress={handlePasswordChange}
                                disabled={updating}
                            >
                                {updating ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.modalBtnText}>Update PIN</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const DetailItem = ({ icon, label, value, color }: any) => {
    const Icon = (Lucide as any)[icon];
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
                <Icon size={18} color={color || COLORS.textLight} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={[styles.detailValue, color ? { color } : {}]}>{value}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: COLORS.background },
    scroll: { padding: 20 },
    profileHeader: { alignItems: 'center', marginBottom: 30, paddingTop: 10 },
    avatarLarge: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15, position: 'relative' },
    avatarLargeText: { fontSize: 40, fontWeight: '900', color: '#fff' },
    onlineBadge: { position: 'absolute', bottom: 5, right: 5, width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.success, borderWidth: 4, borderColor: '#fff' },
    name: { fontSize: 24, fontWeight: '800', color: COLORS.text, marginBottom: 5 },
    role: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, letterSpacing: 1 },
    badgeRow: { marginTop: 15 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontSize: 10, fontWeight: '900' },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginTop: 25, marginBottom: 15, paddingHorizontal: 5 },
    card: { padding: 10, borderRadius: 20 },
    detailRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 15 },
    detailIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
    detailLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase' },
    detailValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: 15, gap: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    settingIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.primary + '10', justifyContent: 'center', alignItems: 'center' },
    settingLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
    logoutBtn: { backgroundColor: COLORS.danger, flexDirection: 'row', gap: 10, padding: 18, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
    logoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    footerText: { textAlign: 'center', fontSize: 11, color: COLORS.textLight, marginTop: 30, marginBottom: 50 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginBottom: 8 },
    modalSub: { fontSize: 13, color: COLORS.textLight, marginBottom: 20 },
    input: { backgroundColor: COLORS.background, padding: 15, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, fontSize: 16, fontWeight: '600', color: '#000' },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    modalBtn: { flex: 1, height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
