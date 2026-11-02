import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', disabled = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.base, styles[variant], (pressed || disabled) && styles.dimmed]}
    >
      <Text
        style={[styles.label, variant === 'primary' ? styles.labelPrimary : styles.labelOther, variant === 'danger' && styles.labelDanger]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.danger },
  dimmed: { opacity: 0.5 },
  label: { fontSize: 16, fontWeight: '600' },
  labelPrimary: { color: colors.primaryText },
  labelOther: { color: colors.text },
  labelDanger: { color: colors.danger },
});
