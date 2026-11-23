import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { CatalogRow } from '@/components/CatalogRow';
import { GameRow } from '@/components/GameRow';
import { GameTiles, TILES_PER_ROW } from '@/components/GameTile';
import { OngoingMatches } from '@/components/OngoingMatches';
import { UpdateBanner } from '@/components/UpdateBanner';
import type { Game } from '@/data/games';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useFavorites } from '@/store/favorites';
import { useGames } from '@/store/games';
import { useMatches } from '@/store/matches';
import { colors, common } from '@/theme';
import { filterAndSortGames, matchesQuery } from '@/utils/gameList';

/** Jeux joués récemment affichés sur l'accueil (en plus des favoris) */
const RECENT_COUNT = TILES_PER_ROW;
/** Sans favori ni partie, on montre le début de la bibliothèque pour que l'accueil ne soit pas vide */
const DISCOVER_COUNT = TILES_PER_ROW * 2;

const byName = (a: Game, b: Game) => a.name.localeCompare(b.name, 'fr');

export default function HomeScreen() {
  const contentStyle = useContentStyle();
  const { matches } = useMatches();
  const { games: allGames, library, isInLibrary } = useGames();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  // Pendant une recherche, le logo laisse la place aux résultats, au-dessus du clavier
  const searching = searchFocused || query !== '';
  const hasQuery = query.trim() !== '';

  // Dernière partie de chaque jeu, pour la section « Joués récemment »
  const lastPlayed = new Map<string, string>();
  for (const match of matches) {
    const current = lastPlayed.get(match.gameId);
    if (!current || match.createdAt > current) lastPlayed.set(match.gameId, match.createdAt);
  }
  const favoriteGames = library.filter((game) => isFavorite(game.id)).sort(byName);
  const recentGames = library
    .filter((game) => !isFavorite(game.id) && lastPlayed.has(game.id))
    .sort((a, b) => (lastPlayed.get(b.id) ?? '').localeCompare(lastPlayed.get(a.id) ?? ''))
    .slice(0, RECENT_COUNT);
  const discoverGames = favoriteGames.length === 0 && recentGames.length === 0 ? [...library].sort(byName).slice(0, DISCOVER_COUNT) : [];

  // Recherche : toute la bibliothèque, puis les jeux du catalogue qui n'y sont pas encore
  const libraryResults = hasQuery
    ? filterAndSortGames(library, matches, isFavorite, { query, sort: 'favorites', players: null, maxDuration: null })
    : [];
  const catalogResults = hasQuery
    ? filterAndSortGames(
        allGames.filter((game) => !isInLibrary(game.id)),
        matches,
        isFavorite,
        { query, sort: 'alpha', players: null, maxDuration: null },
      )
    : [];

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <View style={styles.headerButtons}>
              <Pressable accessibilityRole="button" accessibilityLabel="Boîte à outils" hitSlop={10} onPress={() => router.push('/tools')}>
                <Text style={styles.headerButton}>🧰</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Calendrier" hitSlop={10} onPress={() => router.push('/calendar')}>
                <Text style={styles.headerButton}>📅</Text>
              </Pressable>
              <Pressable accessibilityRole="button" hitSlop={10} onPress={() => router.push('/players')}>
                <Text style={styles.headerButton}>👥 Joueurs</Text>
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView style={common.screen} contentContainerStyle={[contentStyle, styles.content]} keyboardShouldPersistTaps="handled">
        {!searching && (
          <View style={styles.hero}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              accessibilityLabel="Capy Board"
              accessibilityIgnoresInvertColors
            />
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
        <OngoingMatches filter={(game) => matchesQuery(game, query)} />

        {hasQuery ? (
          <>
            {libraryResults.length > 0 && <Text style={common.sectionTitle}>Ma bibliothèque</Text>}
            {libraryResults.map((game) => (
              <GameRow
                key={game.id}
                game={game}
                playedCount={matches.filter((match) => match.gameId === game.id).length}
                favorite={isFavorite(game.id)}
                onToggleFavorite={() => toggleFavorite(game.id)}
              />
            ))}
            {catalogResults.length > 0 && <Text style={common.sectionTitle}>Dans le catalogue</Text>}
            {catalogResults.map((game) => (
              <CatalogRow key={game.id} game={game} />
            ))}
            {libraryResults.length === 0 && catalogResults.length === 0 && (
              <Text style={common.subtitle}>Aucun jeu ne correspond à « {query.trim()} ».</Text>
            )}
          </>
        ) : library.length === 0 ? (
          <View style={[common.card, styles.emptyLibrary]}>
            <Text style={common.subtitle}>Ta bibliothèque est vide : ajoute des jeux depuis le catalogue ou crée les tiens.</Text>
            <Button label="➕  Ajouter des jeux" onPress={() => router.push('/library')} />
          </View>
        ) : (
          <>
            {favoriteGames.length > 0 && (
              <>
                <Text style={common.sectionTitle}>⭐ Favoris</Text>
                <GameTiles games={favoriteGames} />
              </>
            )}
            {recentGames.length > 0 && (
              <>
                <Text style={common.sectionTitle}>🕒 Joués récemment</Text>
                <GameTiles games={recentGames} />
              </>
            )}
            {discoverGames.length > 0 && (
              <>
                <Text style={common.sectionTitle}>Ma bibliothèque</Text>
                <GameTiles games={discoverGames} />
                <Text style={styles.hint}>Astuce : mets tes jeux préférés en favoris ⭐ depuis leur fiche pour les retrouver ici.</Text>
              </>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/my-library')}
              style={({ pressed }) => [common.card, styles.libraryButton, pressed && styles.pressed]}
            >
              <Text style={styles.libraryLabel}>📚 Toute ma bibliothèque</Text>
              <Text style={styles.libraryCount}>{library.length} ›</Text>
            </Pressable>
          </>
        )}

        <View style={styles.links}>
          <Pressable accessibilityRole="link" onPress={() => router.push('/backup')} hitSlop={8}>
            <Text style={styles.footerText}>☁️ Sauvegarde</Text>
          </Pressable>
          <Text style={styles.footerText}>·</Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/about')} hitSlop={8}>
            <Text style={styles.footerText}>À propos · Mises à jour</Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12 },
  hero: { alignItems: 'center', gap: 4 },
  logo: { width: 140, height: 141 },
  tagline: { textAlign: 'center' },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  headerButton: { fontSize: 16, fontWeight: '600', color: colors.primary },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1 },
  clear: { fontSize: 18, color: colors.muted, paddingHorizontal: 4 },
  emptyLibrary: { gap: 12 },
  hint: { fontSize: 13, color: colors.muted, textAlign: 'center' },
  libraryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  libraryLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  libraryCount: { fontSize: 16, fontWeight: '700', color: colors.primary },
  pressed: { opacity: 0.7 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 },
  footerText: { fontSize: 14, fontWeight: '600', color: colors.muted },
});
