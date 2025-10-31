import { useMemo } from "react";
import { useMatchesContext } from "./MatchesContext";
import { matchApi } from "./matchApi";
import { useTeams } from "../Teams/useTeams";
export const useMatches = () => {
  const {
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
  } = useMatchesContext();
  const { teams } = useTeams();

  const teamNameById = useMemo(() => {
    const lookup = new Map<string, string>();
    teams.forEach((team) => {
      lookup.set(team._id, team.name);
    });
    return lookup;
  }, [teams]);

    const searchMatches = (searchValue: string) => {
    const filtered = matches.filter((match) => {
      const leftId = match.left?.id ?? "";
      const rightId = match.right?.id ?? "";
      const leftName = teamNameById.get(leftId) ?? leftId;
      const rightName = teamNameById.get(rightId) ?? rightId;
      const searchTarget = `${leftName} ${rightName} ${match.id ?? ""}`.toLowerCase();
      return searchTarget.includes(searchValue.toLowerCase());
    });
    if (searchValue === "") {
      setFilteredMatches(matches);
    } else {
      setFilteredMatches(filtered);
    }
  };


  const createMatch = async (match: Match) => {
    // Handle create or update match logic
    setIsLoading(true);
    await matchApi.create(match);
    fetchMatches();
    setIsLoading(false);
  };

  const updateMatch = async (match_id: string, match: Match) => {
    // Handle update match logic
    setIsLoading(true);
    await matchApi.update(match_id, match);
    fetchMatches();
    setSelectedMatch(null);
    setIsLoading(false);
  };

  const deleteMatch = async (id: string) => {
    // Handle delete match logic
    setIsLoading(true);
    await await matchApi.remove(id);
    fetchMatches();
    setIsLoading(false);
  };

  return {
    matches,
    selectedMatch,
    currentMatch,
    filteredMatches,
    isLoading,
    isEditing,
    setSelectedMatch,
    setFilteredMatches,
    setCurrentMatch,
    setIsEditing,
    fetchMatches,
    handleStartMatch,
    handleStopMatch,
    createMatch,
    updateMatch,
    deleteMatch,
    searchMatches,
  };
};
