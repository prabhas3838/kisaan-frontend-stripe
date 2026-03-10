import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
    colorScheme: ColorSchemeName;
    setColorScheme: (scheme: ColorSchemeName) => void;
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [colorScheme, setScheme] = useState<ColorSchemeName>('light');

    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme === 'dark' || savedTheme === 'light') {
                setScheme(savedTheme);
            }
        };
        loadTheme();
    }, []);

    const setColorScheme = async (scheme: ColorSchemeName) => {
        setScheme(scheme);
        if (scheme) {
            await AsyncStorage.setItem('theme', scheme);
        } else {
            await AsyncStorage.removeItem('theme');
        }
    };

    const toggleTheme = () => {
        const next = colorScheme === 'dark' ? 'light' : 'dark';
        setColorScheme(next);
    };

    return (
        <ThemeContext.Provider value={{ colorScheme, setColorScheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
