import { apiUrl as API_BASE_URL } from "../../api/api";

export const playerApi = {
  getAll: async (): Promise<Player[]> => {
    const response = await fetch(`${API_BASE_URL}/players`);
    if (!response.ok) throw new Error("Failed to fetch players");
    return response.json();
  },

  getById: async (id: string): Promise<Player> => {
    const response = await fetch(`${API_BASE_URL}/players/id/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch player with id: ${id}`);
    return response.json();
  },

  getBySteamId: async (steamid: string): Promise<Player> => {
    const response = await fetch(`${API_BASE_URL}/players/${steamid}`);
    if (!response.ok)
      throw new Error(`Failed to fetch player with steamid: ${steamid}`);
    return response.json();
  },

  create: async (playerData: FormData): Promise<Player> => {
    const response = await fetch(`${API_BASE_URL}/players`, {
      method: "POST",
      body: playerData, // FormData will set the correct 'multipart/form-data' header
    });
    if (!response.ok) throw new Error("Failed to create player");
    return response.json();
  },

  update: async (id: string, playerData: FormData): Promise<string> => {
    console.log(playerData.values);
    const response = await fetch(`${API_BASE_URL}/players/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(playerData),
    });
    if (!response.ok) throw new Error("Failed to update player");
    return response.json();
  },

  remove: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/players/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to remove player");
  },

  getAvatar: async (id: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/players/avatar/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch avatar");
    }
    return await response.blob();
  },
};
