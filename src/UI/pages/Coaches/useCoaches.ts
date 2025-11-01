
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
    const term = searchValue.trim().toLowerCase();
    if (!term) {
      setFilteredCoaches(coaches);
      return;
    }

    const filtered = coaches.filter((coach: Coach) => {
      const haystack = [
        coach.name,
        coach.username,
        coach.firstName,
        coach.lastName,
        coach.country,
        coach.steamid,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
    setFilteredCoaches(filtered);
  };

  const createCoach = async (formData: FormData) => {
    setIsLoading(true);
    try {
      await coachApi.create(formData);
      await fetchCoaches();
    } finally {
      setIsLoading(false);
    }
  };

  const updateCoach = async (steamid: string, formData: FormData) => {
    setIsLoading(true);
    try {
      await coachApi.update(steamid, formData);
      await fetchCoaches();
      setSelectedCoach(null);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCoach = async (steamid: string) => {
    setIsLoading(true);
    try {
      await coachApi.remove(steamid);
      await fetchCoaches();
    } finally {
      setIsLoading(false);
    }
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
