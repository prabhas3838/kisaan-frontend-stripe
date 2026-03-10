import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../../app/login';
import FarmerDashboard from '../../app/farmer-dashboard';
import BuyerDashboard from '../../app/buyer-dashboard';

describe('Baseline Snapshot Tests - Regression', () => {
    it('matches Login screen snapshot', () => {
        const { toJSON } = render(<LoginScreen />);
        expect(toJSON()).toMatchSnapshot();
    });

    it('matches Farmer Dashboard snapshot', () => {
        const { toJSON } = render(<FarmerDashboard />);
        expect(toJSON()).toMatchSnapshot();
    });

    it('matches Buyer Dashboard snapshot', () => {
        const { toJSON } = render(<BuyerDashboard />);
        expect(toJSON()).toMatchSnapshot();
    });

    it('verifies Login screen structure has not changed', () => {
        const { getByText, getByPlaceholderText } = render(<LoginScreen />);

        // These elements should always be present
        const expectedElements = [
            'auth.welcome',
            'auth.enter_phone',
            'auth.continue',
            'auth.phone_placeholder',
        ];

        expectedElements.forEach((element) => {
            if (element === 'auth.phone_placeholder') {
                expect(getByPlaceholderText(element)).toBeTruthy();
            } else {
                expect(getByText(element)).toBeTruthy();
            }
        });
    });

    it('regression: farmer dashboard maintains all action cards', () => {
        const { getByText } = render(<FarmerDashboard />);

        // These features should remain after any changes
        const criticalFeatures = [
            'farmer.add_crop',
            'farmer.my_listings',
            'farmer.mandi_prices',
        ];

        criticalFeatures.forEach((feature) => {
            expect(getByText(feature)).toBeTruthy();
        });
    });
});
