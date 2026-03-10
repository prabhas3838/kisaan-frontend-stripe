import { vi } from 'vitest';

// Simple vitest setup without React Native testing library dependencies
// This avoids "typeof" syntax errors from React Native modules

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
    default: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
    },
}));

// Mock expo-router
vi.mock('expo-router', () => ({
    useRouter: () => ({
        push: vi.fn(),
        back: vi.fn(),
        replace: vi.fn(),
    }),
    Stack: {
        Screen: ({ children }: any) => children,
    },
    useFocusEffect: (callback: () => void) => {
        callback();
    },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            changeLanguage: vi.fn(),
            language: 'en',
        },
    }),
}));
