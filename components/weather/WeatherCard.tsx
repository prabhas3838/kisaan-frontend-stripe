import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import * as Lucide from "lucide-react-native";

interface WeatherCardProps {
    label: string;
    value: string;
    unit: string;
    icon: keyof typeof Lucide;
    color: string;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ label, value, unit, icon, color }) => {
    const IconComponent = Lucide[icon] as any;

    return (
        <View style={styles.card}>
            <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
                <IconComponent size={24} color={color} />
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>
                    {value}
                    <Text style={styles.unit}>{unit}</Text>
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        flexDirection: "row",
        alignItems: "center",
        width: Dimensions.get("window").width / 2 - 28,
        marginBottom: 16,
        // Shadow for iOS
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        // Elevation for Android
        elevation: 3,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    infoContainer: {
        flex: 1,
    },
    label: {
        fontSize: 12,
        color: "#64748B",
        fontWeight: "600",
        marginBottom: 2,
    },
    value: {
        fontSize: 18,
        fontWeight: "800",
        color: "#0F172A",
    },
    unit: {
        fontSize: 12,
        fontWeight: "600",
        color: "#94A3B8",
        marginLeft: 2,
    },
});

export default WeatherCard;
