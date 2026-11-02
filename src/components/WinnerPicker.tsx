import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { colors, common } from '@/theme';

type Props = {
  players: string[];
  /** Avatar de chaque joueur qui a un profil */
  avatars: ({ avatar: string; color: string } | undefined)[];
  /** Sélection de départ (partie reprise après avoir désigné des gagnants) */
  initial: number[];
  onConfirm: (winnerIndexes: number[]) => void;
};

/** Jeux sans score : on touche le ou les gagnants (plusieurs pour une victoire partagée) */
export function WinnerPicker({ players, avatars, initial, onConfirm }: Props) {
  const [selected, setSelected] = useState<number[]>(initial);

  const toggle = (index: number) =>
    setSelected((current) => (current.includes(index) ? current.filter((value) => value !== index) : [...current, index]));

  return (
    <View style={[common.card, styles.card]}>
      <Text style={common.title}>Qui a gagné ?</Text>
      <Text style={common.subtitle}>Touche le gagnant, ou plusieurs joueurs en cas de victoire partagée.</Text>
      {players.map((player, index) => {
        const checked = selected.includes(index);
        const profile = avatars[index];
        return (
          <Pressable
            key={index}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
            onPress={() => toggle(index)}
            style={[styles.row, checked && styles.rowChecked]}
          >
            {profile && <Avatar avatar={profile.avatar} color={profile.color} size={32} />}
            <Text style={[styles.name, checked && styles.nameChecked]} numberOfLines={1}>
              {player}
            </Text>
            <Text style={styles.trophy}>{checked ? '🏆' : ''}</Text>
          </Pressable>
        );
      })}
      <Button
        label={selected.length > 1 ? 'Valider la victoire partagée' : 'Valider le gagnant'}
        disabled={selected.length === 0}
        onPress={() => onConfirm([...selected].sort((a, b) => a - b))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowChecked: { borderColor: colors.success, backgroundColor: '#E7F3EC' },
  name: { flex: 1, fontSize: 16, color: colors.text },
  nameChecked: { fontWeight: '700' },
  trophy: { fontSize: 20, width: 28, textAlign: 'center' },
});
