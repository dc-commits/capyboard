import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useGames } from '@/store/games';
import { getWinners, useMatches } from '@/store/matches';
import { usePlayers } from '@/store/players';
import { getDaySummaries, type DaySummary, type DayWinner } from '@/store/stats';
import { colors, common } from '@/theme';
import { dayKey, formatMonth, monthGrid } from '@/utils/dates';
import { plural } from '@/utils/text';

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/** Calendrier des journées de jeu, avec le meilleur joueur de chaque jour */
export default function CalendarScreen() {
  const contentStyle = useContentStyle();
  const { matches } = useMatches();
  const { games, getGame } = useGames();
  const { getPlayer } = usePlayers();
  const today = new Date();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const todayKey = dayKey(today);
  const [selected, setSelected] = useState(todayKey);
  // On ne navigue pas au-delà du mois en cours : il n'y a encore rien à y voir
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();

  const summaries = getDaySummaries(matches, games);
  const weeks = monthGrid(month);
  const monthDays = weeks.flat().flatMap((date) => (date && summaries.has(dayKey(date)) ? [dayKey(date)] : []));
  const monthMatches = monthDays.reduce((sum, key) => sum + (summaries.get(key)?.matches.length ?? 0), 0);
  const champions = monthChampions(monthDays.flatMap((key) => summaries.get(key)?.winners ?? []));
  const selectedSummary = summaries.get(selected);

  const changeMonth = (offset: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  const avatarOf = (winner: DayWinner) => (winner.playerId ? getPlayer(winner.playerId) : undefined);

  return (
    <ScrollView style={common.screen} contentContainerStyle={contentStyle}>
      <View style={common.card}>
        <View style={styles.monthHeader}>
          <Pressable accessibilityRole="button" accessibilityLabel="Mois précédent" hitSlop={12} onPress={() => changeMonth(-1)}>
            <Text style={styles.arrow}>‹</Text>
          </Pressable>
          <Text style={common.title}>{formatMonth(month)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mois suivant"
            accessibilityState={{ disabled: isCurrentMonth }}
            disabled={isCurrentMonth}
            hitSlop={12}
            onPress={() => changeMonth(1)}
          >
            <Text style={[styles.arrow, isCurrentMonth && styles.disabled]}>›</Text>
          </Pressable>
        </View>

        <View style={styles.week}>
          {WEEKDAYS.map((label, index) => (
            <Text key={index} style={[styles.cell, styles.weekday]}>
              {label}
            </Text>
          ))}
        </View>
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.week}>
            {week.map((date, dayIndex) => {
              if (!date) return <View key={dayIndex} style={styles.cell} />;
              const key = dayKey(date);
              const summary = summaries.get(key);
              const topWinner = summary?.winners[0];
              const profile = topWinner && avatarOf(topWinner);
              // Les dates s'écrivent AAAA-MM-JJ : l'ordre alphabétique est l'ordre chronologique
              const future = key > todayKey;
              return (
                <Pressable
                  key={dayIndex}
                  accessibilityRole="button"
                  accessibilityLabel={`${date.getDate()}${summary ? `, ${plural(summary.matches.length, 'partie')}` : ''}`}
                  accessibilityState={{ selected: key === selected, disabled: future }}
                  disabled={future}
                  onPress={() => setSelected(key)}
                  style={[
                    styles.cell,
                    styles.day,
                    summary && styles.played,
                    key === todayKey && styles.today,
                    key === selected && styles.selected,
                  ]}
                >
                  <Text style={[styles.dayNumber, summary && styles.playedNumber, future && styles.disabled]}>{date.getDate()}</Text>
                  {profile ? (
                    <Avatar avatar={profile.avatar} color={profile.color} size={22} />
                  ) : summary ? (
                    <Text style={styles.dayMark}>{topWinner ? '🏆' : '🎲'}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={[common.card, styles.monthStats]}>
        <Text style={common.subtitle}>
          {monthDays.length === 0
            ? 'Aucune partie ce mois-ci.'
            : `${plural(monthDays.length, 'jour')} de jeu · ${plural(monthMatches, 'partie')}`}
        </Text>
        {champions.length > 0 && (
          <Text style={styles.champion}>
            👑 Champion du mois : {champions.map((winner) => winner.name).join(' & ')} ({plural(champions[0].wins, 'victoire')})
          </Text>
        )}
      </View>

      <Text style={common.sectionTitle}>
        {new Date(`${selected}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </Text>
      {selectedSummary ? (
        <DayDetails summary={selectedSummary} getGame={(id) => getGame(id)} avatarOf={avatarOf} />
      ) : (
        <Text style={common.subtitle}>Pas de partie ce jour-là.</Text>
      )}
    </ScrollView>
  );
}

/** « 🏆 David · avec Léa, Max » : le ou les vainqueurs, puis les autres joueurs (sans doublon) */
function finishedLine(players: string[], leaders: number[]): string {
  const winners = leaders.map((index) => players[index]).join(' & ') || '—';
  const others = players.filter((_, index) => !leaders.includes(index));
  return others.length > 0 ? `🏆 ${winners} · avec ${others.join(', ')}` : `🏆 ${winners}`;
}

/** Cumule les victoires du mois par joueur et garde le ou les meilleurs */
function monthChampions(winners: DayWinner[]): DayWinner[] {
  const totals = new Map<string, DayWinner>();
  for (const winner of winners) {
    const current = totals.get(winner.key);
    totals.set(winner.key, current ? { ...current, wins: current.wins + winner.wins } : { ...winner });
  }
  const best = Math.max(0, ...[...totals.values()].map((winner) => winner.wins));
  return best === 0 ? [] : [...totals.values()].filter((winner) => winner.wins === best);
}

type DayDetailsProps = {
  summary: DaySummary;
  getGame: ReturnType<typeof useGames>['getGame'];
  avatarOf: (winner: DayWinner) => { avatar: string; color: string } | undefined;
};

function DayDetails({ summary, getGame, avatarOf }: DayDetailsProps) {
  return (
    <>
      {summary.winners.length > 0 && (
        <View style={[common.card, styles.winners]}>
          {summary.winners.map((winner, index) => {
            const profile = avatarOf(winner);
            return (
              <View key={winner.key} style={styles.winner}>
                <Text style={styles.winnerRank}>{index === 0 ? '👑' : `${index + 1}`}</Text>
                {profile && <Avatar avatar={profile.avatar} color={profile.color} size={30} />}
                <Text style={styles.winnerName} numberOfLines={1}>
                  {winner.name}
                </Text>
                <Text style={styles.winnerWins}>{plural(winner.wins, 'victoire')}</Text>
              </View>
            );
          })}
        </View>
      )}
      {summary.matches.map((match) => {
        const game = getGame(match.gameId);
        const leaders = game ? getWinners(match, game).leaders : [];
        return (
          <Pressable
            key={match.id}
            onPress={() => router.push({ pathname: '/matches/[matchId]', params: { matchId: match.id } })}
            style={({ pressed }) => [common.card, styles.match, pressed && styles.pressed]}
          >
            <Text style={styles.matchTitle}>
              {game ? `${game.emoji} ${game.name}` : 'Jeu supprimé'}
              <Text style={common.subtitle}>
                {' · '}
                {new Date(match.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Text>
            <Text style={common.subtitle}>
              {match.finishedAt ? finishedLine(match.players, leaders) : `En cours · ${match.players.join(', ')}`}
            </Text>
          </Pressable>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  arrow: { fontSize: 30, lineHeight: 32, color: colors.primary, paddingHorizontal: 8 },
  week: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center' },
  weekday: { fontSize: 12, fontWeight: '700', color: colors.muted, paddingVertical: 4, textAlign: 'center' },
  day: { aspectRatio: 0.85, justifyContent: 'center', gap: 2, borderRadius: 10, margin: 2 },
  played: { backgroundColor: '#FBE3C8' },
  today: { borderWidth: 1.5, borderColor: colors.muted },
  selected: { borderWidth: 2, borderColor: colors.primary },
  dayNumber: { fontSize: 14, color: colors.text },
  disabled: { opacity: 0.3 },
  playedNumber: { fontWeight: '800' },
  dayMark: { fontSize: 14 },
  monthStats: { gap: 4 },
  champion: { fontSize: 15, fontWeight: '700', color: colors.text },
  winners: { gap: 8 },
  winner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  winnerRank: { width: 26, textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.muted },
  winnerName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  winnerWins: { fontSize: 14, fontWeight: '700', color: colors.primary },
  match: { gap: 4 },
  matchTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  pressed: { opacity: 0.7 },
});
