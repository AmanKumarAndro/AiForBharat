import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

const ClipboardIcon = ({ width = 24, height = 24, color = '#1B5E20', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Rect x="5" y="4" width="14" height="17" rx="2" fill={color} opacity={0.1} />
        <Path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Rect x="8" y="2" width="8" height="4" rx="1" stroke={color} strokeWidth="1.8" />
        <Path d="M9 12h6M9 16h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </Svg>
);

export default ClipboardIcon;
