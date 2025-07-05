import { usePlayersContext } from "../../context";
import { playerApi } from "./playersApi";
export const usePlayers = () => {
  const {
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
  } = usePlayersContext();

  const searchPlayers = (searchValue: string) => {
    const filtered = players.filter((player) =>
      player.username.toLowerCase().includes(searchValue.toLowerCase()),
    );
    if (searchValue === "") {
      setFilteredPlayers(players);
    } else {
      setFilteredPlayers(filtered);
    }
  };

  const createPlayer = async (player: FormData) => {
    // Handle create or update player logic
    setIsLoading(true);
    await playerApi.create(player);
    fetchPlayers();
    setIsLoading(false);
  };

  const updatePlayer = async (player_id: string, player: FormData) => {
    // Handle update player logic
    setIsLoading(true);
    await playerApi.update(player_id, player);
    fetchPlayers();
    setSelectedPlayer(null);
    setIsLoading(false);
  };

  const deletePlayer = async (id: string) => {
    // Handle delete player logic
    setIsLoading(true);
    await await playerApi.remove(id);
    fetchPlayers();
    setIsLoading(false);
  };

  return {
    players,
    selectedPlayer,
    filteredPlayers,
    isLoading,
    isEditing,
    setSelectedPlayer,
    setFilteredPlayers,
    setIsEditing,
    fetchPlayers,
    createPlayer,
    updatePlayer,
    deletePlayer,
    searchPlayers,
  };
};
