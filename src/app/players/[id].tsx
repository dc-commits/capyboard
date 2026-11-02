import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { PlayerForm } from '@/components/PlayerForm';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useGames } from '@/store/games';
import { useMatches } from '@/store/matches';
import { usePlayers } from '@/store/players';
import { getPlayerStats } from '@/store/stats';
import { colors, common } from '@/theme';

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function winRate(wins: number, played: number): string {
  return played === 0 ? '–' : `${Math.round((wins / played) * 100)} %`;
}

export default function PlayerScreen() {
  const { games } = useGames();
  const contentStyle = useContentStyle();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getPlayer, updatePlayer, deletePlayer } = usePlayers();
  const { matches, renamePlayer } = useMatches();
  const [editing, setEditing] = useState(false);
  const player = getPlayer(id);

  if (!player) return <Text style={common.content}>Joueur introuvable</Text>;

  const stats = getPlayerStats(player.id, matches, games);

  const confirmDelete = () =>
    Alert.alert(`Supprimer ${player.name} ?`, 'Ses parties sont conservées, mais ne compteront plus dans ses statistiques.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          router.back();
          deletePlayer(player.id);
        },
      },
    ]);

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: player.name }} />
      <ScrollView contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled">
        {editing ? (
          <PlayerForm
            initial={player}
            submitLabel="Enregistrer"
            onSubmit={(input) => {
              updatePlayer(player.id, input);
              if (input.name !== player.name) renamePlayer(player.id, input.name);
              setEditing(false);
            }}
          />
        ) : (
          <>
            <View style={[common.card, styles.header]}>
              <Avatar avatar={player.avatar} color={player.color} size={88} />
              <Text style={styles.name}>{player.name}</Text>
            </View>
            <View style={[common.card, styles.stats]}>
              <Stat value={String(stats.played)} label={stats.played > 1 ? 'parties' : 'partie'} />
              <Stat value={String(stats.wins)} label={stats.wins > 1 ? 'victoires' : 'victoire'} />
              <Stat value={winRate(stats.wins, stats.played)} label="de victoires" />
            </View>

            <Text style={common.sectionTitle}>Par jeu</Text>
            {stats.byGame.length === 0 && <Text style={common.subtitle}>Aucune partie terminée pour l’instant.</Text>}
            {stats.byGame.map(({ game, played, wins, best, average }) => (
              <View key={game.id} style={[common.card, styles.game]}>
                <Text style={common.title}>
                  {game.emoji} {game.name}
                </Text>
                <View style={styles.stats}>
                  <Stat value={`${wins}/${played}`} label="victoires" />
                  <Stat value={String(best)} label="meilleur score" />
                  <Stat value={String(average).replace('.', ',')} label="moyenne" />
                </View>
              </View>
            ))}

            <Button label="Modifier le profil" variant="secondary" onPress={() => setEditing(true)} />
            <Button label="Supprimer le joueur" variant="danger" onPress={confirmDelete} />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: 8 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text },
  stats: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  game: { gap: 10 },
});
