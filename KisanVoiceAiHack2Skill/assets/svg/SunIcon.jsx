import * as React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const SunIcon = ({ width = 24, height = 24, color = '#F59E0B', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Circle cx="12" cy="12" r="5" fill={color} opacity={0.2} />
        <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" />
        <Path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
);

export default SunIcon;
