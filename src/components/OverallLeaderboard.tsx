import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Chip } from '@/components/Chip';
import { useGames } from '@/store/games';
import { useMatches } from '@/store/matches';
import { usePlayers } from '@/store/players';
import { getOverallLeaderboard } from '@/store/stats';
import { colors, common } from '@/theme';
import { PERIOD_LABELS, isInPeriod, type Period } from '@/utils/dates';
import { plural } from '@/utils/text';

const MEDALS = ['🥇', '🥈', '🥉'];

/** Classement des profils tous jeux confondus */
export function OverallLeaderboard() {
  const { players } = usePlayers();
  const { matches } = useMatches();
  const { games } = useGames();
  const [period, setPeriod] = useState<Period>('all');
  // Une partie compte pour la période où elle a commencé, comme dans le calendrier
  const periodMatches = matches.filter((match) => isInPeriod(new Date(match.createdAt), period));
  const leaderboard = getOverallLeaderboard(players, periodMatches, games);

  // Rien à classer tant qu'aucune partie n'est terminée, quelle que soit la période
  if (getOverallLeaderboard(players, matches, games).length === 0) return null;

  return (
    <>
      <Text style={common.sectionTitle}>Classement général</Text>
      <View style={styles.periods}>
        {(Object.keys(PERIOD_LABELS) as Period[]).map((value) => (
          <Chip key={value} label={PERIOD_LABELS[value]} selected={period === value} onPress={() => setPeriod(value)} />
        ))}
      </View>
      {leaderboard.length === 0 ? (
        <Text style={common.subtitle}>Aucune partie terminée sur cette période.</Text>
      ) : (
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
                  {plural(played, 'partie')} · {plural(gamesPlayed, 'jeu', 'jeux')}
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
      )}
      <Text style={common.sectionTitle}>Profils</Text>
    </>
  );
}

const styles = StyleSheet.create({
  periods: { flexDirection: 'row', gap: 8 },
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
