import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './vitest.setup.ts',
        include: ['**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'vitest.setup.ts',
                '**/*.d.ts',
                '**/*.config.*',
                '**/mockData/*',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './'),
            '@components': path.resolve(__dirname, './components'),
            '@app': path.resolve(__dirname, './app'),
            'react-native': 'react-native-web',
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
    server: {
        deps: {
            inline: ['react-native', '@react-native', 'expo'],
        },
    },
});
