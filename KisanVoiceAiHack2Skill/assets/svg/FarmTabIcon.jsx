import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

const FarmTabIcon = ({ width = 22, height = 22, color = '#FFF', ...props }) => (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
        <Path d="M12 2C8 6 4 9 4 13a8 8 0 0016 0c0-4-4-7-8-11z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M12 22v-9M8 17l4-4 4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export default FarmTabIcon;
