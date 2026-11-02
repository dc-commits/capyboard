import { acceptsPlayers, type Game } from '@/data/games';
import type { Match } from '@/store/matches';
import { normalizeSearch } from '@/utils/text';

export type GameSort = 'favorites' | 'alpha' | 'mostPlayed' | 'recent';

export const SORT_LABELS: Record<GameSort, string> = {
  favorites: '⭐ Favoris',
  alpha: 'A → Z',
  mostPlayed: 'Plus joués',
  recent: 'Récents',
};

/** Nombre de joueurs proposés en filtre ; 8 veut dire « au moins 8 » côté affichage */
export const PLAYER_FILTERS = [2, 3, 4, 5, 6, 7, 8];
export const DURATION_FILTERS = [20, 30, 45];

export type GameListOptions = {
  query: string;
  sort: GameSort;
  /** Le jeu doit accepter ce nombre de joueurs */
  players: number | null;
  /** Durée maximale en minutes */
  maxDuration: number | null;
};

export function matchesQuery(game: Game, query: string): boolean {
  return normalizeSearch(game.name).includes(normalizeSearch(query));
}

/** Jeux filtrés et triés pour l'accueil */
export function filterAndSortGames(games: Game[], matches: Match[], isFavorite: (id: string) => boolean, options: GameListOptions): Game[] {
  const playedCount = (game: Game) => matches.filter((match) => match.gameId === game.id).length;
  const lastPlayed = (game: Game) =>
    matches
      .filter((match) => match.gameId === game.id)
      .reduce((latest, match) => (match.createdAt > latest ? match.createdAt : latest), '');
  const byName = (a: Game, b: Game) => a.name.localeCompare(b.name, 'fr');

  const compare: Record<GameSort, (a: Game, b: Game) => number> = {
    favorites: (a, b) => Number(isFavorite(b.id)) - Number(isFavorite(a.id)) || byName(a, b),
    alpha: byName,
    mostPlayed: (a, b) => playedCount(b) - playedCount(a) || byName(a, b),
    recent: (a, b) => lastPlayed(b).localeCompare(lastPlayed(a)) || byName(a, b),
  };

  return games
    .filter((game) => matchesQuery(game, options.query))
    .filter((game) => options.players === null || acceptsPlayers(game, options.players))
    .filter((game) => options.maxDuration === null || game.durationMinutes <= options.maxDuration)
    .sort(compare[options.sort]);
}
