import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { Platform } from "react-native";

import en from "./en.json";
import hi from "./hi.json";
import ml from "./ml.json";
import ta from "./ta.json";
import te from "./te.json";

const LANGUAGE_KEY = "lang";

// Lazy-load AsyncStorage only on native
async function getAsyncStorage() {
  if (Platform.OS === "web") return null;
  const mod = await import("@react-native-async-storage/async-storage");
  return mod.default;
}

async function getSavedLanguage() {
  try {
    // ✅ Web: use localStorage
    if (Platform.OS === "web") {
      return localStorage.getItem(LANGUAGE_KEY) || "en";
    }

    // ✅ Native: use AsyncStorage (lazy import)
    const AsyncStorage = await getAsyncStorage();
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    return saved || "en";
  } catch {
    return "en";
  }
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    ml: { translation: ml },
    ta: { translation: ta },
    te: { translation: te },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

// ✅ load saved language after init
getSavedLanguage().then((lang) => i18n.changeLanguage(lang));

export async function setLanguage(lang) {
  i18n.changeLanguage(lang);

  try {
    if (Platform.OS === "web") {
      localStorage.setItem(LANGUAGE_KEY, lang);
      return;
    }
    const AsyncStorage = await getAsyncStorage();
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {}
}

export default i18n;
