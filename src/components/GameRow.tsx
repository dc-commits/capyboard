import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatDuration, formatPlayers, type Game } from '@/data/games';
import { colors, common } from '@/theme';

type Props = {
  game: Game;
  playedCount: number;
  favorite: boolean;
  onToggleFavorite: () => void;
};

/** Ligne d'un jeu de la bibliothèque : fiche, nombre de parties et étoile des favoris */
export function GameRow({ game, playedCount, favorite, onToggleFavorite }: Props) {
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.7 },
  emoji: { fontSize: 34 },
  info: { flex: 1, gap: 2 },
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
