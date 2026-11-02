import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import type { Game } from '@/data/games';
import { useMatches } from '@/store/matches';
import { usePlayers } from '@/store/players';
import { getGameLeaderboard } from '@/store/stats';
import { colors, common } from '@/theme';

const MEDALS = ['🥇', '🥈', '🥉'];

/** « 67 % » avec une espace insécable, pour que le % ne passe pas à la ligne */
function winRate(wins: number, played: number): string {
  return `${Math.round((wins / played) * 100)}\u00a0%`;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count > 1 ? 's' : ''}`;
}

export function GameLeaderboard({ game }: { game: Game }) {
  const { players } = usePlayers();
  const { matches } = useMatches();
  const leaderboard = getGameLeaderboard(game, players, matches);

  return (
    <>
      <Text style={common.sectionTitle}>Classement</Text>
      {leaderboard.length === 0 ? (
        <Text style={common.subtitle}>Le classement apparaîtra après la première partie terminée avec des profils de joueurs.</Text>
      ) : (
        <View style={[common.card, styles.card]}>
          {leaderboard.map(({ player, stats }, index) => (
            <Pressable
              key={player.id}
              accessibilityRole="button"
              accessibilityLabel={`${index + 1}e : ${player.name}, ${plural(stats.wins, 'victoire')}`}
              onPress={() => router.push({ pathname: '/players/[id]', params: { id: player.id } })}
              style={({ pressed }) => [styles.row, index > 0 && styles.separator, pressed && styles.pressed]}
            >
              <Text style={[styles.rank, index < MEDALS.length && styles.medal]}>{MEDALS[index] ?? `${index + 1}`}</Text>
              <Avatar avatar={player.avatar} color={player.color} size={34} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {player.name}
                </Text>
                <Text style={common.subtitle}>
                  {stats.wins}/{plural(stats.played, 'partie')} gagnée{stats.wins > 1 ? 's' : ''} · {winRate(stats.wins, stats.played)}
                </Text>
              </View>
              {stats.best !== null && (
                <View style={styles.best}>
                  <Text style={styles.bestValue}>{stats.best}</Text>
                  <Text style={styles.bestLabel}>record</Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { opacity: 0.6 },
  rank: { width: 28, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.muted },
  medal: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  best: { alignItems: 'center' },
  bestValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  bestLabel: { fontSize: 11, color: colors.muted },
});
