import React, { createContext, useContext, useState, useEffect } from "react";
import { teamApi } from "./teamsApi";

interface TeamsContextProps {
  teams: Team[];
  selectedTeam: Team | null;
  filteredTeams: Team[];
  isEditing: boolean;
  isLoading: boolean;
  setFilteredTeams: React.Dispatch<React.SetStateAction<Team[]>>;
  setSelectedTeam: React.Dispatch<React.SetStateAction<Team | null>>;
  fetchTeams: () => Promise<void>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

const TeamsContext = createContext<TeamsContextProps | undefined>(
  undefined,
);

export const TeamsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchTeams = async () => {
    try {
      const teams = await teamApi.getAll();
      if (teams) {
        setTeams(teams);
        setFilteredTeams(teams);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  return (
    <TeamsContext.Provider
      value={{
        teams,
        selectedTeam,
        filteredTeams,
        isLoading,
        isEditing,
        setSelectedTeam,
        setFilteredTeams,
        fetchTeams,
        setIsLoading,
        setIsEditing,
      }}
    >
      {children}
    </TeamsContext.Provider>
  );
};

export const useTeamsContext = () => {
  const context = useContext(TeamsContext);
  if (!context) {
    throw new Error("useTeamsContext must be used within a TeamsProvider");
  }
  return context;
};
