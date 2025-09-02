import React, { createContext, useContext, useState, useEffect } from "react";
import { Coach, coachApi } from "./coachApi";

interface CoachesContextProps {
  coaches: Coach[];
  selectedCoach: Coach | null;
  filteredCoaches: Coach[];
  isEditing: boolean;
  isLoading: boolean;
  setFilteredCoaches: React.Dispatch<React.SetStateAction<Coach[]>>;
  setSelectedCoach: React.Dispatch<React.SetStateAction<Coach | null>>;
  fetchCoaches: () => Promise<void>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

const CoachesContext = createContext<CoachesContextProps | undefined>(
  undefined,
);

export const CoachesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [filteredCoaches, setFilteredCoaches] = useState<Coach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchCoaches = async () => {
    try {
      const coaches = await coachApi.getAll();
      if (coaches) {
        setCoaches(coaches);
        setFilteredCoaches(coaches);
      }
    } catch (error) {
      console.error("Error fetching coaches:", error);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  return (
    <CoachesContext.Provider
      value={{
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
      }}
    >
      {children}
    </CoachesContext.Provider>
  );
};

export const useCoachesContext = () => {
  const context = useContext(CoachesContext);
  if (!context) {
    throw new Error("useCoachesContext must be used within a CoachesProvider");
  }
  return context;
};
