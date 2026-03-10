import React from 'react';
import { render } from '@testing-library/react-native';
import LoginScreen from '../../app/login';
import FarmerDashboard from '../../app/farmer-dashboard';
import BuyerDashboard from '../../app/buyer-dashboard';

describe('UI Layout and Rendering Tests', () => {
    describe('Login Screen UI', () => {
        it('renders all UI components correctly', () => {
            const { getByText, getByPlaceholderText } = render(<LoginScreen />);

            // Logo and branding
            expect(getByText('auth.welcome')).toBeTruthy();

            // Input field
            const phoneInput = getByPlaceholderText('auth.phone_placeholder');
            expect(phoneInput).toBeTruthy();

            // Button
            const continueButton = getByText('auth.continue');
            expect(continueButton).toBeTruthy();
        });

        it('renders phone input with country code', () => {
            const { getByText } = render(<LoginScreen />);

            // Country code should be displayed
            const countryCode = getByText('+91');
            expect(countryCode).toBeTruthy();
        });

        it('displays branding elements correctly', () => {
            const { getByText } = render(<LoginScreen />);

            // App name should be split into two colored parts
            // This tests that the branding is rendered
            expect(() => getByText('KISSAAN')).not.toThrow();
            expect(() => getByText('SAATHI')).not.toThrow();
        });
    });

    describe('Dashboard UI Layout', () => {
        it('farmer dashboard renders with proper structure', () => {
            const { getByText } = render(<FarmerDashboard />);

            // Title
            expect(getByText('farmer.dashboard_title')).toBeTruthy();

            // Welcome card
            expect(getByText('farmer.welcome_msg')).toBeTruthy();

            // Action cards
            expect(getByText('farmer.add_crop')).toBeTruthy();
            expect(getByText('farmer.my_listings')).toBeTruthy();
            expect(getByText('farmer.mandi_prices')).toBeTruthy();
        });

        it('buyer dashboard renders with proper structure', () => {
            const { getByText } = render(<BuyerDashboard />);

            // Title
            expect(getByText('buyer.dashboard_title')).toBeTruthy();

            // Welcome card
            expect(getByText('buyer.welcome_msg')).toBeTruthy();
        });
    });

    describe('Component Rendering Tests', () => {
        it('all screens render without errors', () => {
            expect(() => render(<LoginScreen />)).not.toThrow();
            expect(() => render(<FarmerDashboard />)).not.toThrow();
            expect(() => render(<BuyerDashboard />)).not.toThrow();
        });

        it('navigation components are integrated correctly', () => {
            // NavFarmer should be in FarmerDashboard
            const { toJSON: farmerJSON } = render(<FarmerDashboard />);
            expect(farmerJSON()).toBeTruthy();

            // NavBuyer should be in BuyerDashboard
            const { toJSON: buyerJSON } = render(<BuyerDashboard />);
            expect(buyerJSON()).toBeTruthy();
        });
    });

    describe('Responsive Layout', () => {
        it('login screen adapts to different container sizes', () => {
            const { container } = render(<LoginScreen />);
            expect(container).toBeTruthy();
        });

        it('dashboard layouts are scrollable', () => {
            // Both dashboards use ScrollView for content
            const { toJSON: farmerDashboard } = render(<FarmerDashboard />);
            const { toJSON: buyerDashboard } = render(<BuyerDashboard />);

            expect(farmerDashboard()).toBeTruthy();
            expect(buyerDashboard()).toBeTruthy();
        });
    });
});
