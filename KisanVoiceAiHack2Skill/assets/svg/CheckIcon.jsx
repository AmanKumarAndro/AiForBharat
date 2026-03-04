import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const CheckIcon = ({ width = 24, height = 24, color = '#4CAF50', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export default CheckIcon;
