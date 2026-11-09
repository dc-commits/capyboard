import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { usePlayers } from '@/store/players';
import { colors, common } from '@/theme';

export type Contestant = { key: string; name: string; playerId?: string };

/** Nombre de sauts du surlignage avant de s'arrêter, et délais du premier et du dernier saut */
const STEPS = 18;
const FIRST_DELAY = 50;
const LAST_DELAY = 260;

/** Tirage au sort du premier joueur, parmi les joueurs d'une partie ou des profils choisis */
export function FirstPlayer({ initial }: { initial?: Contestant[] }) {
  const { players, getPlayer } = usePlayers();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [guests, setGuests] = useState<string[]>([]);
  const [guestName, setGuestName] = useState('');
  const [highlight, setHighlight] = useState<number | null>(null);
  const [winner, setWinner] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const contestants: Contestant[] = initial ?? [
    ...players
      .filter((player) => selectedIds.includes(player.id))
      .map((player) => ({ key: player.id, name: player.name, playerId: player.id })),
    ...guests.map((name) => ({ key: `guest-${name}`, name })),
  ];
  const drawing = highlight !== null && winner === null;

  const reset = () => {
    setHighlight(null);
    setWinner(null);
  };

  const toggle = (id: string) => {
    reset();
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  };

  const addGuest = () => {
    const name = guestName.trim();
    if (!name || guests.includes(name)) return;
    reset();
    setGuests((current) => [...current, name]);
    setGuestName('');
  };

  const draw = () => {
    const total = contestants.length;
    const chosen = Math.floor(Math.random() * total);
    setWinner(null);
    // Le surlignage tourne en ralentissant, et finit pile sur le joueur tiré
    const start = (chosen - STEPS + total * STEPS) % total;
    const step = (index: number) => {
      setHighlight((start + index) % total);
      if (index === STEPS) {
        setWinner(chosen);
        return;
      }
      const progress = index / STEPS;
      timer.current = setTimeout(() => step(index + 1), FIRST_DELAY + (LAST_DELAY - FIRST_DELAY) * progress * progress);
    };
    step(0);
  };

  return (
    <View style={styles.container}>
      {!initial && (
        <View style={[common.card, styles.picker]}>
          <Text style={styles.label}>Qui joue ?</Text>
          {players.length > 0 && (
            <View style={styles.profiles}>
              {players.map((player) => {
                const selected = selectedIds.includes(player.id);
                return (
                  <Pressable
                    key={player.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    onPress={() => toggle(player.id)}
                    style={[styles.profile, selected && styles.profileSelected]}
                  >
                    <Avatar avatar={player.avatar} color={player.color} size={26} />
                    <Text style={[styles.profileName, selected && styles.profileNameSelected]}>{player.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          <View style={styles.guestRow}>
            <TextInput
              value={guestName}
              onChangeText={setGuestName}
              onSubmitEditing={addGuest}
              placeholder="Ajouter un invité"
              placeholderTextColor={colors.muted}
              returnKeyType="done"
              submitBehavior="submit"
              style={[common.input, styles.guestInput]}
            />
            <Pressable
              accessibilityRole="button"
              disabled={!guestName.trim()}
              onPress={addGuest}
              style={[styles.addButton, !guestName.trim() && styles.addDisabled]}
            >
              <Text style={styles.addText}>Ajouter</Text>
            </Pressable>
          </View>
          {guests.length > 0 && (
            <View style={styles.profiles}>
              {guests.map((name) => (
                <Pressable
                  key={name}
                  accessibilityRole="button"
                  accessibilityLabel={`Retirer ${name}`}
                  onPress={() => {
                    reset();
                    setGuests((current) => current.filter((guest) => guest !== name));
                  }}
                  style={[styles.profile, styles.profileSelected, styles.guest]}
                >
                  <Text style={[styles.profileName, styles.profileNameSelected]}>{name} ✕</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {contestants.length > 0 && (
        <View style={[common.card, styles.list]}>
          {contestants.map((contestant, index) => {
            const profile = contestant.playerId ? getPlayer(contestant.playerId) : undefined;
            const lit = highlight === index;
            const won = winner === index;
            return (
              <View key={contestant.key} style={[styles.row, lit && styles.rowLit, won && styles.rowWon]}>
                {profile ? (
                  <Avatar avatar={profile.avatar} color={profile.color} size={34} />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>{contestant.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <Text style={[styles.rowName, won && styles.rowNameWon]} numberOfLines={1}>
                  {contestant.name}
                </Text>
                {won && <Text style={styles.crown}>👑</Text>}
              </View>
            );
          })}
        </View>
      )}

      {winner !== null && contestants[winner] && (
        <Text style={styles.result} accessibilityLiveRegion="polite">
          {contestants[winner].name} commence ! 🎉
        </Text>
      )}

      {contestants.length < 2 ? (
        <Text style={common.subtitle}>Choisis au moins deux joueurs pour le tirage.</Text>
      ) : (
        <Button label={winner === null ? '🎲 Tirer au sort' : '🎲 Nouveau tirage'} disabled={drawing} onPress={draw} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  picker: { gap: 10 },
  label: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  profiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingLeft: 4,
    paddingRight: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  profileSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  guest: { paddingLeft: 12, paddingVertical: 8 },
  profileName: { fontSize: 15, color: colors.text },
  profileNameSelected: { color: colors.primaryText, fontWeight: '600' },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guestInput: { flex: 1 },
  addButton: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 10, backgroundColor: colors.primary },
  addDisabled: { opacity: 0.5 },
  addText: { fontSize: 15, fontWeight: '600', color: colors.primaryText },
  list: { paddingVertical: 6, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12 },
  rowLit: { backgroundColor: '#FBE3C8' },
  rowWon: { backgroundColor: '#F7D88C' },
  rowName: { flex: 1, fontSize: 17, color: colors.text },
  rowNameWon: { fontWeight: '800' },
  crown: { fontSize: 22 },
  placeholder: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: { fontSize: 16, fontWeight: '700', color: colors.text },
  result: { fontSize: 22, fontWeight: '800', color: colors.primary, textAlign: 'center' },
});
