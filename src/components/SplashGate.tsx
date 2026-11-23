import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useFavorites } from '@/store/favorites';
import { useGames } from '@/store/games';
import { useMatches } from '@/store/matches';
import { usePlayers } from '@/store/players';

/** Au-delà, on montre l'app même si un chargement traîne, plutôt que de rester bloqué sur l'écran de démarrage */
const MAX_WAIT_MS = 3000;

// Appelé au chargement du module, avant le premier rendu : sinon l'écran de démarrage est déjà parti
void SplashScreen.preventAutoHideAsync();

/** Garde l'écran de démarrage jusqu'à ce que les données soient lues, pour ne pas montrer un accueil vide */
export function SplashGate() {
  const games = useGames();
  const players = usePlayers();
  const matches = useMatches();
  const favorites = useFavorites();
  const ready = games.loaded && players.loaded && matches.loaded && favorites.loaded;

  useEffect(() => {
    const timeout = setTimeout(() => SplashScreen.hide(), MAX_WAIT_MS);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hide();
  }, [ready]);

  return null;
}
