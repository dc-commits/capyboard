import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { getGame } from '@/data/games';
import { getTotals, getWinners, useMatches } from '@/store/matches';
import { colors, common } from '@/theme';

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = getGame(id);
  const { matches } = useMatches();

  if (!game) return <Text style={common.content}>Jeu introuvable</Text>;

  const gameMatches = matches.filter((match) => match.gameId === game.id);

  return (
    <ScrollView style={common.screen} contentContainerStyle={common.content}>
      <Stack.Screen options={{ title: game.name }} />
      <View style={[common.card, styles.header]}>
        <Text style={styles.emoji}>{game.emoji}</Text>
        <Text style={common.title}>{game.name}</Text>
        <Text style={common.subtitle}>
          {game.players} · {game.duration}
        </Text>
        <Text style={common.subtitle}>Gagnant : {game.winner === 'highest' ? 'le plus haut score' : 'le plus petit score'}</Text>
        <Text style={common.subtitle}>
          Fin :{' '}
          {game.endCondition.type === 'rounds'
            ? `après ${game.endCondition.count} manches`
            : `dès qu’un joueur atteint ${game.endCondition.points} points`}
        </Text>
      </View>

      <Button
        label="📖  Lire les règles"
        variant="secondary"
        onPress={() => router.push({ pathname: '/games/[id]/rules', params: { id: game.id } })}
      />
      <Button label="➕  Nouvelle partie" onPress={() => router.push({ pathname: '/games/[id]/new-match', params: { id: game.id } })} />

      <Text style={common.sectionTitle}>Parties ({gameMatches.length})</Text>
      {gameMatches.length === 0 && <Text style={common.subtitle}>Aucune partie pour l’instant.</Text>}
      {gameMatches.map((match) => {
        const totals = getTotals(match);
        const { leaders } = getWinners(match, game);
        return (
          <Pressable
            key={match.id}
            onPress={() => router.push({ pathname: '/matches/[matchId]', params: { matchId: match.id } })}
            style={({ pressed }) => [common.card, styles.match, pressed && { opacity: 0.7 }]}
          >
            <View style={styles.matchHeader}>
              <Text style={styles.date}>
                {new Date(match.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <Text style={[styles.status, match.finishedAt ? styles.finished : styles.ongoing]}>
                {match.finishedAt ? 'Terminée' : 'En cours'}
              </Text>
            </View>
            <Text style={common.subtitle}>
              {match.players.map((player, index) => `${leaders.includes(index) ? '🏆 ' : ''}${player} ${totals[index]}`).join(' · ')}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 4 },
  emoji: { fontSize: 48 },
  match: { gap: 6 },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontWeight: '600', color: colors.text },
  status: { fontSize: 13, fontWeight: '600' },
  finished: { color: colors.success },
  ongoing: { color: colors.primary },
});
