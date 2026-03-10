import React from 'react';
import { View, Text } from 'react-native';

export default function MapView(props) {
    return (
        <View style={[{ backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }, props.style]}>
            <Text style={{ color: '#64748b' }}>Interactive Map is not available on Web Preview</Text>
            {props.children}
        </View>
    );
}

export const Marker = (props) => null;
export const Callout = (props) => null;
export const Polygon = (props) => null;
export const Polyline = (props) => null;
export const Circle = (props) => null;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';
