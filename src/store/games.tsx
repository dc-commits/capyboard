import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { BUILT_IN_GAMES, type Game } from '@/data/games';
import { parseRules } from '@/data/rules';
import { createId } from '@/utils/id';

/** Ce qu'on saisit pour créer ou modifier un jeu dans l'app */
export type CustomGameInput = Pick<Game, 'name' | 'emoji' | 'minPlayers' | 'maxPlayers' | 'durationMinutes' | 'winner' | 'endCondition'> & {
  /** Règles telles que tapées (voir `parseRules`) */
  rulesText: string;
};

type StoredCustomGame = CustomGameInput & { id: string; createdAt: string };

type GamesContextValue = {
  /** Catalogue intégré et jeux créés */
  games: Game[];
  /** Jeux de « ma bibliothèque », affichés sur l'accueil */
  library: Game[];
  loaded: boolean;
  getGame: (id: string) => Game | undefined;
  isInLibrary: (id: string) => boolean;
  addToLibrary: (id: string) => void;
  removeFromLibrary: (id: string) => void;
  /** Saisie d'origine d'un jeu créé, pour le modifier */
  getCustomInput: (id: string) => CustomGameInput | undefined;
  createGame: (input: CustomGameInput) => Game;
  updateGame: (id: string, input: CustomGameInput) => void;
  deleteGame: (id: string) => void;
};

const CUSTOM_GAMES_KEY = 'capyboard/custom-games/v1';
const LIBRARY_KEY = 'capyboard/library/v1';

function toGame(stored: StoredCustomGame): Game {
  const { rulesText, createdAt: _createdAt, ...fields } = stored;
  return { ...fields, custom: true, rules: parseRules(rulesText) };
}

const GamesContext = createContext<GamesContextValue | null>(null);

export function GamesProvider({ children }: { children: ReactNode }) {
  const [customGames, setCustomGames] = useState<StoredCustomGame[]>([]);
  // Sans bibliothèque enregistrée, elle contient tout le catalogue intégré
  const [libraryIds, setLibraryIds] = useState<string[]>(BUILT_IN_GAMES.map((game) => game.id));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([CUSTOM_GAMES_KEY, LIBRARY_KEY])
      .then(([[, custom], [, library]]) => {
        if (custom) setCustomGames(JSON.parse(custom) as StoredCustomGame[]);
        if (library) setLibraryIds(JSON.parse(library) as string[]);
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) void AsyncStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(customGames));
  }, [customGames, loaded]);

  useEffect(() => {
    if (loaded) void AsyncStorage.setItem(LIBRARY_KEY, JSON.stringify(libraryIds));
  }, [libraryIds, loaded]);

  const value = useMemo<GamesContextValue>(() => {
    const games = [...BUILT_IN_GAMES, ...customGames.map(toGame)];
    const getGame = (id: string) => games.find((game) => game.id === id);
    return {
      games,
      library: games.filter((game) => libraryIds.includes(game.id)),
      loaded,
      getGame,
      isInLibrary: (id) => libraryIds.includes(id),
      addToLibrary: (id) => setLibraryIds((current) => (current.includes(id) ? current : [...current, id])),
      removeFromLibrary: (id) => setLibraryIds((current) => current.filter((gameId) => gameId !== id)),
      getCustomInput: (id) => {
        const stored = customGames.find((game) => game.id === id);
        if (!stored) return undefined;
        const { id: _id, createdAt: _createdAt, ...input } = stored;
        return input;
      },
      createGame: (input) => {
        const stored: StoredCustomGame = { ...input, id: `custom-${createId()}`, createdAt: new Date().toISOString() };
        setCustomGames((current) => [...current, stored]);
        setLibraryIds((current) => [...current, stored.id]);
        return toGame(stored);
      },
      updateGame: (id, input) => setCustomGames((current) => current.map((game) => (game.id === id ? { ...game, ...input } : game))),
      deleteGame: (id) => {
        setCustomGames((current) => current.filter((game) => game.id !== id));
        setLibraryIds((current) => current.filter((gameId) => gameId !== id));
      },
    };
  }, [customGames, libraryIds, loaded]);

  return <GamesContext.Provider value={value}>{children}</GamesContext.Provider>;
}

export function useGames(): GamesContextValue {
  const context = useContext(GamesContext);
  if (!context) throw new Error('useGames must be used inside GamesProvider');
  return context;
}
