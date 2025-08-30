import { apiUrl as API_BASE_URL } from "../../api/api";

export const teamApi = {
  getAll: async (): Promise<Team[]> => {
    const response = await fetch(`${API_BASE_URL}/teams`);
    if (!response.ok) throw new Error("Failed to fetch teams");
    return response.json();
  },

  getById: async (id: string): Promise<Team> => {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch team with id: ${id}`);
    return response.json();
  },

  create: async (teamData: FormData): Promise<Team> => {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: "POST",
      body: teamData, // FormData will set the correct 'multipart/form-data' header
    });
    if (!response.ok) throw new Error("Failed to create team");
    return response.json();
  },

  update: async (id: string, teamData: FormData): Promise<string> => {
     const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      method: "PUT",
      body: teamData, // Pass FormData directly
    });
    if (!response.ok) throw new Error("Failed to update team");
    return response.json();
  },

  remove: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/teams/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to remove team");
  },

  getAvatar: async (id: string): Promise<Blob> => {
    const response = await fetch(`${API_BASE_URL}/teams/avatar/${id}`);
    if (!response.ok) {
      throw new Error("Failed to fetch avatar");
    }
    return await response.blob();
  },
};
