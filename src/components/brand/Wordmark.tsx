import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from './AppIcon';
import { DumbbellMark } from './DumbbellMark';

export type WordmarkProps = {
  variant?: 'stacked' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
};

const STACKED_ICON_SIZE = { sm: 36, md: 48, lg: 64 };
const STACKED_ICON_RADIUS = { sm: 9, md: 12, lg: 16 };
const STACKED_TITLE_SIZE = { sm: 14, md: 18, lg: 24 };
const STACKED_SUB_SIZE = { sm: 8, md: 10, lg: 12 };

const INLINE_MARK_SIZE = { sm: 20, md: 26, lg: 34 };
const INLINE_TEXT_SIZE = { sm: 13, md: 16, lg: 20 };

const CREAM = '#EFE6D4';
const PINK = '#FF2D87';
const PINK_SOFT = '#FF7AB0';

export function Wordmark({ variant = 'stacked', size = 'md', testID }: WordmarkProps) {
  if (variant === 'inline') {
    const markSize = INLINE_MARK_SIZE[size];
    const textSize = INLINE_TEXT_SIZE[size];
    return (
      <View style={styles.row} testID={testID}>
        <DumbbellMark size={markSize} color={PINK} />
        <Text style={[styles.inlineText, { fontSize: textSize, color: CREAM }]}>
          knyazeva
          <Text style={{ color: PINK }}>.</Text>
          team
        </Text>
      </View>
    );
  }

  const iconSize = STACKED_ICON_SIZE[size];
  const iconRadius = STACKED_ICON_RADIUS[size];
  const titleSize = STACKED_TITLE_SIZE[size];
  const subSize = STACKED_SUB_SIZE[size];

  return (
    <View style={styles.row} testID={testID}>
      <AppIcon size={iconSize} radius={iconRadius} />
      <View style={styles.stackedLabel}>
        <Text style={[styles.stackedTitle, { fontSize: titleSize }]}>KNYAZEVA</Text>
        <Text style={[styles.stackedSub, { fontSize: subSize }]}>TEAM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stackedLabel: {
    justifyContent: 'center',
  },
  stackedTitle: {
    fontWeight: '800',
    letterSpacing: 0.7,
    color: CREAM,
    lineHeight: 18,
  },
  stackedSub: {
    fontWeight: '600',
    letterSpacing: 4,
    color: PINK_SOFT,
    marginTop: 4,
  },
  inlineText: {
    fontWeight: '800',
    letterSpacing: 1,
  },
});
