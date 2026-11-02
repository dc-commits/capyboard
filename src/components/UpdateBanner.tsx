import * as Updates from 'expo-updates';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, common } from '@/theme';
import { updatesEnabled } from '@/utils/updates';

/** Annonce une mise à jour déjà téléchargée en arrière-plan, appliquée en un toucher */
export function UpdateBanner() {
  const { isUpdatePending } = Updates.useUpdates();
  if (!updatesEnabled || !isUpdatePending) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Redémarrer pour installer la nouvelle version"
      onPress={() => void Updates.reloadAsync()}
      style={({ pressed }) => [common.card, styles.banner, pressed && styles.pressed]}
    >
      <Text style={styles.title}>✨ Nouvelle version prête</Text>
      <Text style={styles.action}>Redémarrer ›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  pressed: { opacity: 0.8 },
  title: { fontSize: 16, fontWeight: '700', color: colors.primaryText },
  action: { fontSize: 15, fontWeight: '700', color: colors.primaryText },
});
