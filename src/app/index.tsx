import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { GAMES } from '@/data/games';
import { useMatches } from '@/store/matches';
import { colors, common } from '@/theme';

export default function GamesScreen() {
  const { matches } = useMatches();

  return (
    <FlatList
      style={common.screen}
      contentContainerStyle={common.content}
      data={GAMES}
      keyExtractor={(game) => game.id}
      renderItem={({ item: game }) => {
        const count = matches.filter((match) => match.gameId === game.id).length;
        return (
          <Pressable
            onPress={() => router.push({ pathname: '/games/[id]', params: { id: game.id } })}
            style={({ pressed }) => [common.card, styles.row, pressed && styles.pressed]}
          >
            <Text style={styles.emoji}>{game.emoji}</Text>
            <View style={styles.info}>
              <Text style={common.title}>{game.name}</Text>
              <Text style={common.subtitle}>
                {game.players} · {game.duration}
              </Text>
            </View>
            {count > 0 && <Text style={styles.badge}>{count}</Text>}
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.7 },
  emoji: { fontSize: 34 },
  info: { flex: 1, gap: 2 },
  badge: {
    minWidth: 26,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 13,
    overflow: 'hidden',
    backgroundColor: colors.border,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },
});
