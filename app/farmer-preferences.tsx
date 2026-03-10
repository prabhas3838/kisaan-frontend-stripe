import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import NavFarmer from "../components/navigation/NavFarmer";


/**
 * FarmerPreferences Page
 *
 * Description:
 * Preferences screen for Farmer users.
 * Allows management of crop preferences and notification settings.
 *
 * Loaded When:
 * - User navigates to /farmer-preferences route
 *
 * Responsibilities:
 * - Render farmer navigation bar
 * - Display preferences configuration section (placeholder for future implementation)
 *
 * Dependencies:
 * - NavFarmer component
 * - expo-router Stack configuration
 *
 * Inputs:
 * - Static UI placeholder
 *
 * Outputs:
 * - Renders preferences screen UI
 */


export default function FarmerPreferences() {
    return (
        <>
            {/* Hide default header (custom navigation handled via NavFarmer) */}
            <Stack.Screen options={{ headerShown: false }} />
            <View style={styles.container}>
                <NavFarmer />

                <View style={styles.content}>
                    <Text style={styles.title}>Preferences</Text>
                    <Text style={styles.placeholder}>
                        Manage your crop preferences and notification settings.
                    </Text>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#1a4b84",
        marginBottom: 16,
    },
    placeholder: {
        fontSize: 16,
        color: "#64748b",
    },
});
