import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

const MicIcon = ({ width = 24, height = 24, color = '#1B5E20', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Rect x="9" y="2" width="6" height="11" rx="3" fill={color} opacity={0.15} />
        <Path d="M12 1a3 3 0 00-3 3v7a3 3 0 006 0V4a3 3 0 00-3-3z" stroke={color} strokeWidth="1.8" />
        <Path d="M19 10v1a7 7 0 01-14 0v-1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M12 18v4M8 22h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
);

export default MicIcon;
