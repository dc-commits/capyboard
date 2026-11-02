import { GAMES, type Game } from '@/data/games';
import { getTotals, getWinners, type Match } from '@/store/matches';
import type { Player } from '@/store/players';

export type GameStats = {
  game: Game;
  played: number;
  wins: number;
  /** Meilleur total sur une partie (le plus haut ou le plus bas selon le jeu) */
  best: number;
  average: number;
};

export type PlayerStats = {
  played: number;
  wins: number;
  /** Uniquement les jeux auxquels le joueur a joué, du plus joué au moins joué */
  byGame: GameStats[];
};

/** Statistiques d'un profil sur un jeu, d'après ses parties terminées (`null` s'il n'y a pas joué) */
function getGameStats(playerId: string, game: Game, matches: Match[]): GameStats | null {
  const results = matches.flatMap((match) => {
    const index = match.playerIds?.indexOf(playerId) ?? -1;
    if (match.gameId !== game.id || !match.finishedAt || index === -1) return [];
    return [{ total: getTotals(match)[index], won: getWinners(match, game).leaders.includes(index) }];
  });
  if (results.length === 0) return null;
  const totals = results.map((result) => result.total);
  return {
    game,
    played: results.length,
    wins: results.filter((result) => result.won).length,
    best: game.winner === 'highest' ? Math.max(...totals) : Math.min(...totals),
    average: Math.round((totals.reduce((sum, total) => sum + total, 0) / totals.length) * 10) / 10,
  };
}

/** Statistiques d'un profil sur ses parties terminées */
export function getPlayerStats(playerId: string, matches: Match[]): PlayerStats {
  const byGame = GAMES.flatMap((game) => getGameStats(playerId, game, matches) ?? []).sort((a, b) => b.played - a.played);

  return {
    played: byGame.reduce((sum, stats) => sum + stats.played, 0),
    wins: byGame.reduce((sum, stats) => sum + stats.wins, 0),
    byGame,
  };
}

export type LeaderboardEntry = { player: Player; stats: GameStats };

/**
 * Classement d'un jeu : les profils qui y ont terminé au moins une partie, par victoires,
 * puis taux de victoire, puis meilleur score
 */
export function getGameLeaderboard(game: Game, players: Player[], matches: Match[]): LeaderboardEntry[] {
  const bestFirst = game.winner === 'highest' ? -1 : 1;
  return players
    .flatMap((player) => {
      const stats = getGameStats(player.id, game, matches);
      return stats ? [{ player, stats }] : [];
    })
    .sort(
      (a, b) =>
        b.stats.wins - a.stats.wins ||
        b.stats.wins / b.stats.played - a.stats.wins / a.stats.played ||
        bestFirst * (a.stats.best - b.stats.best),
    );
}
