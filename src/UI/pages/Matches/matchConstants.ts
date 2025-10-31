export const MatchTypes = ["bo1", "bo2", "bo3", "bo5"] as const;
export type MatchTypeKey = (typeof MatchTypes)[number];

export const DEFAULT_MATCH_TYPE: MatchTypeKey = 'bo3';
export const FALLBACK_MATCH_TYPE: MatchTypeKey = 'bo3';
export const MATCH_TYPES: readonly MatchTypeKey[] = MatchTypes;

export const maps = [
  "de_mirage",
  "de_cache",
  "de_inferno",
  "de_dust2",
  "de_train",
  "de_overpass",
  "de_nuke",
  "de_vertigo",
  "de_ancient",
  "de_anubis",
] as const;

export type MapKey = (typeof maps)[number];

export type VetoType = 'ban' | 'pick' | 'decider';

export interface VetoScore {
  [teamId: string]: number;
}

export interface Veto {
  teamId: string;
  mapName: string;
  side: "CT" | "T" | "NO";
  type: VetoType;
  reverseSide?: boolean;
  rounds?: (RoundData | null)[];
  score?: VetoScore;
  winner?: string;
  mapEnd: boolean;
}

export interface Match {
  id: string;
  left: { id: string | null; wins: number };
  right: { id: string | null; wins: number };
  matchType: MatchTypeKey;
  current: boolean;
  vetos: Veto[];
}

export interface RoundData {
  round: number;
  players: {
    [steamid: string]: PlayerRoundData;
  };
  winner: "CT" | "T" | null;
  win_type: "bomb" | "elimination" | "defuse" | "time" | null;
}

export interface PlayerRoundData {
  kills: number;
  killshs: number;
  damage: number;
}

export const VETO_CONFIG: Record<MatchTypeKey, VetoType[]> = {
  bo1: ['ban', 'ban', 'ban', 'ban', 'ban', 'ban', 'decider'],
  bo2: ['pick', 'pick'],
  bo3: ['ban', 'ban', 'pick', 'pick', 'ban', 'ban', 'decider'],
  bo5: ['ban', 'ban', 'pick', 'pick', 'pick', 'pick', 'decider']
};

export const createEmptyVeto = (type: VetoType): Veto => ({
  teamId: '',
  mapName: '',
  side: 'NO',
  type,
  mapEnd: false,
  reverseSide: false
});

export const buildDefaultVetos = (matchType: MatchTypeKey): Veto[] => {
  return VETO_CONFIG[matchType].map(type => createEmptyVeto(type));
};

interface SeriesWinsResult {
  left: number;
  right: number;
  hasResults: boolean;
}

export const calculateSeriesWins = (
  vetos: Veto[],
  leftTeamId: string | null,
  rightTeamId: string | null
): SeriesWinsResult => {
  if (!leftTeamId || !rightTeamId) {
    return { left: 0, right: 0, hasResults: false };
  }

  const result = vetos.reduce(
    (acc, veto) => {
      if (!veto.mapEnd || !veto.winner) return acc;

      if (veto.winner === leftTeamId) {
        acc.left += 1;
      } else if (veto.winner === rightTeamId) {
        acc.right += 1;
      }
      acc.hasResults = true;

      return acc;
    },
    { left: 0, right: 0, hasResults: false }
  );

  return result;
};
