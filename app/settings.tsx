import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    ActivityIndicator,
    Modal,
    Platform,
    TextInput,
    KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Lucide from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import { getProfile, updateProfile, verifyPin, changePassword } from "../services/userServices";
import NavAuto from "../components/navigation/NavAuto";
import { setLanguage } from "../i18n/i18n";

export default function SettingsScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [logoutModal, setLogoutModal] = useState(false);

    // Farm Details State
    const [totalLandArea, setTotalLandArea] = useState("");
    const [landUnit, setLandUnit] = useState("acres");
    const [isSavingLand, setIsSavingLand] = useState(false);

    // Change Password State
    const [isPinModalVisible, setIsPinModalVisible] = useState(false);
    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [pin, setPin] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const storedRole = await AsyncStorage.getItem("role");
            setRole(storedRole);

            const profile = await getProfile();
            if (profile?.success) {
                const u = profile.user;
                setUser(u);
                setTotalLandArea(u.totalLandArea?.toString() || "");
                setLandUnit(u.totalLandAreaUnit || "acres");
            }
        } catch (error) {
            console.error("Error loading settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLandArea = async () => {
        if (!totalLandArea || isNaN(Number(totalLandArea))) {
            Alert.alert(t("settings.error"), "Please enter a valid numeric value for land area.");
            return;
        }

        setIsSavingLand(true);
        try {
            const res = await updateProfile({
                totalLandArea: Number(totalLandArea),
                totalLandAreaUnit: landUnit
            });
            if (res.success) {
                Alert.alert(t("settings.success"), "Farm details updated.");
                setUser({ ...user, totalLandArea: Number(totalLandArea), totalLandAreaUnit: landUnit });
            } else {
                Alert.alert(t("settings.error"), res.message || "Failed to update profile.");
            }
        } catch (e) {
            Alert.alert(t("settings.error"), "Something went wrong.");
        } finally {
            setIsSavingLand(false);
        }
    };

    const handleVerifyPin = async () => {
        if (pin.length < 4) {
            Alert.alert(t("settings.error"), "Please enter a valid PIN.");
            return;
        }

        setIsVerifying(true);
        try {
            const res = await verifyPin(pin);
            if (res.success) {
                setIsPinModalVisible(false);
                setIsPasswordModalVisible(true);
                setPin("");
                setCurrentPassword("");
            } else {
                Alert.alert(t("settings.error"), "Incorrect PIN.");
            }
        } catch (e) {
            Alert.alert(t("settings.error"), "Verification failed.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert(t("settings.error"), "All fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert(t("settings.error"), "New passwords do not match.");
            return;
        }

        setIsVerifying(true);
        try {
            const res = await changePassword({
                currentPassword,
                newPassword
            });
            if (res.success) {
                Alert.alert(t("settings.success"), "Password updated successfully.");
                setIsPasswordModalVisible(false);
                setNewPassword("");
                setConfirmPassword("");
                setCurrentPassword("");
            } else {
                Alert.alert(t("settings.error"), res.message || "Failed to update password.");
            }
        } catch (e) {
            Alert.alert(t("settings.error"), "Something went wrong.");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleLanguageChange = async (lang: string) => {
        await setLanguage(lang);
    };

    const getLanguageLabel = (code: string) => {
        if (code.startsWith("hi")) return "Hindi";
        if (code.startsWith("te")) return "Telugu";
        if (code.startsWith("ml")) return "Malayalam";
        if (code.startsWith("ta")) return "Tamil";
        return "English";
    };

    const handleLogout = async () => {
        setLogoutModal(false);
        await AsyncStorage.clear();
        router.replace("/login");
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
            <Stack.Screen options={{ headerShown: false }} />
            <NavAuto />
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* PROFILE SECTION */}
                <SectionHeader title={t("settings.profile")} />
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.profileRow}
                        onPress={() => router.push("/edit-profile")}
                    >
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.name?.charAt(0) || "U"}</Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.nameText}>{user?.name || "User Name"}</Text>
                            <Text style={styles.phoneText}>{user?.phone || "+91 XXXXXXXXXX"}</Text>
                        </View>
                        <Lucide.ChevronRight size={20} color="#94A3B8" />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <SettingRow
                        icon={<Lucide.UserCircle size={18} color="#3B82F6" />}
                        label={t("settings.edit_profile")}
                        onPress={() => router.push("/edit-profile")}
                    />
                </View>

                {/* SECURITY SECTION */}
                <SectionHeader title={t("settings.security")} />
                <View style={styles.card}>
                    <SettingRow
                        icon={<Lucide.Lock size={18} color="#64748B" />}
                        label={t("settings.change_pin")}
                        onPress={() => setIsPinModalVisible(true)}
                    />
                </View>

                {/* PREFERENCES SECTION */}
                <SectionHeader title={t("settings.preferences")} />
                <View style={styles.card}>
                    <SettingRow
                        icon={<Lucide.Languages size={18} color="#3B82F6" />}
                        label={t("settings.language")}
                        value={getLanguageLabel(i18n.language)}
                        onPress={() => {
                            Alert.alert("Select Language", "Choose app language", [
                                { text: "English", onPress: () => handleLanguageChange("en") },
                                { text: "Hindi", onPress: () => handleLanguageChange("hi") },
                                { text: "Malayalam", onPress: () => handleLanguageChange("ml") },
                                { text: "Tamil", onPress: () => handleLanguageChange("ta") },
                                { text: "Telugu", onPress: () => handleLanguageChange("te") },
                            ]);
                        }}
                    />
                </View>

                {/* FARM DETAILS SECTION */}
                {role === "farmer" && (
                    <>
                        <SectionHeader title={t("settings.farm_details")} />
                        <View style={styles.card}>
                            <SettingRow
                                icon={<Lucide.MapPin size={18} color="#10B981" />}
                                label={t("settings.farm_location")}
                                value={user?.location || "Not Set"}
                                onPress={() => router.push("/change-location")}
                            />
                            <View style={styles.divider} />

                            <View style={styles.editRow}>
                                <View style={styles.rowLeft}>
                                    <View style={styles.iconContainer}>
                                        <Lucide.Maximize size={18} color="#10B981" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.labelText}>{t("settings.total_land_area")}</Text>
                                        <View style={styles.landInputContainer}>
                                            <TextInput
                                                style={styles.landInput}
                                                placeholder="0.0"
                                                placeholderTextColor="#94A3B8"
                                                keyboardType="numeric"
                                                value={totalLandArea}
                                                onChangeText={setTotalLandArea}
                                            />
                                            <TouchableOpacity
                                                style={styles.unitButton}
                                                onPress={() => {
                                                    Alert.alert("Select Unit", "Choose land area unit", [
                                                        { text: "Acres", onPress: () => setLandUnit("acres") },
                                                        { text: "Hectares", onPress: () => setLandUnit("hectares") },
                                                    ]);
                                                }}
                                            >
                                                <Text style={styles.unitButtonText}>{t(`settings.${landUnit}`)}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.smallSaveBtn, isSavingLand && { opacity: 0.5 }]}
                                                onPress={handleSaveLandArea}
                                                disabled={isSavingLand}
                                            >
                                                {isSavingLand ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveBtnText}>{t("settings.save")}</Text>}
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* SUPPORT SECTION */}
                <SectionHeader title={t("settings.support")} />
                <View style={styles.card}>
                    <SettingRow
                        icon={<Lucide.HelpCircle size={18} color="#64748B" />}
                        label={t("settings.help_support")}
                        onPress={() => router.push("/call-support")}
                    />
                </View>

                {/* LOGOUT BUTTON */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={() => setLogoutModal(true)}
                >
                    <Lucide.LogOut size={18} color="#EF4444" />
                    <Text style={styles.logoutText}>{t("settings.logout")}</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={styles.versionText}>{t("settings.version")} 1.2.0 (Stable)</Text>
                    <Text style={styles.footerNote}>© 2026 Kisan Saathi Connect</Text>
                </View>
            </ScrollView>

            {/* MODALS */}
            <Modal visible={isPinModalVisible} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
                        <View style={styles.modalContent}>
                            <Lucide.Lock size={48} color="#3B82F6" style={{ marginBottom: 16 }} />
                            <Text style={styles.modalTitle}>{t("settings.change_pin")}</Text>
                            <Text style={styles.modalSub}>Please verify your identity to proceed.</Text>
                            <TextInput
                                style={styles.modalInput}
                                placeholder="Enter PIN"
                                secureTextEntry
                                keyboardType="numeric"
                                value={pin}
                                onChangeText={setPin}
                                maxLength={6}
                            />
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setIsPinModalVisible(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.modalBtn, styles.modalAction]} onPress={handleVerifyPin}><Text style={styles.modalActionText}>Verify</Text></TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            <Modal visible={isPasswordModalVisible} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ width: "100%" }}>
                        <View style={styles.modalContent}>
                            <Lucide.ShieldCheck size={48} color="#10B981" style={{ marginBottom: 16 }} />
                            <Text style={styles.modalTitle}>{t("settings.change_pin")}</Text>
                            <View style={{ width: "100%", gap: 12, marginBottom: 20 }}>
                                <TextInput style={styles.modalInput} placeholder="Current Password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
                                <TextInput style={styles.modalInput} placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
                                <TextInput style={styles.modalInput} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
                            </View>
                            <View style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setIsPasswordModalVisible(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                                <TouchableOpacity style={[styles.modalBtn, styles.modalAction, { backgroundColor: "#10B981" }]} onPress={handleChangePassword}><Text style={styles.modalActionText}>Update</Text></TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            <Modal visible={logoutModal} transparent animationType="fade">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Lucide.AlertTriangle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
                        <Text style={styles.modalTitle}>{t("settings.logout")}</Text>
                        <Text style={styles.modalSub}>Are you sure you want to sign out?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalCancel]} onPress={() => setLogoutModal(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.modalDelete]} onPress={handleLogout}><Text style={styles.modalDeleteText}>{t("settings.logout")}</Text></TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// --- COMPONENTS ---
