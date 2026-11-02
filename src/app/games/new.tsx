import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { EMPTY_GAME, GameForm } from '@/components/GameForm';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useGames } from '@/store/games';
import { common } from '@/theme';

export default function NewGameScreen() {
  const contentStyle = useContentStyle();
  const { createGame } = useGames();

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled">
        <GameForm
          initial={EMPTY_GAME}
          submitLabel="Créer le jeu"
          onSubmit={(input) => {
            const game = createGame(input);
            router.replace({ pathname: '/games/[id]', params: { id: game.id } });
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
