import * as React from "react";
import Svg, { Path } from "react-native-svg";

const BackIconSvg = ({
  width = 32,
  height = 32,
  stroke = "#253C51",
  strokeWidth = 2,
  ...props
}) => (
  <Svg
    width={width}
    height={height}
    viewBox="0 0 32 32"
    fill="none"
    {...props}
  >
    <Path
      d="M21 6L11 16L21 26"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default BackIconSvg;
