import type { Game } from '@/data/games';
import { getTotals, getWinners, type Match } from '@/store/matches';
import type { Player } from '@/store/players';
import { dayKey } from '@/utils/dates';

export type GameStats = {
  game: Game;
  played: number;
  wins: number;
  /** Meilleur total sur une partie (le plus haut ou le plus bas selon le jeu) ; `null` pour un jeu sans score */
  best: number | null;
  average: number | null;
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
  const played = results.length;
  const wins = results.filter((result) => result.won).length;
  if (game.scoreless) return { game, played, wins, best: null, average: null };
  return {
    game,
    played,
    wins,
    best: game.winner === 'highest' ? Math.max(...totals) : Math.min(...totals),
    average: Math.round((totals.reduce((sum, total) => sum + total, 0) / totals.length) * 10) / 10,
  };
}

/** Statistiques d'un profil sur ses parties terminées */
export function getPlayerStats(playerId: string, matches: Match[], games: Game[]): PlayerStats {
  const byGame = games.flatMap((game) => getGameStats(playerId, game, matches) ?? []).sort((a, b) => b.played - a.played);

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
        bestFirst * ((a.stats.best ?? 0) - (b.stats.best ?? 0)),
    );
}

export type OverallEntry = {
  player: Player;
  played: number;
  wins: number;
  /** Nombre de jeux différents auxquels le joueur a terminé une partie */
  gamesPlayed: number;
};

/** Classement tous jeux confondus : victoires, puis taux de victoire, puis nombre de parties */
export function getOverallLeaderboard(players: Player[], matches: Match[], games: Game[]): OverallEntry[] {
  return players
    .flatMap((player) => {
      const stats = getPlayerStats(player.id, matches, games);
      return stats.played > 0 ? [{ player, played: stats.played, wins: stats.wins, gamesPlayed: stats.byGame.length }] : [];
    })
    .sort((a, b) => b.wins - a.wins || b.wins / b.played - a.wins / a.played || b.played - a.played);
}

export type DayWinner = {
  /** Profil du joueur, ou son nom pour les parties d'avant les profils */
  key: string;
  playerId?: string;
  name: string;
  wins: number;
};

export type DaySummary = {
  /** Parties commencées ce jour-là, les plus récentes d'abord */
  matches: Match[];
  /** Joueurs ayant gagné au moins une partie terminée ce jour-là, du plus victorieux au moins */
  winners: DayWinner[];
};

/** Bilan de chaque journée de jeu, indexé par jour (voir `dayKey`) */
export function getDaySummaries(matches: Match[], games: Game[]): Map<string, DaySummary> {
  const days = new Map<string, DaySummary>();
  const sorted = [...matches].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const match of sorted) {
    const key = dayKey(new Date(match.createdAt));
    const summary = days.get(key) ?? { matches: [], winners: [] };
    summary.matches.push(match);
    const game = games.find((candidate) => candidate.id === match.gameId);
    if (game && match.finishedAt) {
      for (const index of getWinners(match, game).leaders) {
        const playerId = match.playerIds?.[index];
        const winnerKey = playerId ?? `name:${match.players[index]}`;
        const existing = summary.winners.find((winner) => winner.key === winnerKey);
        if (existing) existing.wins++;
        else summary.winners.push({ key: winnerKey, playerId, name: match.players[index], wins: 1 });
      }
    }
    days.set(key, summary);
  }
  for (const summary of days.values()) summary.winners.sort((a, b) => b.wins - a.wins);
  return days;
}
