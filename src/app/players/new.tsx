import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { PlayerForm } from '@/components/PlayerForm';
import { randomAvatar } from '@/data/avatars';
import { usePlayers } from '@/store/players';
import { common } from '@/theme';

export default function NewPlayerScreen() {
  const { createPlayer } = usePlayers();
  const [initial] = useState(() => ({ name: '', ...randomAvatar() }));

  return (
    <KeyboardAvoidingView style={common.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={common.content} keyboardShouldPersistTaps="handled">
        <PlayerForm
          initial={initial}
          submitLabel="Créer le joueur"
          onSubmit={(input) => {
            createPlayer(input);
            router.back();
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
