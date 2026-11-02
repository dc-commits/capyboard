import { Stack, router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { CatalogRow } from '@/components/CatalogRow';
import { Chip } from '@/components/Chip';
import { OngoingMatches } from '@/components/OngoingMatches';
import { UpdateBanner } from '@/components/UpdateBanner';
import { formatDuration, formatPlayers, type Game } from '@/data/games';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useFavorites } from '@/store/favorites';
import { useGames } from '@/store/games';
import { useMatches } from '@/store/matches';
import { colors, common } from '@/theme';
import { DURATION_FILTERS, PLAYER_FILTERS, SORT_LABELS, filterAndSortGames, matchesQuery, type GameSort } from '@/utils/gameList';

export default function GamesScreen() {
  const contentStyle = useContentStyle();
  const { matches } = useMatches();
  const { games: allGames, library, isInLibrary } = useGames();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<GameSort>('favorites');
  const [players, setPlayers] = useState<number | null>(null);
  const [maxDuration, setMaxDuration] = useState<number | null>(null);
  // Pendant une recherche, le logo laisse la place aux résultats, au-dessus du clavier
  const searching = searchFocused || query !== '';

  const activeFilters = Number(players !== null) + Number(maxDuration !== null);
  const games = filterAndSortGames(library, matches, isFavorite, { query, sort, players, maxDuration });
  // Pendant une recherche, on propose aussi les jeux du catalogue qui ne sont pas (encore) dans la bibliothèque
  const catalogResults = query.trim()
    ? filterAndSortGames(
        allGames.filter((game) => !isInLibrary(game.id)),
        matches,
        isFavorite,
        { query, sort: 'alpha', players, maxDuration },
      )
    : [];

  const resetFilters = () => {
    setQuery('');
    setPlayers(null);
    setMaxDuration(null);
  };

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

            <View style={styles.listHeader}>
              <Text style={common.sectionTitle}>Ma bibliothèque</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: showFilters }}
                hitSlop={8}
                onPress={() => setShowFilters((current) => !current)}
              >
                <Text style={styles.filtersToggle}>
                  Trier et filtrer{activeFilters > 0 ? ` (${activeFilters})` : ''} {showFilters ? '▴' : '▾'}
                </Text>
              </Pressable>
            </View>
            {showFilters && (
              <View style={[common.card, styles.filters]}>
                <Text style={styles.filterLabel}>Trier par</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  {(Object.keys(SORT_LABELS) as GameSort[]).map((value) => (
                    <Chip key={value} label={SORT_LABELS[value]} selected={sort === value} onPress={() => setSort(value)} />
                  ))}
                </ScrollView>
                <Text style={styles.filterLabel}>Nombre de joueurs</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  <Chip label="Tous" selected={players === null} onPress={() => setPlayers(null)} />
                  {PLAYER_FILTERS.map((value) => (
                    <Chip
                      key={value}
                      label={value === PLAYER_FILTERS[PLAYER_FILTERS.length - 1] ? `${value}+` : String(value)}
                      selected={players === value}
                      onPress={() => setPlayers(value)}
                    />
                  ))}
                </ScrollView>
                <Text style={styles.filterLabel}>Durée</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  <Chip label="Toutes" selected={maxDuration === null} onPress={() => setMaxDuration(null)} />
                  {DURATION_FILTERS.map((value) => (
                    <Chip key={value} label={`≤ ${value} min`} selected={maxDuration === value} onPress={() => setMaxDuration(value)} />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          catalogResults.length > 0 ? (
            <Text style={common.subtitle}>Aucun jeu de ta bibliothèque ne correspond.</Text>
          ) : library.length === 0 ? (
            <Text style={common.subtitle}>Ta bibliothèque est vide : ajoute des jeux depuis le catalogue ou crée les tiens.</Text>
          ) : (
            <View style={styles.empty}>
              <Text style={common.subtitle}>Aucun jeu ne correspond à ta recherche ou à tes filtres.</Text>
              <Button label="Réinitialiser" variant="secondary" onPress={resetFilters} />
            </View>
          )
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {catalogResults.length > 0 && (
              <View style={styles.catalog}>
                <Text style={common.sectionTitle}>Dans le catalogue</Text>
                {catalogResults.map((game) => (
                  <CatalogRow key={game.id} game={game} />
                ))}
              </View>
            )}
            <Button label="➕  Ajouter des jeux" variant="secondary" onPress={() => router.push('/library')} />
            <Pressable accessibilityRole="link" onPress={() => router.push('/about')} style={styles.about} hitSlop={8}>
              <Text style={styles.footerText}>À propos · Mises à jour</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item: game }) => (
          <GameRow
            game={game}
            playedCount={matches.filter((match) => match.gameId === game.id).length}
            favorite={isFavorite(game.id)}
            onToggleFavorite={() => toggleFavorite(game.id)}
          />
        )}
      />
    </>
  );
}

type GameRowProps = {
  game: Game;
  playedCount: number;
  favorite: boolean;
  onToggleFavorite: () => void;
};

function GameRow({ game, playedCount, favorite, onToggleFavorite }: GameRowProps) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/games/[id]', params: { id: game.id } })}
      style={({ pressed }) => [common.card, styles.row, pressed && styles.pressed]}
    >
      <Text style={styles.emoji}>{game.emoji}</Text>
      <View style={styles.info}>
        <Text style={common.title}>{game.name}</Text>
        <Text style={common.subtitle}>
          {formatPlayers(game)} · {formatDuration(game)}
        </Text>
      </View>
      {playedCount > 0 && <Text style={styles.badge}>{playedCount}</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={favorite ? `Retirer ${game.name} des favoris` : `Ajouter ${game.name} aux favoris`}
        accessibilityState={{ selected: favorite }}
        hitSlop={12}
        onPress={onToggleFavorite}
      >
        <Text style={[styles.star, favorite && styles.starOn]}>{favorite ? '★' : '☆'}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, paddingBottom: 4 },
  hero: { alignItems: 'center', gap: 4, paddingBottom: 8 },
  logo: { width: 210, height: 211 },
  tagline: { textAlign: 'center' },
  headerButton: { fontSize: 16, fontWeight: '600', color: colors.primary },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1 },
  clear: { fontSize: 18, color: colors.muted, paddingHorizontal: 4 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  filtersToggle: { fontSize: 14, fontWeight: '600', color: colors.primary },
  filters: { gap: 8 },
  filterLabel: { fontSize: 12, color: colors.muted },
  chips: { gap: 8 },
  empty: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.7 },
  emoji: { fontSize: 34 },
  info: { flex: 1, gap: 2 },
  footer: { gap: 12, paddingTop: 4 },
  catalog: { gap: 12, marginTop: 8 },
  about: { alignSelf: 'center' },
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
