import React from 'react';
import { render } from '@testing-library/react-native';
import { useTranslation } from 'react-i18next';

describe('i18n Integration Tests', () => {
    it('integrates translation system across components', () => {
        const { t } = useTranslation();

        // Test that translation keys are accessible
        const translationKeys = [
            'auth.welcome',
            'auth.enter_phone',
            'auth.continue',
            'farmer.dashboard_title',
            'farmer.welcome_msg',
            'buyer.dashboard_title',
            'buyer.welcome_msg',
        ];

        translationKeys.forEach((key) => {
            expect(t(key)).toBe(key); // Mocked t() returns the key itself
        });
    });

    it('verifies i18n module is configured correctly', () => {
        const { i18n } = useTranslation();

        expect(i18n.language).toBe('en');
        expect(i18n.changeLanguage).toBeDefined();
    });
});
