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
    selectImportSource: () => Promise<ImportPreviewResult>;
    importData: (payload: ImportDataPayload) => Promise<ImportDataResult>;
    exportData: (selection: DataExportSelection) => Promise<ExportDataResult>;
    openExportsDirectory: () => void;
    playWebmOverlay: (config: WebmOverlayConfig) => void;
    stopWebmOverlay: () => void;
    getWindowBounds: () => Promise<WindowBounds>;
    setWindowBounds: (bounds: Partial<WindowBounds>) => void;
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
  "overlay:webm:show": WebmOverlayConfig;
  "overlay:webm:hide": void;
  sendFrameAction: FrameWindowAction;
  openExternalLink: string;
  getPlayers: Promise<Player[]>;
  updateMessage: string;
  openHudsDirectory: void;
  openHudAssetsDirectory: void;
  "exports:open": void;
  "app:setZoom": number;
  "legacy:import": LegacyImportResult;
  "gsi:fix": GSIResult;
  "data:selectImportSource": ImportPreviewResult;
  "data:import": ImportDataResult;
  "data:export": ExportDataResult;
  "window:getBounds": WindowBounds;
  "window:setBounds": Partial<WindowBounds>;
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

type DataSelection = {
  includeAll: boolean;
  ids: string[];
};

type DataTransferCounts = Record<
  "teams" | "players" | "coaches" | "matches",
  number
>;

type DataExportSelection = {
  players: DataSelection;
  teams: DataSelection;
  coaches: DataSelection;
  matches: DataSelection;
};

type ImportDataResult = {
  success: boolean;
  message: string;
  counts?: DataTransferCounts;
  cancelled?: boolean;
  autoIncludedTeams?: string[];
};

type ExportDataResult = {
  success: boolean;
  message: string;
  counts?: DataTransferCounts;
  filePath?: string;
  autoIncludedTeams?: string[];
  cancelled?: boolean;
};

type WindowBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type DatabaseTeamRow = {
  _id: string;
  name?: string;
  shortName?: string | null;
  country?: string | null;
  logo?: string | null;
  [key: string]: unknown;
};

type DatabasePlayerRow = {
  _id: string;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  team?: string | null;
  steamid?: string;
  avatar?: string | null;
  [key: string]: unknown;
};

type DatabaseCoachRow = {
  steamid: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  avatar?: string | null;
  country?: string | null;
  team?: string | null;
  [key: string]: unknown;
};

type DatabaseMatchRow = {
  id: string;
  left_id?: string | null;
  right_id?: string | null;
  matchType?: string | null;
  current?: number | boolean;
  [key: string]: unknown;
};

type DatabaseSnapshot = {
  teams: DatabaseTeamRow[];
  players: DatabasePlayerRow[];
  coaches: DatabaseCoachRow[];
  matches: DatabaseMatchRow[];
};

type ImportPreviewResult = {
  cancelled: boolean;
  filePath?: string;
  snapshot?: DatabaseSnapshot;
  error?: string;
};

type ImportDataPayload = {
  sourcePath: string;
  selection: DataExportSelection;
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
  matchType: "bo1" | "bo2" | "bo3" | "bo5";
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

type WebmOverlayConfig = {
  url: string;
  loop?: boolean;
  muted?: boolean;
  fullscreen?: boolean;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

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
