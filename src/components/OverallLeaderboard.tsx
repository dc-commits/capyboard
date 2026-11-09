import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { useGames } from '@/store/games';
import { useMatches } from '@/store/matches';
import { usePlayers } from '@/store/players';
import { getOverallLeaderboard } from '@/store/stats';
import { colors, common } from '@/theme';

const MEDALS = ['🥇', '🥈', '🥉'];

function plural(count: number, word: string): string {
  return `${count} ${word}${count > 1 ? 's' : ''}`;
}

/** Classement des profils tous jeux confondus */
export function OverallLeaderboard() {
  const { players } = usePlayers();
  const { matches } = useMatches();
  const { games } = useGames();
  const leaderboard = getOverallLeaderboard(players, matches, games);

  if (leaderboard.length === 0) return null;

  return (
    <>
      <Text style={common.sectionTitle}>Classement général</Text>
      <View style={[common.card, styles.card]}>
        {leaderboard.map(({ player, played, wins, gamesPlayed }, index) => (
          <Pressable
            key={player.id}
            accessibilityRole="button"
            accessibilityLabel={`${index + 1}e : ${player.name}, ${plural(wins, 'victoire')}`}
            onPress={() => router.push({ pathname: '/players/[id]', params: { id: player.id } })}
            style={({ pressed }) => [styles.row, index > 0 && styles.separator, pressed && styles.pressed]}
          >
            <Text style={[styles.rank, index < MEDALS.length && styles.medal]}>{MEDALS[index] ?? `${index + 1}`}</Text>
            <Avatar avatar={player.avatar} color={player.color} size={36} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {player.name}
              </Text>
              <Text style={common.subtitle}>
                {plural(played, 'partie')} · {plural(gamesPlayed, 'jeu')}
              </Text>
            </View>
            <View style={styles.score}>
              <Text style={styles.wins}>{wins}</Text>
              <Text style={styles.winsLabel}>
                {wins > 1 ? 'victoires' : 'victoire'} · {Math.round((wins / played) * 100)}
                {' '}%
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Text style={common.sectionTitle}>Profils</Text>
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
  score: { alignItems: 'flex-end' },
  wins: { fontSize: 20, fontWeight: '800', color: colors.primary },
  winsLabel: { fontSize: 11, color: colors.muted },
});
