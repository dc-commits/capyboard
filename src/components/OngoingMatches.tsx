import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import type { Game } from '@/data/games';
import { useGames } from '@/store/games';
import { getProgress, useMatches } from '@/store/matches';
import { usePlayers } from '@/store/players';
import { colors, common } from '@/theme';

const MAX_SHOWN = 2;

function startedLabel(createdAt: string): string {
  const date = new Date(createdAt);
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const days = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(createdAt).setHours(0, 0, 0, 0)) / 86_400_000);
  if (days === 0) return `Commencée aujourd’hui à ${time}`;
  if (days === 1) return `Commencée hier à ${time}`;
  return `Commencée le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;
}

/** Raccourcis vers les parties pas encore terminées, les plus récentes d'abord */
type Props = {
  /** Ne garde que les parties des jeux retenus (recherche de l'accueil) */
  filter?: (game: Game) => boolean;
};

export function OngoingMatches({ filter }: Props) {
  const { matches } = useMatches();
  const { getGame } = useGames();
  const { getPlayer } = usePlayers();

  const ongoing = matches
    .filter((match) => {
      const game = getGame(match.gameId);
      return !match.finishedAt && game && (!filter || filter(game));
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (ongoing.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={common.sectionTitle}>{ongoing.length > 1 ? `Parties en cours (${ongoing.length})` : 'Partie en cours'}</Text>
      {ongoing.slice(0, MAX_SHOWN).map((match) => {
        const game = getGame(match.gameId);
        if (!game) return null;
        return (
          <Pressable
            key={match.id}
            accessibilityRole="button"
            accessibilityLabel={`Reprendre la partie de ${game.name}`}
            onPress={() => router.push({ pathname: '/matches/[matchId]', params: { matchId: match.id } })}
            style={({ pressed }) => [common.card, styles.card, pressed && styles.pressed]}
          >
            <View style={styles.header}>
              <Text style={common.title} numberOfLines={1}>
                {game.emoji} {game.name}
              </Text>
              <Text style={styles.resume}>Reprendre ›</Text>
            </View>
            <View style={styles.players}>
              {match.players.map((name, index) => {
                const profile = match.playerIds && getPlayer(match.playerIds[index]);
                return (
                  <View key={index} style={styles.player}>
                    {profile && <Avatar avatar={profile.avatar} color={profile.color} size={22} />}
                    <Text style={styles.playerName}>{name}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={styles.progress}>{getProgress(match, game)}</Text>
            <Text style={common.subtitle}>{startedLabel(match.createdAt)}</Text>
          </Pressable>
        );
      })}
      {ongoing.length > MAX_SHOWN && (
        <Text style={common.subtitle}>
          Et {ongoing.length - MAX_SHOWN} autre{ongoing.length - MAX_SHOWN > 1 ? 's' : ''}, à retrouver dans la fiche de chaque jeu.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  card: { gap: 6, borderLeftWidth: 4, borderLeftColor: colors.primary },
  pressed: { opacity: 0.7 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  resume: { fontSize: 15, fontWeight: '700', color: colors.primary },
  players: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  player: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playerName: { fontSize: 14, color: colors.text },
  progress: { fontSize: 14, fontWeight: '600', color: colors.primary },
});
