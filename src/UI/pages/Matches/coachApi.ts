import { apiUrl as API_BASE_URL } from "../../api/api";

export const coachApi = {
  getAll: async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/coach`);
    if (!response.ok) throw new Error("Failed to fetch coach");
    return response.json();
  },

  getById: async (id: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/coach/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch coach with id: ${id}`);
    return response.json();
  },

  create: async (steamid: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/coach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ steamid }),
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

};
