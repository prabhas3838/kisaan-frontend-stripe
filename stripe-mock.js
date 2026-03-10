// Mock for @stripe/stripe-react-native to prevent Webpack/Metro crashes on Expo Web
import React from 'react';

export const StripeProvider = ({ children }: any) => <>{children}</>;
export const useStripe = () => ({
    initPaymentSheet: async () => ({ error: { message: "Stripe UI not supported on Web" } }),
    presentPaymentSheet: async () => ({ error: { message: "Stripe UI not supported on Web" } }),
});
