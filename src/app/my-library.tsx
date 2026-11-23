import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { GameRow } from '@/components/GameRow';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useFavorites } from '@/store/favorites';
import { useGames } from '@/store/games';
import { useMatches } from '@/store/matches';
import { colors, common } from '@/theme';
import { DURATION_FILTERS, PLAYER_FILTERS, SORT_LABELS, filterAndSortGames, type GameSort } from '@/utils/gameList';
import { plural } from '@/utils/text';

/** Toute la bibliothèque, avec recherche, tri et filtres */
export default function MyLibraryScreen() {
  const contentStyle = useContentStyle();
  const { matches } = useMatches();
  const { library } = useGames();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<GameSort>('favorites');
  const [players, setPlayers] = useState<number | null>(null);
  const [maxDuration, setMaxDuration] = useState<number | null>(null);

  const activeFilters = Number(players !== null) + Number(maxDuration !== null);
  const games = filterAndSortGames(library, matches, isFavorite, { query, sort, players, maxDuration });

  const resetFilters = () => {
    setQuery('');
    setPlayers(null);
    setMaxDuration(null);
  };

  return (
    <FlatList
      style={common.screen}
      contentContainerStyle={contentStyle}
      data={games}
      keyExtractor={(game) => game.id}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.search}>
            <TextInput
              style={[common.input, styles.searchInput]}
              placeholder="🔍 Rechercher dans ma bibliothèque"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query !== '' && (
              <Pressable accessibilityRole="button" accessibilityLabel="Effacer la recherche" hitSlop={10} onPress={() => setQuery('')}>
                <Text style={styles.clear}>✕</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.listHeader}>
            <Text style={common.sectionTitle}>{plural(games.length, 'jeu', 'jeux')}</Text>
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
        library.length === 0 ? (
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
          <Button label="➕  Ajouter des jeux" variant="secondary" onPress={() => router.push('/library')} />
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
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, paddingBottom: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1 },
  clear: { fontSize: 18, color: colors.muted, paddingHorizontal: 4 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  filtersToggle: { fontSize: 14, fontWeight: '600', color: colors.primary },
  filters: { gap: 8 },
  filterLabel: { fontSize: 12, color: colors.muted },
  chips: { gap: 8 },
  empty: { gap: 12 },
  footer: { gap: 12, paddingTop: 4 },
});
