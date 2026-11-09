import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { EndCondition, Game, RoundDetail, TieBreaker } from '@/data/games';
import type { Player } from '@/store/players';
import { createId } from '@/utils/id';

export type Match = {
  id: string;
  gameId: string;
  createdAt: string;
  finishedAt: string | null;
  /** Noms des joueurs au moment de la partie */
  players: string[];
  /** Profils des joueurs, même ordre que `players` (absent sur les parties d'avant les profils) */
  playerIds?: string[];
  /** Une ligne par manche, un score par joueur (même ordre que `players`) */
  rounds: number[][];
  /** Saisie détaillée (jeux avec `scoring`) : même forme que `rounds`, les valeurs saisies au lieu du score */
  details?: RoundDetail[][];
  /** Extensions du jeu utilisées pour cette partie */
  expansionIds?: string[];
  /** Jeux sans score : joueurs désignés gagnants en fin de partie */
  winnerIndexes?: number[];
  /** Scores masqués jusqu'à la révélation, pour garder le suspense (repris par la revanche) */
  hiddenScores?: boolean;
  /** Scores cachés déjà révélés en fin de partie */
  revealed?: boolean;
};

type MatchesContextValue = {
  matches: Match[];
  loaded: boolean;
  /** Sans profil (parties d'avant les profils), `id` est absent */
  createMatch: (gameId: string, players: (Pick<Player, 'name'> & Partial<Pick<Player, 'id'>>)[], expansionIds?: string[]) => Match;
  /** Ajoute une manche et termine la partie si la condition de fin est atteinte */
  addRound: (matchId: string, round: { scores: number[]; details?: RoundDetail[] }, endCondition: EndCondition) => void;
  /** Supprime une manche ; la partie redevient en cours */
  removeRound: (matchId: string, roundIndex: number) => void;
  finishMatch: (matchId: string) => void;
  /** Jeux sans score : désigne le ou les gagnants et termine la partie */
  setWinners: (matchId: string, winnerIndexes: number[]) => void;
  resumeMatch: (matchId: string) => void;
  setHiddenScores: (matchId: string, hidden: boolean) => void;
  revealScores: (matchId: string) => void;
  deleteMatch: (matchId: string) => void;
  /** Répercute le nouveau nom d'un profil dans ses parties */
  renamePlayer: (playerId: string, name: string) => void;
};

const STORAGE_KEY = 'capyboard/matches/v1';

const MatchesContext = createContext<MatchesContextValue | null>(null);

export function MatchesProvider({ children }: { children: ReactNode }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setMatches(JSON.parse(raw) as Match[]);
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(matches));
  }, [matches, loaded]);

  const updateMatch = useCallback((matchId: string, update: (match: Match) => Match) => {
    setMatches((current) => current.map((match) => (match.id === matchId ? update(match) : match)));
  }, []);

  const value = useMemo<MatchesContextValue>(
    () => ({
      matches,
      loaded,
      createMatch: (gameId, players, expansionIds) => {
        const match: Match = {
          id: createId(),
          gameId,
          createdAt: new Date().toISOString(),
          finishedAt: null,
          players: players.map((player) => player.name),
          ...(players.every((player) => player.id) && { playerIds: players.flatMap((player) => player.id ?? []) }),
          rounds: [],
          ...(expansionIds && expansionIds.length > 0 && { expansionIds }),
        };
        setMatches((current) => [match, ...current]);
        return match;
      },
      addRound: (matchId, { scores, details }, endCondition) =>
        updateMatch(matchId, (match) => {
          const next: Match = {
            ...match,
            rounds: [...match.rounds, scores],
            // Les manches saisies avant la saisie détaillée gardent un détail vide
            ...(details && { details: [...(match.details ?? match.rounds.map(() => [])), details] }),
          };
          return isGameOver(next, endCondition) ? { ...next, finishedAt: new Date().toISOString() } : next;
        }),
      removeRound: (matchId, roundIndex) =>
        updateMatch(matchId, (match) => ({
          ...match,
          finishedAt: null,
          rounds: match.rounds.filter((_, index) => index !== roundIndex),
          ...(match.details && { details: match.details.filter((_, index) => index !== roundIndex) }),
        })),
      finishMatch: (matchId) => updateMatch(matchId, (match) => ({ ...match, finishedAt: new Date().toISOString() })),
      setWinners: (matchId, winnerIndexes) =>
        updateMatch(matchId, (match) => ({ ...match, winnerIndexes, finishedAt: new Date().toISOString() })),
      resumeMatch: (matchId) => updateMatch(matchId, (match) => ({ ...match, finishedAt: null })),
      setHiddenScores: (matchId, hidden) => updateMatch(matchId, (match) => ({ ...match, hiddenScores: hidden, revealed: false })),
      revealScores: (matchId) => updateMatch(matchId, (match) => ({ ...match, revealed: true })),
      deleteMatch: (matchId) => setMatches((current) => current.filter((match) => match.id !== matchId)),
      renamePlayer: (playerId, name) =>
        setMatches((current) =>
          current.map((match) =>
            match.playerIds?.includes(playerId)
              ? { ...match, players: match.players.map((player, index) => (match.playerIds?.[index] === playerId ? name : player)) }
              : match,
          ),
        ),
    }),
    [matches, loaded, updateMatch],
  );

  return <MatchesContext.Provider value={value}>{children}</MatchesContext.Provider>;
}

