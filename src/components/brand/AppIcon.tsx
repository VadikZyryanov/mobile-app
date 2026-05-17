import Svg, { ClipPath, Defs, G, RadialGradient, Rect, Stop } from 'react-native-svg';

import { DumbbellMarkContent } from './DumbbellMark';

export type AppIconProps = {
  size?: number;
  radius?: number;
  testID?: string;
};

// In-app preview of the Knyazeva Team app icon.
// Layered radial gradients (bg + pink glow + highlight) clipped to a squircle,
// with a pink DumbbellMark centred at ~62% of canvas.
export function AppIcon({ size = 160, radius = 38, testID }: AppIconProps) {
  // radius is given in canvas pixels; viewBox is 100×100, so scale accordingly.
  const rxVB = (radius / size) * 100;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" testID={testID}>
      <Defs>
        <RadialGradient id="iconBg" cx="0.3" cy="0.2" rx="0.8" ry="0.8" fx="0.3" fy="0.2">
          <Stop offset="0" stopColor="#1D1925" />
          <Stop offset="1" stopColor="#0A0910" />
        </RadialGradient>
        <RadialGradient id="iconPinkGlow" cx="0.7" cy="0.9" rx="0.6" ry="0.5" fx="0.7" fy="0.9">
          <Stop offset="0" stopColor="#FF2D87" stopOpacity="0.4" />
          <Stop offset="0.7" stopColor="#FF2D87" stopOpacity="0" />
          <Stop offset="1" stopColor="#FF2D87" stopOpacity="0" />
        </RadialGradient>
        <RadialGradient id="iconHighlight" cx="0.2" cy="0.1" rx="0.4" ry="0.3" fx="0.2" fy="0.1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.08" />
          <Stop offset="0.7" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
        <ClipPath id="iconSquircle">
          <Rect x={0} y={0} width={100} height={100} rx={rxVB} ry={rxVB} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#iconSquircle)">
        <Rect x={0} y={0} width={100} height={100} fill="url(#iconBg)" />
        <Rect x={0} y={0} width={100} height={100} fill="url(#iconPinkGlow)" />
        <Rect x={0} y={0} width={100} height={100} fill="url(#iconHighlight)" />
        {/* DumbbellMark at 62% scale, centred (offset 19 = (100-62)/2 ≈ 19) */}
        <G transform="translate(19, 19) scale(0.62)">
          <DumbbellMarkContent color="#FF2D87" />
        </G>
      </G>
    </Svg>
  );
}
