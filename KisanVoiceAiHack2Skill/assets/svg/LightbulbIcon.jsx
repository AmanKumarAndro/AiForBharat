import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const LightbulbIcon = ({ width = 24, height = 24, color = '#F9A825', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.65V17h8v-2.35A7 7 0 0012 2z" fill={color} opacity={0.15} />
        <Path d="M12 2a7 7 0 00-4 12.65V17h8v-2.35A7 7 0 0012 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9 18h6M10 22h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
);

export default LightbulbIcon;
