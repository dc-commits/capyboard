import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Pastille sélectionnable (tri, filtres, choix exclusifs) */
export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { fontSize: 14, color: colors.text },
  selectedText: { color: colors.primaryText, fontWeight: '600' },
});
