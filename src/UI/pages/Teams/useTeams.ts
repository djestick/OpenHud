import { useTeamsContext } from "../../context";
import { teamApi } from "./teamsApi";
export const useTeams = () => {
  const {
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
  } = useTeamsContext();

  const searchTeams = (searchValue: string) => {
    const filtered = teams.filter((team) =>
      team.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
    if (searchValue === "") {
      setFilteredTeams(teams);
    } else {
      setFilteredTeams(filtered);
    }
  };

  const createTeam = async (team: FormData) => {
    // Handle create or update team logic
    setIsLoading(true);
    await teamApi.create(team);
    fetchTeams();
    setIsLoading(false);
  };

  const updateTeam = async (team_id: string, team: FormData) => {
    // Handle update team logic
    setIsLoading(true);
    await teamApi.update(team_id, team);
    fetchTeams();
    setSelectedTeam(null);
    setIsLoading(false);
  };

  const deleteTeam = async (id: string) => {
    // Handle delete team logic
    setIsLoading(true);
    await await teamApi.remove(id);
    fetchTeams();
    setIsLoading(false);
  };

  return {
    teams,
    selectedTeam,
    filteredTeams,
    isLoading,
    isEditing,
    setSelectedTeam,
    setFilteredTeams,
    setIsEditing,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    searchTeams,
  };
};
