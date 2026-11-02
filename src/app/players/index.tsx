import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useMatches } from '@/store/matches';
import { usePlayers } from '@/store/players';
import { getPlayerStats } from '@/store/stats';
import { common } from '@/theme';

export default function PlayersScreen() {
  const contentStyle = useContentStyle();
  const { players } = usePlayers();
  const { matches } = useMatches();

  return (
    <FlatList
      style={common.screen}
      contentContainerStyle={contentStyle}
      data={players}
      keyExtractor={(player) => player.id}
      ListHeaderComponent={<Button label="+ Nouveau joueur" onPress={() => router.push('/players/new')} />}
      ListEmptyComponent={
        <Text style={common.subtitle}>Aucun joueur pour l’instant. Crée un profil ici ou directement en lançant une partie.</Text>
      }
      renderItem={({ item: player }) => {
        const { played, wins } = getPlayerStats(player.id, matches);
        return (
          <Pressable
            onPress={() => router.push({ pathname: '/players/[id]', params: { id: player.id } })}
            style={({ pressed }) => [common.card, styles.row, pressed && styles.pressed]}
          >
            <Avatar avatar={player.avatar} color={player.color} />
            <View style={styles.info}>
              <Text style={common.title}>{player.name}</Text>
              <Text style={common.subtitle}>
                {played} partie{played > 1 ? 's' : ''} · {wins} victoire{wins > 1 ? 's' : ''}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.7 },
  info: { flex: 1, gap: 2 },
});
