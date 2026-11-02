import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { getGame } from '@/data/games';
import { useMatches } from '@/store/matches';
import { colors, common } from '@/theme';

export default function NewMatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const game = getGame(id);
  const { matches, createMatch } = useMatches();

  // Pré-remplit avec les joueurs de la dernière partie de ce jeu
  const lastPlayers = matches.find((match) => match.gameId === id)?.players;
  const [players, setPlayers] = useState<string[]>(lastPlayers ?? ['', '']);

  if (!game) return <Text style={common.content}>Jeu introuvable</Text>;

  const names = players.map((player) => player.trim()).filter(Boolean);

  const start = () => {
    const match = createMatch(game.id, names);
    router.replace({ pathname: '/matches/[matchId]', params: { matchId: match.id } });
  };

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
        <Text style={common.title}>
          {game.emoji} {game.name}
        </Text>
        <Text style={common.sectionTitle}>Joueurs</Text>
        {players.map((player, index) => (
          <View key={index} style={styles.row}>
            <TextInput
              style={[common.input, styles.input]}
              placeholder={`Joueur ${index + 1}`}
              placeholderTextColor={colors.muted}
              value={player}
              autoCapitalize="words"
              returnKeyType="next"
              onChangeText={(text) => setPlayers((current) => current.map((value, i) => (i === index ? text : value)))}
            />
            {players.length > 1 && (
              <Pressable
                accessibilityLabel={`Retirer le joueur ${index + 1}`}
                hitSlop={10}
                onPress={() => setPlayers((current) => current.filter((_, i) => i !== index))}
              >
                <Text style={styles.remove}>✕</Text>
              </Pressable>
            )}
          </View>
        ))}
        <Button label="+ Ajouter un joueur" variant="secondary" onPress={() => setPlayers((current) => [...current, ''])} />
        <Button label="Commencer la partie" disabled={names.length === 0} onPress={start} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1 },
  remove: { fontSize: 18, color: colors.muted, paddingHorizontal: 4 },
});
