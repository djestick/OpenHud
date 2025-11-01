import { apiUrl as API_BASE_URL } from "../../api/api";

export interface Coach {
  steamid: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  avatar?: string | null;
  country?: string | null;
  team?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export const coachApi = {
  getAll: async (): Promise<Coach[]> => {
    const response = await fetch(`${API_BASE_URL}/coach`);
    if (!response.ok) throw new Error("Failed to fetch coach");
    return response.json();
  },

  getById: async (steamid: string): Promise<Coach> => {
    const response = await fetch(`${API_BASE_URL}/coach/${steamid}`);
    if (!response.ok) throw new Error(`Failed to fetch coach with steamid: ${steamid}`);
    return response.json();
  },

  create: async (payload: FormData): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/coach`, {
      method: "POST",
      body: payload,
    });

    if (!response.ok) throw new Error("Failed to create coach");
    return response.json();
  },

  remove: async (steamid: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/coach/${steamid}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to remove coach");
  },

  update: async (steamid: string, payload: FormData): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/coach/${steamid}`, {
      method: "PUT",
      body: payload,
    });
    if (!response.ok) throw new Error("Failed to update coach");
  },

  convertToPlayer: async (steamid: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/coach/${steamid}/convert-to-player`, {
      method: "POST",
    });
    if (!response.ok) throw new Error("Failed to convert coach to player");
  },
};
