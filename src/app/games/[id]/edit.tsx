import { router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { GameForm } from '@/components/GameForm';
import { useContentStyle } from '@/hooks/useContentStyle';
import { useGames } from '@/store/games';
import { common } from '@/theme';

export default function EditGameScreen() {
  const contentStyle = useContentStyle();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getCustomInput, updateGame } = useGames();
  const initial = getCustomInput(id);

  if (!initial) return <Text style={common.content}>Seuls les jeux créés dans l’app peuvent être modifiés.</Text>;

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled">
        <GameForm
          initial={initial}
          submitLabel="Enregistrer"
          onSubmit={(input) => {
            updateGame(id, input);
            router.back();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
