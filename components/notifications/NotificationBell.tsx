import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { notificationService } from "../../services/NotificationService";

/**
 * Real-time Notification Bell Component
 */
export default function NotificationBell({ color = "#1E293B" }: { color?: string }) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(notificationService.getUnreadCount());

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((count) => {
      console.log("🔔 NotificationBell: Unread count updated to", count);
      setUnreadCount(count);
    });
    return unsubscribe;
  }, []);

  const handlePress = () => {
    console.log("🔔 NotificationBell: Press detected, navigating to /notifications");
    router.push("/notifications" as any);
  };

  return (
    <TouchableOpacity
      style={styles.bellWrapper}
      onPress={handlePress}
      activeOpacity={0.7}
      hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
    >
      <Ionicons name="notifications-outline" size={24} color={color} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bellWrapper: {
    padding: 4,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#EF4444",
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
});
