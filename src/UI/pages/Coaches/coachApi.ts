import { apiUrl as API_BASE_URL } from "../../api/api";

export interface Coach {
  steamid: string;
  name: string;
  team: string;
}


export const coachApi = {
  getAll: async (): Promise<Coach[]> => {
    const response = await fetch(`${API_BASE_URL}/coach`);
    if (!response.ok) throw new Error("Failed to fetch coach");
    return response.json();
  },

  getById: async (id: string): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/coach/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch coach with id: ${id}`);
    return response.json();
  },

  create: async (coach: Coach): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/coach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(coach),
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

  update: async (steamid: string, coach: Coach): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/coach/${steamid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(coach),
    });
    if (!response.ok) throw new Error("Failed to update coach");
  },

};
