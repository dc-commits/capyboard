import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { getGame } from '@/data/games';
import { useMatches } from '@/store/matches';
import { usePlayers } from '@/store/players';
import { colors, common } from '@/theme';

export default function NewMatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = getGame(id);
  const { matches, createMatch } = useMatches();
  const { players, getPlayer, createPlayer } = usePlayers();

  // Pré-sélectionne les joueurs de la dernière partie de ce jeu qui ont encore un profil
  const lastPlayerIds = matches.find((match) => match.gameId === id && match.playerIds)?.playerIds ?? [];
  const [selectedIds, setSelectedIds] = useState<string[]>(() => lastPlayerIds.filter((playerId) => getPlayer(playerId)));
  const [newName, setNewName] = useState('');

  if (!game) return <Text style={common.content}>Jeu introuvable</Text>;

  const selected = selectedIds.flatMap((playerId) => getPlayer(playerId) ?? []);

  const toggle = (playerId: string) =>
    setSelectedIds((current) => (current.includes(playerId) ? current.filter((value) => value !== playerId) : [...current, playerId]));

  const addPlayer = () => {
    const name = newName.trim();
    if (!name) return;
    // Un profil du même nom est réutilisé plutôt que dupliqué
    const existing = players.find((player) => player.name.toLocaleLowerCase('fr') === name.toLocaleLowerCase('fr'));
    const player = existing ?? createPlayer({ name });
    setSelectedIds((current) => (current.includes(player.id) ? current : [...current, player.id]));
    setNewName('');
  };

  const start = () => {
    const match = createMatch(game.id, selected);
    router.replace({ pathname: '/matches/[matchId]', params: { matchId: match.id } });
  };

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
        <Text style={common.title}>
          {game.emoji} {game.name}
        </Text>

        <Text style={common.sectionTitle}>Joueurs de la partie ({selected.length})</Text>
        {selected.length === 0 ? (
          <Text style={common.subtitle}>Touche les joueurs ci-dessous, dans l’ordre du tour.</Text>
        ) : (
          <View style={styles.order}>
            {selected.map((player, index) => (
              <View key={player.id} style={styles.orderRow}>
                <Text style={styles.orderIndex}>{index + 1}</Text>
                <Avatar avatar={player.avatar} color={player.color} size={32} />
                <Text style={styles.orderName} numberOfLines={1}>
                  {player.name}
                </Text>
                <Pressable accessibilityLabel={`Retirer ${player.name}`} hitSlop={10} onPress={() => toggle(player.id)}>
                  <Text style={styles.remove}>✕</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <Text style={common.sectionTitle}>Profils</Text>
        <View style={styles.chips}>
          {players.map((player) => {
            const checked = selectedIds.includes(player.id);
            return (
              <Pressable
                key={player.id}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                onPress={() => toggle(player.id)}
                style={[styles.chip, checked && styles.chipChecked]}
              >
                <Avatar avatar={player.avatar} color={player.color} size={26} />
                <Text style={[styles.chipText, checked && styles.chipTextChecked]}>{player.name}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.addRow}>
          <TextInput
            style={[common.input, styles.addInput]}
            placeholder="Nouveau joueur"
            placeholderTextColor={colors.muted}
            value={newName}
            autoCapitalize="words"
            returnKeyType="done"
            onChangeText={setNewName}
            onSubmitEditing={addPlayer}
          />
          <Pressable accessibilityRole="button" onPress={addPlayer} disabled={!newName.trim()} style={styles.addButton}>
            <Text style={[styles.addButtonText, !newName.trim() && styles.disabled]}>Ajouter</Text>
          </Pressable>
        </View>

        <Button label="Commencer la partie" disabled={selected.length === 0} onPress={start} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  order: { ...common.card, paddingVertical: 8, gap: 2 },
  orderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  orderIndex: { width: 18, color: colors.muted, fontWeight: '600', textAlign: 'center' },
  orderName: { flex: 1, fontSize: 16, color: colors.text },
  remove: { fontSize: 18, color: colors.muted, paddingHorizontal: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 15, color: colors.text },
  chipTextChecked: { color: colors.primaryText, fontWeight: '600' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addInput: { flex: 1 },
  addButton: { paddingHorizontal: 8, paddingVertical: 10 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  disabled: { opacity: 0.4 },
});
