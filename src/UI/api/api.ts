// import { MapConfig } from "../HUD/Radar/LexoRadar/maps";
export const port = 1349;
export const apiUrl = `http://localhost:${port}/api`;

export async function apiV2<T = any>(url: string, method = "GET", body?: unknown): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { Accept: "application/json", "Content-Type": "application/json" },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  let data: Response | null = null;
  // return fetch(`${apiUrl}api/${url}`, options)
  return fetch(`${apiUrl}${url}`, options).then((res) => {
    data = res;
    return res.json().catch(() => (data && data.status < 300 ? (true as unknown as T) : (false as unknown as T)));
  });
}

export interface HudDescriptor {
  id: string;
  name: string;
  type: "builtin" | "custom";
  folder: string;
  path: string;
  version?: string;
  author?: string;
  thumbnailDataUri: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
}

const api = {
  match: {
    getAll: async (): Promise<Match[]> => apiV2(`/matches`),
    getCurrent: async (): Promise<Match> => apiV2(`/current_match`),
  },
  camera: {
    get: (): Promise<{
      availablePlayers: { steamid: string; label: string }[];
      uuid: string;
    }> => apiV2("camera"),
  },
  teams: {
    getOne: async (id: string): Promise<Team> => apiV2(`/teams/${id}`),
    getAll: (): Promise<Team[]> => apiV2(`/teams`),
  },
  players: {
    getAll: async (steamids?: string[]): Promise<Player[]> =>
      apiV2(steamids ? `/players?steamids=${steamids.join(";")}` : `/players`),
    getAvatarURLs: async (
      steamid: string,
    ): Promise<{ custom: string; steam: string }> =>
      apiV2(`/players/avatar/steamid/${steamid}`),
  },
  tournaments: {
    get: () => apiV2("/tournament"),
  },
  // maps: {
  //   get: (): Promise<{ [key: string]: MapConfig }> => apiV2("radar/maps"),
  // },
  hud: {
    list: (): Promise<HudDescriptor[]> => apiV2<HudDescriptor[]>(`/hud/available`),
    select: (id: string): Promise<HudDescriptor> =>
      apiV2<HudDescriptor>(`/hud/select`, "POST", { id }),
    selected: (): Promise<HudDescriptor> => apiV2<HudDescriptor>(`/hud/selected`),
  },
};

export default api;
