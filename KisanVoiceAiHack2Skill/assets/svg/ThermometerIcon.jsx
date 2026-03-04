import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const ThermometerIcon = ({ width = 24, height = 24, color = '#E53935', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" fill={color} opacity={0.1} />
        <Path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" stroke={color} strokeWidth="1.8" />
        <Circle cx="11.5" cy="17.5" r="2" fill={color} />
    </Svg>
);

export default ThermometerIcon;
