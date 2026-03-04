import * as React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const TractorIcon = ({ width = 24, height = 24, color = '#E65100', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Rect x="5" y="8" width="10" height="6" rx="1" fill={color} opacity={0.12} />
        <Path d="M5 16V8h4l3-3h4v5h3l1 3v3h-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M5 16H3v-3l2-1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="7" cy="17" r="2" stroke={color} strokeWidth="1.5" />
        <Circle cx="17" cy="17" r="2" stroke={color} strokeWidth="1.5" />
    </Svg>
);

export default TractorIcon;
