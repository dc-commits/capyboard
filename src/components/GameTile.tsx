import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Game } from '@/data/games';
import { colors, common } from '@/theme';

/** Tuiles par ligne sur l'accueil */
export const TILES_PER_ROW = 3;
const GAP = 10;

/** Grille de tuiles compactes (emoji et nom), pour les sections de l'accueil */
export function GameTiles({ games }: { games: Game[] }) {
  // Lignes complétées par des cases vides, pour que la dernière tuile garde la même largeur
  const rows = Array.from({ length: Math.ceil(games.length / TILES_PER_ROW) }, (_, row) =>
    games.slice(row * TILES_PER_ROW, row * TILES_PER_ROW + TILES_PER_ROW),
  );
  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((game) => (
            <GameTile key={game.id} game={game} />
          ))}
          {Array.from({ length: TILES_PER_ROW - row.length }, (_, index) => (
            <View key={`empty-${index}`} style={styles.spacer} />
          ))}
        </View>
      ))}
    </View>
  );
}

function GameTile({ game }: { game: Game }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={game.name}
      onPress={() => router.push({ pathname: '/games/[id]', params: { id: game.id } })}
      style={({ pressed }) => [common.card, styles.tile, pressed && styles.pressed]}
    >
      <Text style={styles.emoji}>{game.emoji}</Text>
      <Text style={styles.name} numberOfLines={2}>
        {game.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grid: { gap: GAP },
  row: { flexDirection: 'row', gap: GAP },
  tile: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, paddingHorizontal: 8 },
  spacer: { flex: 1 },
  pressed: { opacity: 0.7 },
  emoji: { fontSize: 32 },
  name: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center', minHeight: 36 },
});
