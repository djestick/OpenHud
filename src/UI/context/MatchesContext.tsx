import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../api/api";
import { socket } from "../api/socket";

interface MatchesContextProps {
  matches: Match[];
  currentMatch: Match | null;
  filteredMatches: Match[];
  isLoading: boolean;
  setFilteredMatches: React.Dispatch<React.SetStateAction<Match[]>>;
  setCurrentMatch: React.Dispatch<React.SetStateAction<Match | null>>;
  fetchMatches: () => Promise<void>;
  loadMatch: () => Promise<void>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const MatchesContext = createContext<MatchesContextProps | undefined>(
  undefined,
);

export const MatchesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchMatches = async () => {
    try {
      const matches = await axios.get(`${apiUrl}/matches`);
      if (matches.data) {
        setMatches(matches.data);
        setFilteredMatches(matches.data);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  const loadMatch = async () => {
    try {
      const match = await axios.get(`${apiUrl}/matches/current`);
      if (!match) {
        setCurrentMatch(null);
      } else {
        setCurrentMatch(match.data);
      }
    } catch (error) {
      setCurrentMatch(null);
      console.log("Error getting current match:\n", error);
    }
  };

  useEffect(() => {
    fetchMatches();
    loadMatch();

    socket.on("match", () => {
      loadMatch();
    });
  }, []);

  return (
    <MatchesContext.Provider
      value={{
        matches,
        currentMatch,
        filteredMatches,
        isLoading,
        setFilteredMatches,
        setCurrentMatch,
        fetchMatches,
        loadMatch,
        setIsLoading,
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
