import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Game, RoundDetail, TieBreaker } from '@/data/games';

export type Match = {
  id: string;
  gameId: string;
  createdAt: string;
  finishedAt: string | null;
  players: string[];
  /** Une ligne par manche, un score par joueur (même ordre que `players`) */
  rounds: number[][];
  /** Saisie détaillée (jeux avec `scoring`) : même forme que `rounds`, les valeurs saisies au lieu du score */
  details?: RoundDetail[][];
};

type MatchesContextValue = {
  matches: Match[];
  loaded: boolean;
  createMatch: (gameId: string, players: string[]) => Match;
  addRound: (matchId: string, scores: number[], details?: RoundDetail[]) => void;
  removeRound: (matchId: string, roundIndex: number) => void;
  finishMatch: (matchId: string) => void;
  deleteMatch: (matchId: string) => void;
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
      createMatch: (gameId, players) => {
        const match: Match = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          gameId,
          createdAt: new Date().toISOString(),
          finishedAt: null,
          players,
          rounds: [],
        };
        setMatches((current) => [match, ...current]);
        return match;
      },
      addRound: (matchId, scores, details) =>
        updateMatch(matchId, (match) => ({
          ...match,
          rounds: [...match.rounds, scores],
          ...(details && { details: [...(match.details ?? []), details] }),
        })),
      removeRound: (matchId, roundIndex) =>
        updateMatch(matchId, (match) => ({
          ...match,
          rounds: match.rounds.filter((_, index) => index !== roundIndex),
          ...(match.details && { details: match.details.filter((_, index) => index !== roundIndex) }),
        })),
      finishMatch: (matchId) => updateMatch(matchId, (match) => ({ ...match, finishedAt: new Date().toISOString() })),
      deleteMatch: (matchId) => setMatches((current) => current.filter((match) => match.id !== matchId)),
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

export function getTotals(match: Match): number[] {
  return match.players.map((_, playerIndex) => match.rounds.reduce((sum, round) => sum + (round[playerIndex] ?? 0), 0));
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
  if (match.rounds.length === 0) return { leaders: [] };
  let leaders = keepBest(
    match.players.map((_, index) => index),
    getTotals(match),
    game.winner,
  );
  const hasAllDetails = match.details?.length === match.rounds.length;
  if (leaders.length < 2 || !game.scoring || !hasAllDetails) return { leaders };

  for (const tieBreaker of game.scoring.tieBreakers) {
    leaders = keepBest(leaders, getTieBreakerTotals(match, tieBreaker), tieBreaker.better);
    if (leaders.length === 1) return { leaders, decidedBy: tieBreaker.label };
  }
  return { leaders };
}
