import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, Text, View, SafeAreaView } from "react-native";
import NavBuyer from "../components/navigation/NavBuyer";


export default function BuyerPreferencesScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: "Preferences", headerShown: false }} />
            <NavBuyer />

            <View style={styles.center}>
                <Text style={styles.title}>Buyer Preferences</Text>
                <Text style={styles.sub}>Coming Soon</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },
    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    title: { fontSize: 20, fontWeight: "700", color: "#1e293b" },
    sub: { fontSize: 14, color: "#64748b", marginTop: 8 },
});
