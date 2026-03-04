import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const DropletIcon = ({ width = 24, height = 24, color = '#2196F3', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" fill={color} opacity={0.15} />
        <Path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0L12 2.69z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export default DropletIcon;
