import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, PanResponder, Pressable, StyleSheet } from "react-native";

type Props = {
  onPress: () => void;
};

export default function AccessibilityFab({ onPress }: Props) {
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      // IMPORTANT: start dragging only when user actually moves finger
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,

      onPanResponderGrant: () => {
        // keep current position as offset, then reset dx/dy to 0
        pan.setOffset({
          // @ts-ignore (RN internal value access)
          x: pan.x.__getValue(),
          // @ts-ignore
          y: pan.y.__getValue(),
        });
        pan.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: () => {
        // finalize offset so it stays where dropped
        pan.flattenOffset();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[styles.container, { transform: pan.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Accessibility options"
        accessibilityHint="Opens accessibility settings"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        hitSlop={12}
      >
        <Ionicons name="accessibility-outline" size={24} color="#fff" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16, // default position stays same
    top: 52,
    zIndex: 999,
  },
  fab: {
    width: 50,
    height: 50,
    borderRadius: 26,
    backgroundColor: "#8c8c5d",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
