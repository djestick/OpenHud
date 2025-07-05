import React, { createContext, useContext, useState, useEffect } from "react";
import { playerApi } from "./playersApi";

interface PlayersContextProps {
  players: Player[];
  selectedPlayer: Player | null;
  filteredPlayers: Player[];
  isEditing: boolean;
  isLoading: boolean;
  setFilteredPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setSelectedPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
  fetchPlayers: () => Promise<void>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

const PlayersContext = createContext<PlayersContextProps | undefined>(
  undefined,
);

export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchPlayers = async () => {
    try {
      const players = await playerApi.getAll();
      if (players) {
        setPlayers(players);
        setFilteredPlayers(players);
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  return (
    <PlayersContext.Provider
      value={{
        players,
        selectedPlayer,
        filteredPlayers,
        isLoading,
        isEditing,
        setSelectedPlayer,
        setFilteredPlayers,
        fetchPlayers,
        setIsLoading,
        setIsEditing,
      }}
    >
      {children}
    </PlayersContext.Provider>
  );
};

export const usePlayersContext = () => {
  const context = useContext(PlayersContext);
  if (!context) {
    throw new Error("usePlayersContext must be used within a PlayersProvider");
  }
  return context;
};
