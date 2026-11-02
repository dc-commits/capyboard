import type { Dispatch, SetStateAction } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { DetailedScoring, RoundDetail } from '@/data/games';
import { colors, common } from '@/theme';

/** Texte saisi par joueur, par clé de champ */
export type DetailDraft = Record<string, string>[];

/** Convertit la saisie d'un joueur, ou `null` si un champ est vide ou invalide */
export function parseDetail(scoring: DetailedScoring, draft: Record<string, string> | undefined): RoundDetail | null {
  const detail: RoundDetail = {};
  for (const field of scoring.fields) {
    const raw = (draft?.[field.key] ?? '').trim();
    const value = Number(raw);
    if (raw === '' || !Number.isInteger(value) || (!field.signed && value < 0)) return null;
    detail[field.key] = value;
  }
  return detail;
}

type Props = {
  scoring: DetailedScoring;
  players: string[];
  roundNumber: number;
  draft: DetailDraft;
  onChange: Dispatch<SetStateAction<DetailDraft>>;
};

export function DetailedRoundEntry({ scoring, players, roundNumber, draft, onChange }: Props) {
  const setValue = (playerIndex: number, key: string, text: string) =>
    onChange((current) => players.map((_, index) => (index === playerIndex ? { ...current[index], [key]: text } : (current[index] ?? {}))));

  return (
    <View style={[common.card, styles.card]}>
      <Text style={common.sectionTitle}>Manche {roundNumber}</Text>
      {players.map((player, playerIndex) => {
        const detail = parseDetail(scoring, draft[playerIndex]);
        return (
          <View key={playerIndex} style={styles.player}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>
                {player}
              </Text>
              <Text style={styles.preview}>{detail ? `${scoring.compute(detail)} pts` : '–'}</Text>
            </View>
            <View style={styles.fields}>
              {scoring.fields.map((field) => (
                <View key={field.key} style={styles.field}>
                  <Text style={styles.label}>
                    {field.icon} {field.label}
                  </Text>
                  <TextInput
                    style={[common.input, styles.input]}
                    value={draft[playerIndex]?.[field.key] ?? ''}
                    keyboardType={field.signed ? 'numbers-and-punctuation' : 'number-pad'}
                    placeholder="0"
                    placeholderTextColor={colors.muted}
                    onChangeText={(text) => setValue(playerIndex, field.key, text)}
                  />
                </View>
              ))}
            </View>
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
});
