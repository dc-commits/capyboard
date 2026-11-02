import { Stack, router } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { OngoingMatches } from '@/components/OngoingMatches';
import { GAMES } from '@/data/games';
import { useMatches } from '@/store/matches';
import { colors, common } from '@/theme';

export default function GamesScreen() {
  const { matches } = useMatches();

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/players')}>
              <Text style={styles.headerButton}>👥 Joueurs</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        style={common.screen}
        contentContainerStyle={common.content}
        data={GAMES}
        keyExtractor={(game) => game.id}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.hero}>
              <Image source={require('../../assets/logo.png')} style={styles.logo} accessibilityIgnoresInvertColors />
              <Text style={styles.appName}>Capy Board</Text>
              <Text style={[common.subtitle, styles.tagline]}>Les règles et les scores de vos jeux, en toute zénitude</Text>
            </View>
            <OngoingMatches />
          </View>
        }
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
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8 },
  hero: { alignItems: 'center', gap: 4, paddingBottom: 8 },
  logo: { width: 112, height: 112 },
  tagline: { textAlign: 'center' },
  appName: { fontSize: 28, fontWeight: '800', color: colors.text },
  headerButton: { fontSize: 16, fontWeight: '600', color: colors.primary },
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
