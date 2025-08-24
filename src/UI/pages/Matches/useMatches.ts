import { useMatchesContext } from "./MatchesContext";
import { matchApi } from "./matchApi";
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

    const searchMatches = (searchValue: string) => {
    const filtered = matches.filter((match) =>
      match.left.id?.toLowerCase().includes(searchValue.toLowerCase()),
    );
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