function SectionHeader({ title }: { title: string }) {
    return <Text style={styles.sectionHeader}>{title.toUpperCase()}</Text>;
}

function SettingRow({ icon, label, value, onPress }: any) {
    const isTappable = !!onPress;
    const Container = isTappable ? TouchableOpacity : View;
    return (
        <Container style={styles.row} onPress={onPress}>
            <View style={styles.rowLeft}>
                <View style={styles.iconContainer}>{icon}</View>
                <Text style={styles.labelText}>{label}</Text>
            </View>
            <View style={styles.rowRight}>
                {value && <Text style={styles.valueText}>{value}</Text>}
                {isTappable && <Lucide.ChevronRight size={18} color="#94A3B8" style={{ marginLeft: 8 }} />}
            </View>
        </Container>
    );
}

// --- STYLES ---
const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    scrollContent: { padding: 20, paddingBottom: 100 },
    sectionHeader: { fontSize: 12, fontWeight: "800", color: "#64748B", letterSpacing: 1.2, marginBottom: 12, marginTop: 20, paddingLeft: 4 },
    card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 8, borderWidth: 1, borderColor: "#F1F5F9", marginBottom: 16 },
    profileRow: { flexDirection: "row", alignItems: "center", padding: 16 },
    avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#3B82F6", alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#FFF", fontSize: 20, fontWeight: "bold" },
    profileInfo: { flex: 1, marginLeft: 16 },
    nameText: { fontSize: 17, fontWeight: "800", color: "#0F172A" },
    phoneText: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 12 },
    rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
    iconContainer: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#F8FAFC", alignItems: "center", justifyContent: "center", marginRight: 12 },
    labelText: { fontSize: 15, fontWeight: "600", color: "#334155" },
    rowRight: { flexDirection: "row", alignItems: "center" },
    valueText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
    divider: { height: 1, backgroundColor: "#F1F5F9", marginHorizontal: 12 },
    editRow: { padding: 12 },
    landInputContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
    landInput: { flex: 1, backgroundColor: "#F8FAFC", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: "#0F172A", borderWidth: 1, borderColor: "#E2E8F0" },
    unitButton: { backgroundColor: "#E2E8F0", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
    unitButtonText: { fontSize: 13, fontWeight: "700", color: "#475569" },
    smallSaveBtn: { backgroundColor: "#10B981", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    saveBtnText: { color: "#FFF", fontWeight: "800", fontSize: 13 },
    logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF", marginTop: 20, paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: "#FEE2E2" },
    logoutText: { color: "#EF4444", fontSize: 15, fontWeight: "800", marginLeft: 10 },
    footer: { marginTop: 40, alignItems: "center" },
    versionText: { fontSize: 12, fontWeight: "600", color: "#94A3B8" },
    footerNote: { fontSize: 11, color: "#CBD5E1", marginTop: 4 },
    modalBackdrop: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
    modalContent: { backgroundColor: "#FFF", width: "100%", borderRadius: 24, padding: 24, alignItems: "center" },
    modalTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A", marginBottom: 8 },
    modalSub: { fontSize: 14, color: "#64748B", textAlign: "center", marginBottom: 20 },
    modalInput: { width: "100%", backgroundColor: "#F8FAFC", borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E2E8F0" },
    modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
    modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
    modalCancel: { backgroundColor: "#F1F5F9" },
    modalAction: { backgroundColor: "#3B82F6" },
    modalDelete: { backgroundColor: "#EF4444" },
    modalCancelText: { color: "#475569", fontWeight: "700" },
    modalActionText: { color: "#FFF", fontWeight: "700" },
    modalDeleteText: { color: "#FFF", fontWeight: "700" },
});
