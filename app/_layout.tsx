import { Stack, useRouter, usePathname, useSegments } from "expo-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// import VoiceNavButton from "../components/VoiceNavBtn"; // Disabled - requires native module build
import AccessibilityFab from "../components/accessibilityBtn";
import AccessibilitySheet from "../components/accessibilitySheet";
import { notificationService } from "../services/NotificationService";
import { setLanguage as persistLanguage } from "../i18n/i18n";
import { ThemeProvider } from "../hooks/ThemeContext";
import { useColorScheme } from "../hooks/use-color-scheme";
import { Colors } from "../constants/theme";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
}

function InnerLayout() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [language, setLang] = useState(i18n.language || "en");

  // Authentication & Role Guard logic
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      const role = await AsyncStorage.getItem("role");

      const inAuthGroup = (segments[0] as any) === "(auth)" ||
        pathname === "/login" ||
        pathname === "/verify" ||
        pathname === "/signin" ||
        pathname === "/set-pin" ||
        pathname === "/profile-setup" ||
        pathname === "/profile-location";

      if (!token && !inAuthGroup) {
        // Redirect to login if not authenticated
        setTimeout(() => router.replace("/login"), 0);
      } else if (token && role) {
        // Init notifications
        notificationService.init();

        // Role based dashboard redirection if on home/index or wrong dashboard
        if (pathname === "/" || pathname === "/index") {
          if (role === "admin") {
            router.replace("/admin-dashboard");
          } else {
            router.replace(role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard");
          }
        }

        if (role === "buyer") {
          const farmerOnly = ["/farmer-dashboard", "/invoices", "/govt-schemes", "/farmer-auctions", "/create-auction"];
          const adminOnly = ["/admin-dashboard"];
          if ([...farmerOnly, ...adminOnly].some(p => pathname.startsWith(p))) router.replace("/buyer-dashboard");
        }
        if (role === "farmer") {
          const buyerOnly = ["/buyer-dashboard", "/buyer-auctions", "/my-bids"];
          const adminOnly = ["/admin-dashboard"];
          if ([...buyerOnly, ...adminOnly].some(p => pathname.startsWith(p))) router.replace("/farmer-dashboard");
        }

        if (role !== "admin" && pathname.startsWith("/admin-dashboard")) {
          router.replace(role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard");
        }


      }
    };

    checkAuth();
  }, [segments, pathname]);

  const setLanguage = async (lang: string) => {
    setLang(lang);
    await persistLanguage(lang);
  };

  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? 'light'].background;

  return (
    <View style={[styles.root, { backgroundColor }]}>
      {/* Screens */}
      <Stack
        initialRouteName="login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" }
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="marketplace" />
        <Stack.Screen name="weather" />
      </Stack>

      {/* Floating overlay ABOVE everything */}
      <View pointerEvents="box-none" style={styles.overlay}>
        <AccessibilityFab onPress={() => setOpen(true)} />
        {/* <VoiceNavButton /> */} {/* Disabled - requires native module build */}
      </View>

      {/* Sheet */}
      <AccessibilitySheet
        visible={open}
        onClose={() => setOpen(false)}
        fontScale={fontScale}
        setFontScale={setFontScale}
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        language={language}
        setLanguage={setLanguage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    elevation: 999999,
  },
});

