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
import { useRouter, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationBell from "../notifications/NotificationBell";

/**
 * NavFarmer (Simplified Top Navbar)
 * - LEFT: App Name ("KrishiConnect")
 * - CENTER: Current Page Name (Dynamic)
 * - RIGHT: Notifications (Bell + Count) + Profile Avatar
 */

export default function NavFarmer() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

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

  // Helper to get Page Title from Pathname
  const getPageTitle = (path: string) => {
    if (path.includes("farmer-dashboard")) return "Dashboard";
    if (path.includes("buyer-dashboard")) return "Dashboard";
    if (path.includes("marketplace")) return "Marketplace";
    if (path.includes("buyer-marketplace")) return "Marketplace";
    if (path.includes("mandi-prices")) return "Mandi Prices";
    if (path.includes("market-insights") || path.includes("ai-insights")) return "Price Insights";
    if (path.includes("messages")) return "Messages";
    if (path.includes("chat")) return "Chat";
    if (path.includes("alerts")) return "Alerts";
    if (path.includes("edit-profile")) return "Edit Profile";
    if (path.includes("invoices")) return "Invoices";
    if (path.includes("govt-schemes")) return "Govt Schemes";
    if (path.includes("watchlist")) return "Watchlist";
    if (path.includes("call-support")) return "Support Center";
    if (path.includes("negotiations")) return "Negotiations";
    if (path.includes("sms-info")) return "Offline Access";
    if (path.includes("verification")) return "Verification";
    if (path.includes("live-auc")) return "Live Auctions";
    if (path.includes("weather")) return "Farm Weather";
    if (path.includes("profile") && !path.includes("edit")) return "My Profile";
    return "Home";
  };


  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.navbar}>
        {/* LEFT: App Name */}
        <View style={styles.leftSection}>
          <Text style={styles.logoText}>KrishiConnect</Text>
        </View>

        {/* CENTER: Page Title */}
        <View style={styles.centerSection}>
          <Text style={styles.pageTitle}>{getPageTitle(pathname)}</Text>
        </View>

        {/* RIGHT: Notifications + Profile */}
        <View style={styles.rightSection}>
          <NotificationBell />

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setProfileOpen(!profileOpen)}
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Dropdown */}
      {profileOpen && (
        <>
          <Pressable style={styles.backdrop} onPress={() => setProfileOpen(false)} />
          <Animated.View style={[styles.dropdown, styles.profileDropdown, {
            opacity: profileAnim,
            transform: [{ scale: profileAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }]
          }]}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Farmer Account</Text>
            </View>
            <ProfileItem icon="person-outline" label="Edit Profile" onPress={() => { setProfileOpen(false); router.push("/edit-profile" as any); }} />
            <ProfileItem icon="cloudy-night-outline" label="Farm Weather" onPress={() => { setProfileOpen(false); router.push("/weather" as any); }} />
            <ProfileItem icon="shield-checkmark-outline" label="Verification & Trust" onPress={() => setProfileOpen(false)} />
            <ProfileItem icon="settings-outline" label="Settings" onPress={() => { setProfileOpen(false); router.push("/settings" as any); }} />
            <View style={styles.divider} />
            <ProfileItem icon="log-out-outline" label="Logout" danger onPress={() => { setProfileOpen(false); router.replace("/login" as any); }} />
          </Animated.View>
        </>
      )}
    </View>
  );
}

function ProfileItem({ icon, label, onPress, danger = false }: any) {
  return (
    <TouchableOpacity style={styles.dropdownItem} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? "#EF4444" : "#475569"} style={{ marginRight: 12 }} />
      <Text style={[styles.dropdownText, danger && { color: "#EF4444" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFF",
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  leftSection: {
    flex: 1.2,
    justifyContent: "center",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  centerSection: {
    flex: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  rightSection: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  profileButton: {
    marginLeft: 4,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1D4ED8",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#DBEAFE",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    zIndex: 1500,
  },
  dropdown: {
    position: "absolute",
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    zIndex: 2000,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  profileDropdown: {
    top: 110,
    right: 16,
    width: 220,
    padding: 8,
  },
  dropdownHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 8,
  },
});