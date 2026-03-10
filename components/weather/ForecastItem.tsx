import React from "react";
import { View, Text, StyleSheet } from "react-native";
import * as Lucide from "lucide-react-native";

interface ForecastItemProps {
    time: string;
    temp: number;
    condition: "sunny" | "cloudy" | "rainy" | "stormy";
}

const ForecastItem: React.FC<ForecastItemProps> = ({ time, temp, condition }) => {
    const getIcon = () => {
        switch (condition) {
            case "sunny":
                return <Lucide.Sun size={24} color="#F59E0B" />;
            case "cloudy":
                return <Lucide.Cloud size={24} color="#94A3B8" />;
            case "rainy":
                return <Lucide.CloudRain size={24} color="#3B82F6" />;
            case "stormy":
                return <Lucide.CloudLightning size={24} color="#6366F1" />;
            default:
                return <Lucide.Sun size={24} color="#F59E0B" />;
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.time}>{time}</Text>
            <View style={styles.iconContainer}>{getIcon()}</View>
            <Text style={styles.temp}>{Math.round(temp)}°</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 12,
        alignItems: "center",
        marginRight: 12,
        width: 80,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        // Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    time: {
        fontSize: 13,
        fontWeight: "700",
        color: "#64748B",
        marginBottom: 10,
    },
    iconContainer: {
        marginBottom: 10,
    },
    temp: {
        fontSize: 16,
        fontWeight: "800",
        color: "#0F172A",
    },
});

export default ForecastItem;
