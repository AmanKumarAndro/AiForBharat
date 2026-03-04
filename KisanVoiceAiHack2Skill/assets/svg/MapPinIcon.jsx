import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const MapPinIcon = ({ width = 24, height = 24, color = '#E53935', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" fill={color} opacity={0.1} />
        <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={color} strokeWidth="1.8" />
        <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" />
    </Svg>
);

export default MapPinIcon;
