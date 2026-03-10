import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FarmerDashboard from '../../app/farmer-dashboard';

describe('Farmer Dashboard - Functional Tests', () => {
    it('renders dashboard with title', () => {
        const { getByText } = render(<FarmerDashboard />);

        expect(getByText('farmer.dashboard_title')).toBeTruthy();
    });

    it('displays welcome message and subtitle', () => {
        const { getByText } = render(<FarmerDashboard />);

        expect(getByText('farmer.welcome_msg')).toBeTruthy();
        expect(getByText('farmer.welcome_sub')).toBeTruthy();
    });

    it('shows all quick action cards', () => {
        const { getByText } = render(<FarmerDashboard />);

        expect(getByText('farmer.add_crop')).toBeTruthy();
        expect(getByText('farmer.add_crop_sub')).toBeTruthy();

        expect(getByText('farmer.my_listings')).toBeTruthy();
        expect(getByText('farmer.my_listings_sub')).toBeTruthy();

        expect(getByText('farmer.mandi_prices')).toBeTruthy();
        expect(getByText('farmer.mandi_prices_sub')).toBeTruthy();
    });

    it('navigates to add-crop screen when action card clicked', () => {
        const mockRouter = require('expo-router').useRouter();
        const { getByText } = render(<FarmerDashboard />);

        const addCropButton = getByText('farmer.add_crop');
        fireEvent.press(addCropButton);

        expect(mockRouter.push).toHaveBeenCalledWith('/add-crop');
    });

    it('navigates to my-listings screen when action card clicked', () => {
        const mockRouter = require('expo-router').useRouter();
        const { getByText } = render(<FarmerDashboard />);

        const myListingsButton = getByText('farmer.my_listings');
        fireEvent.press(myListingsButton);

        expect(mockRouter.push).toHaveBeenCalledWith('/my-listings');
    });

    it('navigates to mandi-prices screen when action card clicked', () => {
        const mockRouter = require('expo-router').useRouter();
        const { getByText } = render(<FarmerDashboard />);

        const mandiPricesButton = getByText('farmer.mandi_prices');
        fireEvent.press(mandiPricesButton);

        expect(mockRouter.push).toHaveBeenCalledWith('/mandi-prices');
    });
});
