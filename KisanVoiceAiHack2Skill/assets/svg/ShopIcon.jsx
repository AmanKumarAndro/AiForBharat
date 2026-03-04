import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

const ShopIcon = ({ width = 24, height = 24, color = '#2E7D32', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Rect x="3" y="10" width="18" height="11" rx="1" fill={color} opacity={0.1} />
        <Path d="M3 10h18M3 10l1-4h16l1 4M3 10v11h18V10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M8 21v-5h8v5" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 3v3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
);

export default ShopIcon;
