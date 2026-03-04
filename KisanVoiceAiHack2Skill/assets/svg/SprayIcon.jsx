import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const SprayIcon = ({ width = 24, height = 24, color = '#2E7D32', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Path d="M8 6h4v14H8z" fill={color} opacity={0.1} />
        <Path d="M10 2v4M8 6h4v14H8V6z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 10h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Circle cx="18" cy="6" r="1" fill={color} opacity={0.6} />
        <Circle cx="20" cy="4" r="0.8" fill={color} opacity={0.4} />
        <Circle cx="16" cy="4" r="0.8" fill={color} opacity={0.4} />
        <Circle cx="18" cy="8" r="0.8" fill={color} opacity={0.4} />
    </Svg>
);

export default SprayIcon;
