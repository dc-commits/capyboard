import { Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, common } from '@/theme';

type Props = {
  value: string;
  onChangeText: (text: string) => void;
  /** Accepte les valeurs négatives : ajoute un bouton ± à côté du champ */
  signed: boolean;
  editable?: boolean;
  placeholder?: string;
  /** Champ étroit (une colonne par joueur) : le bouton ± passe sous le champ */
  compact?: boolean;
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Inverse le signe d'une saisie : « 5 » ↔ « -5 », et « - » pour commencer un nombre négatif */
export function toggleSign(text: string): string {
  const trimmed = text.trim();
  return trimmed.startsWith('-') ? trimmed.slice(1) : `-${trimmed}`;
}

/** Champ de score ; le signe moins se trouve mal sur les claviers numériques, d'où le bouton ± */
export function ScoreInput({
  value,
  onChangeText,
  signed,
  editable = true,
  placeholder = '0',
  compact = false,
  onSubmitEditing,
  style,
  accessibilityLabel,
}: Props) {
  const negative = value.trim().startsWith('-');
  return (
    <View style={[compact ? styles.column : styles.row, style]}>
      <TextInput
        style={[common.input, styles.input, compact && styles.compactInput, !editable && styles.disabled]}
        editable={editable}
        value={value}
        keyboardType={signed ? 'numbers-and-punctuation' : 'number-pad'}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        accessibilityLabel={accessibilityLabel}
      />
      {signed && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={negative ? 'Rendre positif' : 'Rendre négatif'}
          disabled={!editable}
          hitSlop={compact ? 4 : 0}
          onPress={() => onChangeText(toggleSign(value))}
          style={({ pressed }) => [
            styles.sign,
            compact && styles.compactSign,
            negative && styles.signActive,
            (pressed || !editable) && styles.dimmed,
          ]}
        >
          <Text style={[styles.signText, compact && styles.compactSignText, negative && styles.signTextActive]}>±</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 6 },
  column: { gap: 4, alignItems: 'stretch' },
  input: { flex: 1, textAlign: 'center' },
  compactInput: { flex: 0, minWidth: 0, paddingHorizontal: 4, paddingVertical: 8 },
  disabled: { opacity: 0.4 },
  sign: {
    width: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactSign: { width: 'auto', paddingVertical: 2, borderRadius: 8 },
  signActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dimmed: { opacity: 0.5 },
  signText: { fontSize: 20, fontWeight: '700', color: colors.text },
  compactSignText: { fontSize: 15 },
  signTextActive: { color: colors.primaryText },
});
