// Mock API responses for testing

export const mockAuthResponses = {
    sendOtpSuccess: {
        data: {
            success: true,
            message: 'OTP sent successfully',
        },
    },
    sendOtpFailure: {
        data: {
            success: false,
            message: 'Failed to send OTP',
        },
    },
    invalidPhone: {
        response: {
            data: {
                message: 'Invalid phone number',
            },
        },
    },
};

export const mockMandiData = [
    {
        mandiId: 'm1',
        mandiName: 'APMC Mandi - Ameerpet',
        crop: 'Tomato',
        price: 30,
        unit: 'Rs/kg',
        updatedAt: new Date().toISOString(),
        quality: 'Premium',
    },
    {
        mandiId: 'm2',
        mandiName: 'APMC Mandi - Secunderabad',
        crop: 'Onion',
        price: 40,
        unit: 'Rs/kg',
        updatedAt: new Date().toISOString(),
        quality: 'Average',
    },
    {
        mandiId: 'm3',
        mandiName: 'APMC Mandi - Kukatpally',
        crop: 'Potato',
        price: 25,
        unit: 'Rs/kg',
        updatedAt: new Date().toISOString(),
        quality: 'FAQ',
    },
];

export const mockUserData = {
    farmer: {
        id: 'farmer123',
        phone: '9876543210',
        role: 'farmer',
        name: 'Test Farmer',
    },
    buyer: {
        id: 'buyer123',
        phone: '9876543211',
        role: 'buyer',
        name: 'Test Buyer',
    },
};
