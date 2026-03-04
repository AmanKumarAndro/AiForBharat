import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const ChevronRightIcon = ({ width = 24, height = 24, color = '#1B5E20', strokeWidth = 2.2, ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export default ChevronRightIcon;
