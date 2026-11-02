import type { Dispatch, SetStateAction } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DetailedScoring, RoundDetail, ScoreField } from '@/data/games';
import { colors, common } from '@/theme';

/** Texte saisi par joueur, par clé de champ (« 1 » pour une case cochée) */
export type DetailDraft = Record<string, string>[];

function isDisabled(field: ScoreField, draft: Record<string, string> | undefined): boolean {
  return field.disabledWhen !== undefined && draft?.[field.disabledWhen] === '1';
}

/** Convertit la saisie d'un joueur, ou `null` si un champ est vide ou invalide */
export function parseDetail(scoring: DetailedScoring, draft: Record<string, string> | undefined): RoundDetail | null {
  const detail: RoundDetail = {};
  for (const field of scoring.fields) {
    if (isDisabled(field, draft)) {
      detail[field.key] = 0;
      continue;
    }
    if (field.kind === 'toggle') {
      detail[field.key] = draft?.[field.key] === '1' ? 1 : 0;
      continue;
    }
    const raw = (draft?.[field.key] ?? '').trim();
    if (raw === '' && field.optional) {
      detail[field.key] = 0;
      continue;
    }
    const value = Number(raw);
    if (raw === '' || !Number.isInteger(value) || (!field.signed && value < 0)) return null;
    detail[field.key] = value;
  }
  return detail;
}

/** Résumé compact d'une saisie : valeurs numériques et icônes des cases cochées */
export function formatDetail(scoring: DetailedScoring, detail: RoundDetail): string {
  return scoring.fields
    .flatMap((field) => {
      if (field.disabledWhen && detail[field.disabledWhen]) return [];
      if (field.kind === 'toggle') return detail[field.key] ? [field.icon] : [];
      return detail[field.key] !== 0 || !field.optional ? [`${field.icon}${detail[field.key]}`] : [];
    })
    .join(' ');
}

type Props = {
  scoring: DetailedScoring;
  players: string[];
  roundNumber: number;
  draft: DetailDraft;
  onChange: Dispatch<SetStateAction<DetailDraft>>;
};

export function DetailedRoundEntry({ scoring, players, roundNumber, draft, onChange }: Props) {
  const numberFields = scoring.fields.filter((field) => field.kind === 'number');
  const toggleFields = scoring.fields.filter((field) => field.kind === 'toggle');
  const round = players.map((_, index) => parseDetail(scoring, draft[index]));

  const setValue = (playerIndex: number, key: string, text: string) =>
    onChange((current) => players.map((_, index) => (index === playerIndex ? { ...current[index], [key]: text } : (current[index] ?? {}))));

  const toggle = (playerIndex: number, field: ScoreField & { kind: 'toggle' }) =>
    onChange((current) =>
      players.map((_, index) => {
        const values = current[index] ?? {};
        if (index === playerIndex) return { ...values, [field.key]: values[field.key] === '1' ? '' : '1' };
        // Case exclusive : la cocher chez un joueur la décoche chez les autres
        return field.exclusive && current[playerIndex]?.[field.key] !== '1' ? { ...values, [field.key]: '' } : values;
      }),
    );

  return (
    <View style={[common.card, styles.card]}>
      <Text style={common.sectionTitle}>Manche {roundNumber}</Text>
      {players.map((player, playerIndex) => {
        const detail = round[playerIndex];
        const score = detail ? scoring.compute(detail, round) : null;
        return (
          <View key={playerIndex} style={styles.player}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>
                {player}
              </Text>
              <Text style={styles.preview}>{score !== null ? `${score} pts` : '–'}</Text>
            </View>
            <View style={styles.fields}>
              {numberFields.map((field) => {
                const disabled = isDisabled(field, draft[playerIndex]);
                return (
                  <View key={field.key} style={styles.field}>
                    <Text style={styles.label}>
                      {field.icon} {field.label}
                    </Text>
                    <TextInput
                      style={[common.input, styles.input, disabled && styles.disabled]}
                      editable={!disabled}
                      value={disabled ? '' : (draft[playerIndex]?.[field.key] ?? '')}
                      keyboardType={field.signed ? 'numbers-and-punctuation' : 'number-pad'}
                      placeholder={disabled ? '–' : '0'}
                      placeholderTextColor={colors.muted}
                      onChangeText={(text) => setValue(playerIndex, field.key, text)}
                    />
                  </View>
                );
              })}
            </View>
            {toggleFields.length > 0 && (
              <View style={styles.toggles}>
                {toggleFields.map((field) => {
                  const disabled = isDisabled(field, draft[playerIndex]);
                  const checked = !disabled && draft[playerIndex]?.[field.key] === '1';
                  return (
                    <Pressable
                      key={field.key}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked, disabled }}
                      disabled={disabled}
                      onPress={() => toggle(playerIndex, field)}
                      style={[styles.chip, checked && styles.chipChecked, disabled && styles.disabled]}
                    >
                      <Text style={[styles.chipText, checked && styles.chipTextChecked]}>
                        {field.icon} {field.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  player: { gap: 6, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  preview: { fontSize: 16, fontWeight: '700', color: colors.primary },
  fields: { flexDirection: 'row', gap: 8 },
  field: { flex: 1, gap: 4 },
  label: { fontSize: 12, color: colors.muted },
  input: { minWidth: 0, textAlign: 'center', paddingVertical: 8 },
  disabled: { opacity: 0.4 },
  toggles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, color: colors.text },
  chipTextChecked: { color: colors.primaryText, fontWeight: '600' },
});
