import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { randomAvatar } from '@/data/avatars';
import { createId } from '@/utils/id';

export type Player = {
  id: string;
  name: string;
  avatar: string;
  color: string;
  createdAt: string;
};

export type PlayerInput = Pick<Player, 'name' | 'avatar' | 'color'>;

type PlayersContextValue = {
  /** Triés par nom */
  players: Player[];
  loaded: boolean;
  getPlayer: (id: string) => Player | undefined;
  /** Avatar et couleur tirés au hasard s'ils ne sont pas fournis */
  createPlayer: (input: Pick<Player, 'name'> & Partial<PlayerInput>) => Player;
  updatePlayer: (id: string, input: PlayerInput) => void;
  deletePlayer: (id: string) => void;
};

const STORAGE_KEY = 'capyboard/players/v1';

const PlayersContext = createContext<PlayersContextValue | null>(null);

export function PlayersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setPlayers(JSON.parse(raw) as Player[]);
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(players));
  }, [players, loaded]);

  const value = useMemo<PlayersContextValue>(
    () => ({
      players: [...players].sort((a, b) => a.name.localeCompare(b.name, 'fr')),
      loaded,
      getPlayer: (id) => players.find((player) => player.id === id),
      createPlayer: (input) => {
        const player: Player = { ...randomAvatar(), ...input, id: createId(), createdAt: new Date().toISOString() };
        setPlayers((current) => [...current, player]);
        return player;
      },
      updatePlayer: (id, input) => setPlayers((current) => current.map((player) => (player.id === id ? { ...player, ...input } : player))),
      deletePlayer: (id) => setPlayers((current) => current.filter((player) => player.id !== id)),
    }),
    [players, loaded],
  );

  return <PlayersContext.Provider value={value}>{children}</PlayersContext.Provider>;
}

export function usePlayers(): PlayersContextValue {
  const context = useContext(PlayersContext);
  if (!context) throw new Error('usePlayers must be used inside PlayersProvider');
  return context;
}
