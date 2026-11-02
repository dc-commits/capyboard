import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { formatDuration, formatPlayers, type Game } from '@/data/games';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useGames } from '@/store/games';
import { colors, common } from '@/theme';

/** Catalogue : choisir les jeux de sa bibliothèque, ou en créer */
export default function LibraryScreen() {
  const contentStyle = useContentStyle();
  const { games } = useGames();
  const builtIn = games.filter((game) => !game.custom).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const custom = games.filter((game) => game.custom).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  return (
    <ScrollView style={common.screen} contentContainerStyle={contentStyle}>
      <Button label="✏️  Créer un jeu" onPress={() => router.push('/games/new')} />
      <Text style={styles.hint}>
        Un jeu absent du catalogue ? Crée-le avec ses règles : la saisie des scores et les statistiques marcheront comme pour les autres.
      </Text>

      {custom.length > 0 && (
        <>
          <Text style={common.sectionTitle}>Mes jeux créés</Text>
          {custom.map((game) => (
            <CatalogRow key={game.id} game={game} />
          ))}
        </>
      )}

      <Text style={common.sectionTitle}>Catalogue Capy Board</Text>
      {builtIn.map((game) => (
        <CatalogRow key={game.id} game={game} />
      ))}
    </ScrollView>
  );
}

function CatalogRow({ game }: { game: Game }) {
  const { isInLibrary, addToLibrary, removeFromLibrary } = useGames();
  const inLibrary = isInLibrary(game.id);

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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={inLibrary ? `Retirer ${game.name} de ma bibliothèque` : `Ajouter ${game.name} à ma bibliothèque`}
        hitSlop={8}
        onPress={() => (inLibrary ? removeFromLibrary(game.id) : addToLibrary(game.id))}
        style={[styles.toggle, inLibrary && styles.toggleOn]}
      >
        <Text style={[styles.toggleText, inLibrary && styles.toggleTextOn]}>{inLibrary ? '✓ Ajouté' : '+ Ajouter'}</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 13, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.7 },
  emoji: { fontSize: 30 },
  info: { flex: 1, gap: 2 },
  toggle: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  toggleOn: { backgroundColor: colors.primary },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  toggleTextOn: { color: colors.primaryText },
});
