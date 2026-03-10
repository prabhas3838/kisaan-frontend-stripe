import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  Switch,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;

  fontScale: number; // 1, 1.1, 1.2 etc
  setFontScale: (v: number) => void;

  highContrast: boolean;
  setHighContrast: (v: boolean) => void;

  // If you want language switching, pass handlers
  language: string; // "en" | "hi" | ...
  setLanguage: (lang: string) => void;
};

export default function AccessibilitySheet({
  visible,
  onClose,
  fontScale,
  setFontScale,
  highContrast,
  setHighContrast,
  language,
  setLanguage,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet} accessibilityRole="summary">

        <Text style={styles.title}>Accessibility</Text>

        {/* Text size */}
        <View style={styles.row}>
          <Text style={styles.label}>Text size</Text>
          <View style={styles.pillRow}>
            {[1, 1.1, 1.2].map((v) => (
              <Pressable
                key={v}
                onPress={() => setFontScale(v)}
                style={[
                  styles.pill,
                  fontScale === v && styles.pillActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Set text size to ${v}`}
              >
                <Text style={[styles.pillText, fontScale === v && styles.pillTextActive]}>
                  {v === 1 ? "A" : v === 1.1 ? "A+" : "A++"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Contrast */}
        <View style={styles.row}>
          <Text style={styles.label}>High contrast</Text>
          <Switch value={highContrast} onValueChange={setHighContrast} />
        </View>

        {/* Language */}
        <View style={styles.row}>
          <Text style={styles.label}>Language</Text>
          <View style={styles.pillRow}>
            {[
              { k: "en", t: "English" },
              { k: "hi", t: "हिंदी" },
              { k: "ta", t: "தமிழ்" },
              { k: "ml", t: "മലയാളം" },
              { k: "te", t: "తెలుగు" },
            ].map((x) => (
              <Pressable
                key={x.k}
                onPress={() => setLanguage(x.k)}
                style={[
                  styles.pill,
                  language === x.k && styles.pillActive,
                ]}
              >
                <Text style={[styles.pillText, language === x.k && styles.pillTextActive]}>
                  {x.t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 110,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 10,
  },
  row: {
    marginTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 700,
    borderWidth: 1,
    borderColor: "#d0d0d0",
    backgroundColor: "#fafafa",
  },
  pillActive: {
    borderColor: "#1f5fa6",
    backgroundColor: "#eaf2ff",
  },
  pillText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },
  pillTextActive: {
    color: "#1f5fa6",
  },
  closeBtn: {
    marginTop: 16,
    alignSelf: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#1f5fa6",
  },
  closeText: {
    color: "#fff",
    fontWeight: "800",
  },
});
