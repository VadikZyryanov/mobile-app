import Svg, { Path, Rect } from 'react-native-svg';

export type IconProps = {
  size?: number;
  color?: string;
};

const DEFAULT_SIZE = 18;
const DEFAULT_STROKE = 1.8;

export function EnvelopeIcon({ size = DEFAULT_SIZE, color = '#EFE6D4' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={3}
        y={5}
        width={18}
        height={14}
        rx={2}
        stroke={color}
        strokeWidth={DEFAULT_STROKE}
        strokeLinejoin="round"
      />
      <Path
        d="M3 7l9 6 9-6"
        stroke={color}
        strokeWidth={DEFAULT_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LockIcon({ size = DEFAULT_SIZE, color = '#EFE6D4' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={5}
        y={11}
        width={14}
        height={10}
        rx={2}
        stroke={color}
        strokeWidth={DEFAULT_STROKE}
        strokeLinejoin="round"
      />
      <Path
        d="M8 11V8a4 4 0 018 0v3"
        stroke={color}
        strokeWidth={DEFAULT_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function UserIcon({ size = DEFAULT_SIZE, color = '#EFE6D4' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12a4 4 0 100-8 4 4 0 000 8z"
        stroke={color}
        strokeWidth={DEFAULT_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 21a8 8 0 0116 0"
        stroke={color}
        strokeWidth={DEFAULT_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function PhoneIcon({ size = DEFAULT_SIZE, color = '#EFE6D4' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={7}
        y={3}
        width={10}
        height={18}
        rx={2}
        stroke={color}
        strokeWidth={DEFAULT_STROKE}
        strokeLinejoin="round"
      />
      <Path d="M11 18h2" stroke={color} strokeWidth={DEFAULT_STROKE} strokeLinecap="round" />
    </Svg>
  );
}
