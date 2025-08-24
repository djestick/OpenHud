import { apiUrl as API_BASE_URL } from "../../api/api";

export const matchApi = {
  getAll: async (): Promise<Match[]> => {
    const response = await fetch(`${API_BASE_URL}/match`);
    if (!response.ok) throw new Error("Failed to fetch match");
    return response.json();
  },

  getById: async (id: string): Promise<Match> => {
    const response = await fetch(`${API_BASE_URL}/match/id/${id}`);
    if (!response.ok) throw new Error(`Failed to fetch match with id: ${id}`);
    return response.json();
  },
  
  getCurrennt: async (): Promise<Match> => {
    const response = await fetch(`${API_BASE_URL}/match/current`);
    if (!response.ok) throw new Error(`Failed to fetch current match`);
    return response.json();
  },

  create: async (matchData: Match): Promise<Match> => {
    const response = await fetch(`${API_BASE_URL}/match`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(matchData),
    });

    if (!response.ok) throw new Error("Failed to create match");
    return response.json();
  },

  update: async (id: string, matchData: Match): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/match/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(matchData),
    });
    if (!response.ok) throw new Error("Failed to update match");
    return response.json();
  },

  remove: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/match/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to remove match");
  },
  setCurrent: async (id: string, current: boolean): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/match/current/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ current }),
    });
    if (!response.ok) throw new Error("Failed to set current team");
  },
};
