import { useState, type Dispatch, type SetStateAction } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import type { DetailedScoring, RoundDetail, ScoreField } from '@/data/games';
import { colors, common } from '@/theme';

/** Texte saisi par joueur, par clé de champ (« 1 » pour une case cochée) */
export type DetailDraft = (Record<string, string> | undefined)[];

type ToggleField = ScoreField & { kind: 'toggle' };

function isDisabled(field: ScoreField, draft: Record<string, string> | undefined): boolean {
  return field.disabledWhen !== undefined && draft?.[field.disabledWhen] === '1';
}

/**
 * Convertit la saisie d'un joueur, ou `null` si un champ est vide ou invalide.
 * En saisie par fenêtre, un joueur dont la fenêtre n'a pas été validée est incomplet.
 */
export function parseDetail(scoring: DetailedScoring, draft: Record<string, string> | undefined): RoundDetail | null {
  if (scoring.entry === 'modal' && draft === undefined) return null;
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

/** Résumé compact d'une saisie : valeurs numériques et libellés des cases cochées */
export function formatDetail(scoring: DetailedScoring, detail: RoundDetail): string {
  return scoring.fields
    .flatMap((field) => {
      if (detail[field.key] === undefined) return [];
      if (field.disabledWhen && detail[field.disabledWhen]) return [];
      if (field.kind === 'toggle') return detail[field.key] ? [field.icon] : [];
      return detail[field.key] !== 0 || !field.optional ? [`${field.icon}${detail[field.key]}`] : [];
    })
    .join(' ');
}

type PlayerFieldsProps = {
  scoring: DetailedScoring;
  values: Record<string, string> | undefined;
  onText: (key: string, text: string) => void;
  onToggle: (field: ToggleField) => void;
};

/** Champs de saisie d'un joueur : nombres, grilles de cartes par groupe, puis cases à cocher isolées */
function PlayerFields({ scoring, values, onText, onToggle }: PlayerFieldsProps) {
  const numberFields = scoring.fields.filter((field) => field.kind === 'number');
  const toggleFields = scoring.fields.filter((field): field is ToggleField => field.kind === 'toggle');
  const groups = [...new Set(toggleFields.flatMap((field) => field.group ?? []))];
  const looseToggles = toggleFields.filter((field) => !field.group);

  const toggleState = (field: ToggleField) => {
    const disabled = isDisabled(field, values);
    const checked = !disabled && values?.[field.key] === '1';
    const limit = field.group ? scoring.groupLimits?.[field.group] : undefined;
    const groupCount = toggleFields.filter((other) => other.group === field.group && values?.[other.key] === '1').length;
    // Groupe plein : on ne peut plus que décocher
    return { checked, disabled: disabled || (!checked && limit !== undefined && groupCount >= limit) };
  };

  return (
    <View style={styles.fieldsBlock}>
      {numberFields.length > 0 && (
        <View style={styles.fields}>
          {numberFields.map((field) => {
            const disabled = isDisabled(field, values);
            return (
              <View key={field.key} style={styles.field}>
                <Text style={styles.label}>
                  {field.icon} {field.label}
                </Text>
                <TextInput
                  style={[common.input, styles.input, disabled && styles.disabled]}
                  editable={!disabled}
                  value={disabled ? '' : (values?.[field.key] ?? '')}
                  keyboardType={field.signed ? 'numbers-and-punctuation' : 'number-pad'}
                  placeholder={disabled ? '–' : '0'}
                  placeholderTextColor={colors.muted}
                  onChangeText={(text) => onText(field.key, text)}
                />
              </View>
            );
          })}
        </View>
      )}
      {groups.map((group) => (
        <View key={group} style={styles.group}>
          <Text style={styles.label}>{group}</Text>
          <View style={styles.cards}>
            {toggleFields
              .filter((field) => field.group === group)
              .map((field) => {
                const { checked, disabled } = toggleState(field);
                return (
                  <Pressable
                    key={field.key}
                    accessibilityRole="checkbox"
                    accessibilityLabel={`${group} ${field.label}`}
                    accessibilityState={{ checked, disabled }}
                    disabled={disabled}
                    onPress={() => onToggle(field)}
                    style={[styles.cardTile, checked && styles.checked, disabled && styles.disabled]}
                  >
                    <Text style={[styles.cardText, checked && styles.checkedText]}>{field.label}</Text>
                  </Pressable>
                );
              })}
          </View>
        </View>
      ))}
      {looseToggles.length > 0 && (
        <View style={styles.chips}>
          {looseToggles.map((field) => {
            const { checked, disabled } = toggleState(field);
            return (
              <Pressable
                key={field.key}
                accessibilityRole="checkbox"
                accessibilityState={{ checked, disabled }}
                disabled={disabled}
                onPress={() => onToggle(field)}
                style={[styles.chip, checked && styles.checked, disabled && styles.disabled]}
              >
                <Text style={[styles.chipText, checked && styles.checkedText]}>
                  {field.icon} {field.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

type Props = {
  scoring: DetailedScoring;
  players: string[];
  /** Avatar de chaque joueur qui a un profil */
  avatars?: ({ avatar: string; color: string } | undefined)[];
  roundNumber: number;
  draft: DetailDraft;
  onChange: Dispatch<SetStateAction<DetailDraft>>;
};

export function DetailedRoundEntry({ scoring, players, avatars, roundNumber, draft, onChange }: Props) {
  const [openPlayer, setOpenPlayer] = useState<number | null>(null);
  const round = players.map((_, index) => parseDetail(scoring, draft[index]));

  const update = (playerIndex: number, change: (values: Record<string, string>) => Record<string, string>) =>
    onChange((current) => players.map((_, index) => (index === playerIndex ? change(current[index] ?? {}) : current[index])));

  const setText = (playerIndex: number, key: string, text: string) => update(playerIndex, (values) => ({ ...values, [key]: text }));

  const toggle = (playerIndex: number, field: ToggleField) => {
    const turningOn = draft[playerIndex]?.[field.key] !== '1';
    onChange((current) =>
      players.map((_, index) => {
        const values = current[index];
        if (index === playerIndex) return { ...values, [field.key]: turningOn ? '1' : '' };
        // Case exclusive : la cocher chez un joueur la décoche chez les autres
        return field.exclusive && turningOn && values ? { ...values, [field.key]: '' } : values;
      }),
    );
  };

  const scoreLabel = (playerIndex: number) => {
    const detail = round[playerIndex];
    const score = detail ? scoring.compute(detail, round) : null;
    return score !== null ? `${score} pts` : '–';
  };

  if (scoring.entry !== 'modal') {
    return (
      <View style={[common.card, styles.card]}>
        <Text style={common.sectionTitle}>Manche {roundNumber}</Text>
        {players.map((player, playerIndex) => (
          <View key={playerIndex} style={styles.player}>
            <View style={styles.header}>
              <Text style={styles.name} numberOfLines={1}>
                {player}
              </Text>
              <Text style={styles.preview}>{scoreLabel(playerIndex)}</Text>
            </View>
            <PlayerFields
              scoring={scoring}
              values={draft[playerIndex]}
              onText={(key, text) => setText(playerIndex, key, text)}
              onToggle={(field) => toggle(playerIndex, field)}
            />
          </View>
        ))}
      </View>
    );
  }

  const validate = (playerIndex: number, next: number | null) => {
    // Valider sans rien cocher compte comme une saisie (0 point)
    update(playerIndex, (values) => values);
    setOpenPlayer(next);
  };

  const open = openPlayer !== null ? openPlayer : undefined;
  const openDetail = open !== undefined ? parseDetail(scoring, draft[open] ?? {}) : null;
  const hint = openDetail && scoring.hint ? scoring.hint(openDetail) : null;

  return (
    <View style={[common.card, styles.card]}>
      <Text style={common.sectionTitle}>Manche {roundNumber}</Text>
      {players.map((player, playerIndex) => {
        const detail = round[playerIndex];
        const profile = avatars?.[playerIndex];
        return (
          <Pressable
            key={playerIndex}
            accessibilityRole="button"
            accessibilityLabel={`Saisir les cartes de ${player}`}
            onPress={() => setOpenPlayer(playerIndex)}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            {profile && <Avatar avatar={profile.avatar} color={profile.color} size={32} />}
            <View style={styles.rowInfo}>
              <Text style={styles.name} numberOfLines={1}>
                {player}
              </Text>
              <Text style={styles.summary} numberOfLines={1}>
                {detail ? formatDetail(scoring, detail) || 'Aucune carte' : 'Toucher pour saisir'}
              </Text>
            </View>
            <Text style={[styles.preview, !detail && styles.pending]}>{detail ? scoreLabel(playerIndex) : '›'}</Text>
          </Pressable>
        );
      })}

      <Modal visible={open !== undefined} transparent animationType="slide" onRequestClose={() => setOpenPlayer(null)}>
        <Pressable style={styles.backdrop} accessibilityLabel="Fermer" onPress={() => setOpenPlayer(null)} />
        {open !== undefined && (
          <View style={styles.sheet}>
            <View style={styles.header}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                {players[open]}
              </Text>
              <Text style={styles.sheetScore}>{openDetail ? `${scoring.compute(openDetail, round) ?? '–'} pts` : '–'}</Text>
            </View>
            {hint && <Text style={styles.hint}>{hint}</Text>}
            <ScrollView contentContainerStyle={styles.sheetContent}>
              <PlayerFields
                scoring={scoring}
                values={draft[open]}
                onText={(key, text) => setText(open, key, text)}
                onToggle={(field) => toggle(open, field)}
              />
            </ScrollView>
            <View style={styles.sheetActions}>
              {open < players.length - 1 ? (
                <>
                  <View style={styles.action}>
                    <Button label="Valider" variant="secondary" onPress={() => validate(open, null)} />
                  </View>
                  <View style={styles.action}>
                    <Button label={`${players[open + 1]} ›`} onPress={() => validate(open, open + 1)} />
                  </View>
                </>
              ) : (
                <View style={styles.action}>
                  <Button label="Valider" onPress={() => validate(open, null)} />
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  player: { gap: 6, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  name: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  preview: { fontSize: 16, fontWeight: '700', color: colors.primary },
  pending: { color: colors.muted, fontSize: 22 },
  fieldsBlock: { gap: 10 },
  fields: { flexDirection: 'row', gap: 8 },
  field: { flex: 1, gap: 4 },
  group: { gap: 6 },
  label: { fontSize: 12, color: colors.muted },
  input: { minWidth: 0, textAlign: 'center', paddingVertical: 8 },
  disabled: { opacity: 0.35 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardTile: {
    width: 46,
    height: 58,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipText: { fontSize: 14, color: colors.text },
  checked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkedText: { color: colors.primaryText, fontWeight: '700' },
  cardText: { fontSize: 18, fontWeight: '600', color: colors.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  rowInfo: { flex: 1, gap: 2 },
  summary: { fontSize: 13, color: colors.muted },
  pressed: { opacity: 0.6 },
  backdrop: { flex: 1, backgroundColor: 'rgba(31, 27, 22, 0.35)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 28,
    gap: 10,
    maxHeight: '85%',
  },
  sheetTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.text },
  sheetScore: { fontSize: 20, fontWeight: '800', color: colors.primary },
  hint: { fontSize: 14, fontWeight: '600', color: colors.success },
  sheetContent: { paddingBottom: 4 },
  sheetActions: { flexDirection: 'row', gap: 10 },
  action: { flex: 1 },
});
