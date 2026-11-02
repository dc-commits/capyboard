import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { FavoritesProvider } from '@/store/favorites';
import { MatchesProvider } from '@/store/matches';
import { PlayersProvider } from '@/store/players';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <PlayersProvider>
      <MatchesProvider>
        <FavoritesProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.primary,
              headerTitleStyle: { color: colors.text },
              headerShadowVisible: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Capy Board' }} />
            <Stack.Screen name="games/[id]/index" options={{ title: '' }} />
            <Stack.Screen name="games/[id]/rules" options={{ title: 'Règles' }} />
            <Stack.Screen name="games/[id]/new-match" options={{ title: 'Nouvelle partie', presentation: 'modal' }} />
            <Stack.Screen name="matches/[matchId]" options={{ title: 'Partie' }} />
            <Stack.Screen name="players/index" options={{ title: 'Joueurs' }} />
            <Stack.Screen name="players/new" options={{ title: 'Nouveau joueur', presentation: 'modal' }} />
            <Stack.Screen name="players/[id]" options={{ title: '' }} />
            <Stack.Screen name="about" options={{ title: 'À propos' }} />
          </Stack>
        </FavoritesProvider>
      </MatchesProvider>
    </PlayersProvider>
  );
}
