interface Window {
  electron: {
    startServer: (callback: (message: string) => void) => void;
    sendFrameAction: (payload: FrameWindowAction) => void;
    startOverlay: (config?: Partial<OverlayConfig>) => void;
    stopOverlay: () => void;
    onOverlayStatus: (
      callback: (status: OverlayStatus) => void,
    ) => () => void;
    getOverlayStatus: () => Promise<OverlayStatus>;
    setOverlayConfig: (config: Partial<OverlayConfig>) => void;
    openExternalLink: (url: string) => void;
    openHudsDirectory: () => void;
    openHudAssetsDirectory: () => void;
    setAppZoom: (zoomFactor: number) => void;
    importLegacyData: () => Promise<LegacyImportResult>;
    fixGSI: () => Promise<GSIResult>;
  };
  update: {
    updateMessage: (callback: (message: string) => void) => void;
  };
  players: {
    getPlayers: () => Promise<Player[]>;
  };
  teams: {
    getTeams: () => Promise<Team[]>;
  };
  matches: {
    getMatches: () => Promise<Match[]>;
  };
}

type EventPayloadMapping = {
  startServer: string;
  startOverlay: null;
  "overlay:start": Partial<OverlayConfig>;
  "overlay:stop": void;
  "overlay:setConfig": Partial<OverlayConfig>;
  "overlay:status": OverlayStatus;
  "overlay:getStatus": OverlayStatus;
  "overlay:getDisplays": OverlayDisplay[];
  sendFrameAction: FrameWindowAction;
  openExternalLink: string;
  getPlayers: Promise<Player[]>;
  updateMessage: string;
  openHudsDirectory: void;
  openHudAssetsDirectory: void;
  "app:setZoom": number;
  "legacy:import": LegacyImportResult;
  "gsi:fix": GSIResult;
};

type LegacyImportResult = {
  success: boolean;
  message: string;
  players: number;
  teams: number;
  coaches: number;
  matches: number;
  logs: string[];
};

type GSIResult = {
  success: boolean;
  message: string;
  targetPath?: string;
};

type FrameWindowAction =
  | "CLOSE"
  | "MAXIMIZE"
  | "MINIMIZE"
  | "CONSOLE"
  | "RESET";

interface Player {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
  country: string;
  steamid: string;
  team: string;
  extra: Record<string, string>;
}

interface Team {
  _id: string;
  name: string;
  country: string;
  shortName: string;
  logo: string;
  extra: Record<string, string>;
}
/*
   interface HUD {
      name: string,
      version: string,
      author: string,
      legacy: boolean,
      dir: string
  }
   
   interface Config {
      port: number,
      steamApiKey: string,
      token: string,
  }*/
interface TournamentMatchup {
  _id: string;
  loser_to: string | null; // IDs of Matchups, not Matches
  winner_to: string | null;
  label: string;
  matchId: string | null;
  parents: TournamentMatchup[];
}

interface DepthTournamentMatchup extends TournamentMatchup {
  depth: number;
  parents: DepthTournamentMatchup[];
}

type TournamentTypes = "swiss" | "single" | "double";

type TournamentStage = {
  type: TournamentTypes;
  matchups: TournamentMatchup[];
  teams: number;
  phases: number;
  participants: string[];
};
interface Tournament {
  _id: string;
  name: string;
  logo: string;
  groups: TournamentStage[];
  playoffs: TournamentStage;
  autoCreate: boolean;
}
interface RoundData {
  round: number;
  players: {
    [steamid: string]: PlayerRoundData;
  };
  winner: "CT" | "T" | null;
  win_type: "bomb" | "elimination" | "defuse" | "time" | null;
}

interface PlayerRoundData {
  kills: number;
  killshs: number;
  damage: number;
}

interface Veto {
  teamId: string;
  mapName: string;
  side: "CT" | "T" | "NO";
  type: "ban" | "pick" | "decider";
  reverseSide?: boolean;
  rounds?: (RoundData | null)[];
  score?: {
    [key: string]: number;
  };
  winner?: string;
  mapEnd: boolean;
}

interface Match {
  id: string;
  current: boolean;
  left: {
    id: string | null;
    wins: number;
  };
  right: {
    id: string | null;
    wins: number;
  };
  matchType: "bo1" | "bo3" | "bo5";
  vetos: Veto[];
}

type MapConfig = SingleLayer | DoubleLayer;

type OverlayDisplay = {
  id: number;
  label: string;
};

interface OverlayConfig {
  displayId: number | null;
  scale: number;
}

interface OverlayStatus {
  isVisible: boolean;
  config: OverlayConfig;
  displays: OverlayDisplay[];
}

type Weapon =
  | "ak47"
  | "aug"
  | "awp"
  | "bizon"
  | "famas"
  | "g3sg1"
  | "galilar"
  | "m4a1"
  | "m4a1_silencer"
  | "m249"
  | "mac10"
  | "mag7"
  | "mp5sd"
  | "mp7"
  | "mp9"
  | "negev"
  | "nova"
  | "p90"
  | "sawedoff"
  | "scar20"
  | "sg556"
  | "ssg08"
  | "ump45"
  | "xm1014"
  | Pistol
  | Knife;

type Pistol =
  | "c75a"
  | "deagle"
  | "elite"
  | "fiveseven"
  | "glock"
  | "hkp2000"
  | "p250"
  | "revolver"
  | "taser"
  | "tec9"
  | "usp_silencer";

type Knife =
  | "knife" //
  | "knife_css" //--
  | "knife_butterfly" //
  | "knife_falchion" //
  | "knife_flip" //
  | "knife_outdoor" // Nomad Knife
  | "knife_gut" //
  | "knife_gypsy_jackknife" //
  | "knife_karambit" //
  | "knife_bayonet" //
  | "knife_cord" //
  | "knife_m9_bayonet" //
  | "knife_push" // Shadow daggers
  | "knife_stiletto" //
  | "knife_survival_bowie" //
  | "knife_t" //
  | "knife_skeleton" //
  | "knife_tactical" //
  | "knife_ursus" //
  | "knife_widowmaker" //
  | "knife_canis"; //
