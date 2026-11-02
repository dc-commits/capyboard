import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { GameLeaderboard } from '@/components/GameLeaderboard';
import { describeEnd, formatDuration, formatPlayers } from '@/data/games';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useFavorites } from '@/store/favorites';
import { useGames } from '@/store/games';
import { getTotals, getWinners, useMatches } from '@/store/matches';
import { colors, common } from '@/theme';

export default function GameScreen() {
  const { getGame, isInLibrary, addToLibrary, removeFromLibrary, deleteGame } = useGames();
  const contentStyle = useContentStyle();
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = getGame(id);
  const { matches, deleteMatch } = useMatches();
  const { isFavorite, toggleFavorite } = useFavorites();

  if (!game) return <Text style={common.content}>Jeu introuvable</Text>;

  const gameMatches = matches.filter((match) => match.gameId === game.id);
  const inLibrary = isInLibrary(game.id);

  const confirmDelete = () =>
    Alert.alert(
      `Supprimer ${game.name} ?`,
      gameMatches.length > 0
        ? `Ses ${gameMatches.length} partie${gameMatches.length > 1 ? 's' : ''} seront aussi supprimées.`
        : 'Le jeu et ses règles seront effacés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            router.back();
            gameMatches.forEach((match) => deleteMatch(match.id));
            deleteGame(game.id);
          },
        },
      ],
    );

  return (
    <ScrollView style={common.screen} contentContainerStyle={contentStyle}>
      <Stack.Screen
        options={{
          title: game.name,
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isFavorite(game.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              accessibilityState={{ selected: isFavorite(game.id) }}
              hitSlop={12}
              onPress={() => toggleFavorite(game.id)}
            >
              <Text style={[styles.star, isFavorite(game.id) && styles.starOn]}>{isFavorite(game.id) ? '★' : '☆'}</Text>
            </Pressable>
          ),
        }}
      />
      <View style={[common.card, styles.header]}>
        <Text style={styles.emoji}>{game.emoji}</Text>
        <Text style={common.title}>{game.name}</Text>
        <Text style={common.subtitle}>
          {formatPlayers(game)} · {formatDuration(game)}
        </Text>
        <Text style={common.subtitle}>Gagnant : {game.winner === 'highest' ? 'le plus haut score' : 'le plus petit score'}</Text>
        <Text style={common.subtitle}>Fin : {describeEnd(game.endCondition)}</Text>
        {game.custom && <Text style={styles.customTag}>✏️ Jeu créé par toi</Text>}
      </View>

      <Button
        label="📖  Lire les règles"
        variant="secondary"
        onPress={() => router.push({ pathname: '/games/[id]/rules', params: { id: game.id } })}
      />
      <Button label="➕  Nouvelle partie" onPress={() => router.push({ pathname: '/games/[id]/new-match', params: { id: game.id } })} />

      <GameLeaderboard game={game} />

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

      <Text style={common.sectionTitle}>Bibliothèque</Text>
      <Button
        label={inLibrary ? 'Retirer de ma bibliothèque' : '➕  Ajouter à ma bibliothèque'}
        variant="secondary"
        onPress={() => (inLibrary ? removeFromLibrary(game.id) : addToLibrary(game.id))}
      />
      {game.custom && (
        <>
          <Button
            label="✏️  Modifier le jeu"
            variant="secondary"
            onPress={() => router.push({ pathname: '/games/[id]/edit', params: { id: game.id } })}
          />
          <Button label="Supprimer le jeu" variant="danger" onPress={confirmDelete} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  star: { fontSize: 26, color: colors.muted },
  starOn: { color: colors.star },
  header: { alignItems: 'center', gap: 4 },
  customTag: { fontSize: 13, fontWeight: '600', color: colors.primary },
  emoji: { fontSize: 48 },
  match: { gap: 6 },
  matchHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontWeight: '600', color: colors.text },
  status: { fontSize: 13, fontWeight: '600' },
  finished: { color: colors.success },
  ongoing: { color: colors.primary },
});
