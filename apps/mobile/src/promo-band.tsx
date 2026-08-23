import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import { colors, spacing } from '@/theme';

/**
 * The promotional band, matching the web app's.
 *
 * Full-bleed brand colour above the content on every screen. It advertises no
 * offer — the product is free, so it carries the one thing that is both true
 * and worth saying, rather than a fabricated discount.
 */
export function PromoBand() {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];

  return (
    <View style={[styles.band, { backgroundColor: theme.promo }]}>
      <Text style={[styles.text, { color: theme.promoFg }]}>
        Free and open source — your sessions never leave your server
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  band: { paddingVertical: 7, paddingHorizontal: spacing.lg },
  text: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
