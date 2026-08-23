import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useColorScheme } from 'react-native';
import { colors } from '@/theme';

/**
 * The same padlock the web and desktop apps draw.
 *
 * Geometry identical to apps/web/src/components/ui/lock-mark.tsx and
 * apps/desktop/renderer/lock-mark.tsx — change one, change all three. Three
 * copies is the price of three rendering targets; three *different* marks was
 * the thing worth fixing.
 *
 * Green because the accent is the brand and the success colour at once: the
 * mark is the thing the user is working to make appear.
 */
export function LockMark({ size = 19 }: { size?: number }) {
  const scheme = useColorScheme() ?? 'dark';
  const accent = colors[scheme].accent;

  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5"
        stroke={accent}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Rect x={3.5} y={8.5} width={13} height={8.5} rx={2} stroke={accent} strokeWidth={1.6} />
      <Circle cx={10} cy={12.75} r={1.15} fill={accent} />
    </Svg>
  );
}
