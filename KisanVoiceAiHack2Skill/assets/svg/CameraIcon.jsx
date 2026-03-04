import * as React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const CameraIcon = ({ width = 24, height = 24, color = '#E65100', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Rect x="2" y="6" width="20" height="14" rx="3" fill={color} opacity={0.12} />
        <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth="1.8" />
    </Svg>
);

export default CameraIcon;
