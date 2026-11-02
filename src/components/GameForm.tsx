import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import type { EndCondition } from '@/data/games';
import type { CustomGameInput } from '@/store/games';
import { colors, common } from '@/theme';

const EMOJIS = ['🎲', '🃏', '♠️', '🀄', '🎯', '🧩', '🏆', '👑', '💎', '🐉', '🦄', '🍀', '🚀', '🏰', '⚔️', '🎨', '🍕', '🐙'];

const RULES_PLACEHOLDER = `# But du jeu
Être le premier à…

# Tour de jeu
1. Piocher une carte
2. Jouer une carte
- Une puce commence par un tiret`;

export const EMPTY_GAME: CustomGameInput = {
  name: '',
  emoji: EMOJIS[0],
  minPlayers: 2,
  maxPlayers: 6,
  durationMinutes: 30,
  winner: 'highest',
  endCondition: { type: 'manual' },
  rulesText: '',
};

type EndType = EndCondition['type'];

function toPositiveInt(text: string): number | null {
  const value = Number(text.trim());
  return text.trim() !== '' && Number.isInteger(value) && value > 0 ? value : null;
}

type Props = {
  initial: CustomGameInput;
  submitLabel: string;
  onSubmit: (input: CustomGameInput) => void;
};

/** Création ou modification d'un jeu : fiche, scores, fin de partie et règles */
export function GameForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial.name);
  const [emoji, setEmoji] = useState(initial.emoji);
  const [minPlayers, setMinPlayers] = useState(String(initial.minPlayers));
  const [maxPlayers, setMaxPlayers] = useState(initial.maxPlayers === undefined ? '' : String(initial.maxPlayers));
  const [duration, setDuration] = useState(String(initial.durationMinutes));
  const [winner, setWinner] = useState(initial.winner);
  const [endType, setEndType] = useState<EndType>(initial.endCondition.type);
  const [endValue, setEndValue] = useState(
    initial.endCondition.type === 'threshold'
      ? String(initial.endCondition.points)
      : initial.endCondition.type === 'rounds'
        ? String(initial.endCondition.count)
        : '',
  );
  const [rulesText, setRulesText] = useState(initial.rulesText);

  const min = toPositiveInt(minPlayers);
  const max = maxPlayers.trim() === '' ? undefined : toPositiveInt(maxPlayers);
  const minutes = toPositiveInt(duration);
  const end = toPositiveInt(endValue);

  const endCondition: EndCondition | null =
    endType === 'manual'
      ? { type: 'manual' }
      : end === null
        ? null
        : endType === 'threshold'
          ? { type: 'threshold', points: end }
          : { type: 'rounds', count: end };

  const errors = [
    !name.trim() && 'Donne un nom au jeu.',
    min === null && 'Nombre minimum de joueurs invalide.',
    max === null && 'Nombre maximum de joueurs invalide.',
    min !== null && typeof max === 'number' && max < min && 'Le maximum de joueurs doit être au moins égal au minimum.',
    minutes === null && 'Durée invalide.',
    endCondition === null && (endType === 'threshold' ? 'Indique le seuil de points.' : 'Indique le nombre de manches.'),
  ].filter((error): error is string => Boolean(error));

  const submit = () => {
    if (errors.length > 0 || min === null || max === null || minutes === null || endCondition === null) return;
    onSubmit({ name: name.trim(), emoji, minPlayers: min, maxPlayers: max, durationMinutes: minutes, winner, endCondition, rulesText });
  };

  return (
    <View style={styles.form}>
      <Text style={common.sectionTitle}>Nom</Text>
      <TextInput style={common.input} placeholder="Nom du jeu" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />

      <Text style={common.sectionTitle}>Emoji</Text>
      <View style={styles.emojis}>
        {[...new Set([initial.emoji, ...EMOJIS])].map((value) => (
          <Pressable
            key={value}
            accessibilityRole="radio"
            accessibilityState={{ selected: value === emoji }}
            onPress={() => setEmoji(value)}
            style={[styles.emojiOption, value === emoji && styles.emojiSelected]}
          >
            <Text style={styles.emoji}>{value}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={common.sectionTitle}>Joueurs et durée</Text>
      <View style={styles.row}>
        <NumberField label="Joueurs min" value={minPlayers} onChange={setMinPlayers} />
        <NumberField label="Joueurs max" value={maxPlayers} onChange={setMaxPlayers} placeholder="sans limite" />
        <NumberField label="Durée (min)" value={duration} onChange={setDuration} />
      </View>

      <Text style={common.sectionTitle}>Gagnant</Text>
      <View style={styles.chips}>
        <Chip label="Plus haut score" selected={winner === 'highest'} onPress={() => setWinner('highest')} />
        <Chip label="Plus petit score" selected={winner === 'lowest'} onPress={() => setWinner('lowest')} />
      </View>

      <Text style={common.sectionTitle}>Fin de partie</Text>
      <View style={styles.chips}>
        <Chip label="Seuil de points" selected={endType === 'threshold'} onPress={() => setEndType('threshold')} />
        <Chip label="Nombre de manches" selected={endType === 'rounds'} onPress={() => setEndType('rounds')} />
        <Chip label="Libre" selected={endType === 'manual'} onPress={() => setEndType('manual')} />
      </View>
      {endType !== 'manual' && (
        <NumberField label={endType === 'threshold' ? 'Points pour finir' : 'Nombre de manches'} value={endValue} onChange={setEndValue} />
      )}

      <Text style={common.sectionTitle}>Règles</Text>
      <Text style={styles.hint}>« # Titre » ouvre une section, « - » fait une puce, « 1. » une étape numérotée.</Text>
      <TextInput
        style={[common.input, styles.rules]}
        multiline
        textAlignVertical="top"
        placeholder={RULES_PLACEHOLDER}
        placeholderTextColor={colors.muted}
        value={rulesText}
        onChangeText={setRulesText}
      />

      {errors.length > 0 && <Text style={styles.error}>{errors[0]}</Text>}
      <Button label={submitLabel} disabled={errors.length > 0} onPress={submit} />
    </View>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder = '',
}: {
  label: string;
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[common.input, styles.number]}
        keyboardType="number-pad"
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        onChangeText={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 10 },
  emojis: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiSelected: { borderColor: colors.primary },
  emoji: { fontSize: 24 },
  row: { flexDirection: 'row', gap: 8 },
  field: { flex: 1, gap: 4 },
  label: { fontSize: 12, color: colors.muted },
  number: { minWidth: 0, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  hint: { fontSize: 13, color: colors.muted },
  rules: { minHeight: 180 },
  error: { fontSize: 14, color: colors.danger },
});
