// Mock Expo modules
jest.mock('expo-router', () => ({
    router: {
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    },
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
    Stack: {
        Screen: 'MockScreen',
    },
}));

jest.mock('expo-font', () => ({
    loadAsync: jest.fn(),
    isLoaded: jest.fn(() => true),
    isLoading: jest.fn(() => false),
}));

jest.mock('lucide-react-native', () => ({
    Bell: 'Bell',
    Menu: 'Menu',
    Home: 'Home',
    ShoppingCart: 'ShoppingCart',
    User: 'User',
    Package: 'Package',
}));

jest.mock('@expo/vector-icons', () => ({
    Ionicons: 'Ionicons',
    MaterialIcons: 'MaterialIcons',
    FontAwesome: 'FontAwesome',
}));

jest.mock('expo-asset');
jest.mock('expo-constants', () => ({
    expoConfig: {},
    manifest: {},
}));

jest.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            changeLanguage: jest.fn(),
            language: 'en',
        },
    }),
    initReactI18next: {
        type: '3rdParty',
        init: jest.fn(),
    },
}));

// Mock axios
jest.mock('axios', () => ({
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(() => ({
        post: jest.fn(),
        get: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
    })),
}));

// Suppress console warnings in tests
global.console = {
    ...console,
    warn: jest.fn(),
    error: jest.fn(),
};

// Set up test timeout
jest.setTimeout(10000);
