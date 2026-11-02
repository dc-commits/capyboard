import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OngoingMatches } from '@/components/OngoingMatches';
import { UpdateBanner } from '@/components/UpdateBanner';
import { GAMES, type Game } from '@/data/games';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useFavorites } from '@/store/favorites';
import { useMatches } from '@/store/matches';
import { colors, common } from '@/theme';
import { normalizeSearch } from '@/utils/text';

export default function GamesScreen() {
  const contentStyle = useContentStyle();
  const { matches } = useMatches();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  // Pendant une recherche, le logo laisse la place aux résultats, au-dessus du clavier
  const searching = searchFocused || query !== '';

  const matchesSearch = (game: Game) => normalizeSearch(game.name).includes(normalizeSearch(query));
  // Favoris d'abord, chaque groupe dans l'ordre du catalogue
  const games = GAMES.filter(matchesSearch).sort((a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id)));

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
        contentContainerStyle={contentStyle}
        data={games}
        keyExtractor={(game) => game.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.header}>
            {!searching && (
              <View style={styles.hero}>
                <Image source={require('../../assets/logo.png')} style={styles.logo} accessibilityIgnoresInvertColors />
                <Text style={styles.appName}>Capy Board</Text>
                <Text style={[common.subtitle, styles.tagline]}>Les règles et les scores de vos jeux, en toute zénitude</Text>
              </View>
            )}
            <UpdateBanner />
            <View style={styles.search}>
              <TextInput
                style={[common.input, styles.searchInput]}
                placeholder="🔍 Rechercher un jeu ou une partie"
                placeholderTextColor={colors.muted}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                autoCorrect={false}
                returnKeyType="search"
              />
              {query !== '' && (
                <Pressable accessibilityRole="button" accessibilityLabel="Effacer la recherche" hitSlop={10} onPress={() => setQuery('')}>
                  <Text style={styles.clear}>✕</Text>
                </Pressable>
              )}
            </View>
            <OngoingMatches filter={matchesSearch} />
            {games.length > 0 && <Text style={common.sectionTitle}>Jeux</Text>}
          </View>
        }
        ListFooterComponent={
          <Pressable accessibilityRole="link" onPress={() => router.push('/about')} style={styles.footer} hitSlop={8}>
            <Text style={styles.footerText}>À propos · Mises à jour</Text>
          </Pressable>
        }
        ListEmptyComponent={<Text style={common.subtitle}>Aucun jeu ne correspond à « {query.trim()} ».</Text>}
        renderItem={({ item: game }) => {
          const count = matches.filter((match) => match.gameId === game.id).length;
          const favorite = isFavorite(game.id);
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={favorite ? `Retirer ${game.name} des favoris` : `Ajouter ${game.name} aux favoris`}
                accessibilityState={{ selected: favorite }}
                hitSlop={12}
                onPress={() => toggleFavorite(game.id)}
              >
                <Text style={[styles.star, favorite && styles.starOn]}>{favorite ? '★' : '☆'}</Text>
              </Pressable>
            </Pressable>
          );
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, paddingBottom: 4 },
  hero: { alignItems: 'center', gap: 4, paddingBottom: 8 },
  logo: { width: 112, height: 112 },
  tagline: { textAlign: 'center' },
  appName: { fontSize: 28, fontWeight: '800', color: colors.text },
  headerButton: { fontSize: 16, fontWeight: '600', color: colors.primary },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1 },
  clear: { fontSize: 18, color: colors.muted, paddingHorizontal: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.7 },
  emoji: { fontSize: 34 },
  info: { flex: 1, gap: 2 },
  footer: { alignSelf: 'center', paddingTop: 12 },
  footerText: { fontSize: 14, fontWeight: '600', color: colors.muted },
  star: { fontSize: 26, color: colors.muted },
  starOn: { color: colors.star },
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
