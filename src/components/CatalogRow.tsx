import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDuration, formatPlayers, type Game } from '@/data/games';
import { useGames } from '@/store/games';
import { colors, common } from '@/theme';

/** Jeu du catalogue, avec un bouton pour l'ajouter à sa bibliothèque ou l'en retirer */
export function CatalogRow({ game }: { game: Game }) {
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
