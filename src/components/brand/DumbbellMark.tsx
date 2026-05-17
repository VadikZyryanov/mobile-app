import { Fragment } from 'react';
import Svg, { G, Line, Rect } from 'react-native-svg';

// Two crossed dumbbells with 3D depth via offset-rect shadows.
// Each Bell = 9 Rect (3×3 layers: weight L / bar / weight R) + 2 Line rims.
// Coordinates copied verbatim from design-drafts/brand.jsx:3-50.

const SHADOW = 'rgba(0,0,0,0.34)';
const RIM = 'rgba(0,0,0,0.45)';

function Bell({ fill }: { fill: string }) {
  return (
    <G>
      <Rect x={5} y={28} width={24} height={40} rx={7} fill={fill} />
      <Rect x={5} y={28} width={24} height={40} rx={7} fill={SHADOW} />
      <Rect x={2} y={33} width={24} height={40} rx={7} fill={fill} />
      <Line x1={22} y1={37} x2={22} y2={69} stroke={RIM} strokeWidth={0.7} opacity={0.55} />

      <Rect x={29} y={41} width={46} height={12} rx={6} fill={fill} />
      <Rect x={29} y={41} width={46} height={12} rx={6} fill={SHADOW} />
      <Rect x={26} y={46} width={46} height={12} rx={6} fill={fill} />

      <Rect x={75} y={28} width={24} height={40} rx={7} fill={fill} />
      <Rect x={75} y={28} width={24} height={40} rx={7} fill={SHADOW} />
      <Rect x={72} y={33} width={24} height={40} rx={7} fill={fill} />
      <Line x1={76} y1={37} x2={76} y2={69} stroke={RIM} strokeWidth={0.7} opacity={0.55} />
    </G>
  );
}

export type DumbbellMarkProps = {
  size?: number;
  color?: string;
  testID?: string;
};

// Bare paths without <Svg> wrapper — for embedding inside AppIcon, etc.
export function DumbbellMarkContent({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <Fragment>
      <G transform="rotate(-32 50 50)" opacity={0.55}>
        <Bell fill={color} />
      </G>
      <G transform="rotate(32 50 50)">
        <Bell fill={color} />
      </G>
    </Fragment>
  );
}

export function DumbbellMark({ size = 88, color = '#FFFFFF', testID }: DumbbellMarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" testID={testID}>
      <DumbbellMarkContent color={color} />
    </Svg>
  );
}