export function useMatches(): MatchesContextValue {
  const context = useContext(MatchesContext);
  if (!context) throw new Error('useMatches must be used inside MatchesProvider');
  return context;
}

/** Scores masqués en ce moment : mode « scores cachés » et pas encore révélés */
export function areScoresHidden(match: Match): boolean {
  return !!match.hiddenScores && !match.revealed;
}

export function getTotals(match: Match): number[] {
  return match.players.map((_, playerIndex) => match.rounds.reduce((sum, round) => sum + (round[playerIndex] ?? 0), 0));
}

export function isGameOver(match: Match, endCondition: EndCondition): boolean {
  if (endCondition.type === 'rounds') return match.rounds.length >= endCondition.count;
  if (endCondition.type === 'manual') return false;
  return getTotals(match).some((total) => total >= endCondition.points);
}

function joinNames(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}` : (names[0] ?? '');
}

/** Où en est une partie en cours par rapport à sa condition de fin */
export function getProgress(match: Match, game: Game): string {
  if (game.scoreless) return 'Désignez le gagnant à la fin de la partie';
  const { endCondition } = game;
  if (endCondition.type === 'rounds') {
    const next = match.rounds.length + 1;
    return next >= endCondition.count
      ? `Manche ${next} sur ${endCondition.count} · dernière manche !`
      : `Manche ${next} sur ${endCondition.count}`;
  }
  if (endCondition.type === 'manual') return `Manche ${match.rounds.length + 1} · « Terminer la partie » quand vous le décidez`;
  if (match.rounds.length === 0) return `La partie s’arrête quand un joueur atteint ${endCondition.points} points`;
  if (areScoresHidden(match)) return `Fin à ${endCondition.points} points · 🙈 scores cachés`;
  const totals = getTotals(match);
  const max = Math.max(...totals);
  const closest = match.players.filter((_, index) => totals[index] === max);
  return `Fin à ${endCondition.points} points · ${joinNames(closest)} : ${max}`;
}

/** Pourquoi une partie terminée s'est arrêtée */
export function getEndReason(match: Match, game: Game): string {
  if (game.scoreless) return 'Partie terminée';
  const { endCondition } = game;
  const played = `${match.rounds.length} manche${match.rounds.length > 1 ? 's' : ''}`;
  if (endCondition.type === 'rounds') {
    return match.rounds.length >= endCondition.count ? `Partie terminée en ${played}` : `Partie arrêtée après ${played}`;
  }
  if (endCondition.type === 'manual') return `Partie terminée en ${played}`;
  const totals = getTotals(match);
  const reached = match.players.filter((_, index) => totals[index] >= endCondition.points);
  if (reached.length === 0) return `Partie arrêtée après ${played}, avant ${endCondition.points} points`;
  return `${joinNames(reached)} ${reached.length > 1 ? 'ont' : 'a'} atteint ${endCondition.points} points en ${played}`;
}

/** Total d'un critère de départage pour chaque joueur, sur toutes les manches détaillées */
export function getTieBreakerTotals(match: Match, tieBreaker: TieBreaker): number[] {
  return match.players.map((_, playerIndex) => (match.details ?? []).reduce((sum, round) => sum + tieBreaker.value(round[playerIndex]), 0));
}

function keepBest(candidates: number[], values: number[], better: 'highest' | 'lowest'): number[] {
  const candidateValues = candidates.map((index) => values[index]);
  const best = better === 'highest' ? Math.max(...candidateValues) : Math.min(...candidateValues);
  return candidates.filter((index) => values[index] === best);
}

export type Winners = {
  /** Index des joueurs en tête (plusieurs en cas d'égalité persistante) */
  leaders: number[];
  /** Critère qui a départagé une égalité au total, le cas échéant */
  decidedBy?: string;
};

export function getWinners(match: Match, game: Game): Winners {
  if (game.scoreless) return { leaders: match.winnerIndexes ?? [] };
  if (match.rounds.length === 0) return { leaders: [] };
  let leaders = keepBest(
    match.players.map((_, index) => index),
    getTotals(match),
    game.winner,
  );
  const hasAllDetails =
    match.details?.length === match.rounds.length && match.details.every((round) => round.length === match.players.length);
  if (leaders.length < 2 || !game.scoring || !hasAllDetails) return { leaders };

  for (const tieBreaker of game.scoring.tieBreakers) {
    leaders = keepBest(leaders, getTieBreakerTotals(match, tieBreaker), tieBreaker.better);
    if (leaders.length === 1) return { leaders, decidedBy: tieBreaker.label };
  }
  return { leaders };
}
