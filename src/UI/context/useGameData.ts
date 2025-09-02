import { useContext } from "react";
import GameDataContext from "./GameDataContext";

export const useGameData = () => {
  const context = useContext(GameDataContext);
  if (!context) throw new Error("useGameData must be used within GameDataProvider");
  return context;
};

export default useGameData;
