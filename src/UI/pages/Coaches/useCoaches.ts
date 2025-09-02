
import { Coach, coachApi } from "./coachApi";
import { useCoachesContext } from "./CoachesContext";
export const useCoaches = () => {
  const {
    coaches,
    selectedCoach,
    filteredCoaches,
    isLoading,
    isEditing,
    setSelectedCoach,
    setFilteredCoaches,
    fetchCoaches,
    setIsLoading,
    setIsEditing,
  } = useCoachesContext();

  const searchCoaches = (searchValue: string) => {
    const filtered = coaches.filter((coach: Coach) =>
      coach.name.toLowerCase().includes(searchValue.toLowerCase()),
    );
    if (searchValue === "") {
      setFilteredCoaches(coaches);
    } else {
      setFilteredCoaches(filtered);
    }
  };

  const createCoach = async (coach: Coach) => {
    // Handle create or update coach logic
    setIsLoading(true);
    await coachApi.create({ ...coach });
    fetchCoaches();
    setIsLoading(false);
  };

  const updateCoach = async (steamid: string, coach: Coach) => {
    // Handle update coach logic
    setIsLoading(true);
    await coachApi.update(steamid, { ...coach });
    fetchCoaches();
    setSelectedCoach(null);
    setIsLoading(false);
  };

  const deleteCoach = async (steamid: string) => {
    // Handle delete coach logic
    setIsLoading(true);
    await coachApi.remove(steamid);
    fetchCoaches();
    setIsLoading(false);
  };

  return {
    coaches,
    selectedCoach,
    filteredCoaches,
    isLoading,
    isEditing,
    setSelectedCoach,
    setFilteredCoaches,
    setIsEditing,
    fetchCoaches,
    createCoach,
    updateCoach,
    deleteCoach,
    searchCoaches,
  };
};
