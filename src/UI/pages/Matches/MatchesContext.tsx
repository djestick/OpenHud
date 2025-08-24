import React, { createContext, useContext, useState, useEffect } from "react";
import { matchApi } from "./matchApi";
import { socket } from "../../api/socket";

interface MatchesContextProps {
  matches: Match[];
  selectedMatch: Match | null;
  currentMatch: Match | null;
  filteredMatches: Match[];
  isEditing: boolean;
  isLoading: boolean;
  setFilteredMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  setSelectedMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  setCurrentMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  fetchMatches: () => Promise<void>;
  handleStartMatch: (id: string) => Promise<void>;
  handleStopMatch: (id: string) => Promise<void>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

const MatchesContext = createContext<MatchesContextProps | undefined>(
  undefined,
);

export const MatchesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchMatches = async () => {
    try {
      setIsLoading(true); // Set loading state to true
      const matches = await matchApi.getAll();
      if (matches) {
        setMatches(matches);
        setFilteredMatches(matches);
      } else {
        setMatches([]);
        setFilteredMatches([]);
      }
      const current = await matchApi.getCurrennt();
      if (current) {
        setCurrentMatch(current);
      } else {
        setCurrentMatch(null);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setIsLoading(false); // Set loading state to false
    }
  };

  socket.on("match", () => {
    fetchMatches();
  });

  useEffect(() => {
    fetchMatches();
  }, []);

  const handleStartMatch = async (matchId: string) => {
        try {
          matchApi.setCurrent(matchId, true);
          fetchMatches();
        } catch (error) {
          console.error("Error updating match:", error);
      };
    }
  
  
    const handleStopMatch = async (matchId: string) => {
      try {
        matchApi.setCurrent(matchId, false);
        fetchMatches();
      } catch (error) {
        console.error("Error updating match:", error);
      }
    };

  return (
    <MatchesContext.Provider
      value={{
        matches,
        selectedMatch,
        currentMatch,
        filteredMatches,
        isLoading,
        isEditing,
        setSelectedMatch,
        setFilteredMatches,
        setCurrentMatch,
        fetchMatches,
        handleStartMatch,
        handleStopMatch,
        setIsLoading,
        setIsEditing,
      }}
    >
      {children}
    </MatchesContext.Provider>
  );
};

export const useMatchesContext = () => {
  const context = useContext(MatchesContext);
  if (!context) {
    throw new Error("useMatchesContext must be used within a MatchesProvider");
  }
  return context;
};
