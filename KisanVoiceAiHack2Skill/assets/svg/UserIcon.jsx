import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const UserIcon = ({ width = 24, height = 24, color = '#1B5E20', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Circle cx="12" cy="8" r="4" fill={color} opacity={0.12} />
        <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
        <Path d="M20 21a8 8 0 10-16 0" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
);

export default UserIcon;
