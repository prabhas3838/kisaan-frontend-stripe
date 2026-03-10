const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Override resolution on Web platforms to avoid native module crashes
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && moduleName === '@stripe/stripe-react-native') {
        return {
            filePath: require('path').resolve(__dirname, 'stripe-mock.js'),
            type: 'sourceFile',
        };
    }
    if (platform === 'web' && moduleName === 'react-native-maps') {
        return {
            filePath: require('path').resolve(__dirname, 'react-native-maps-mock.js'),
            type: 'sourceFile',
        };
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
