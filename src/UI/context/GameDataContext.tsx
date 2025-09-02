import React, { createContext, useEffect, useState } from "react";
import { CSGO } from "csgogsi";
import { GSI } from "../api/socket";

interface GameDataContextValue {
  gameData: CSGO | null;
}

const GameDataContext = createContext<GameDataContextValue | undefined>(
  undefined,
);

export const GameDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [gameData, setGameData] = useState<CSGO | null>(null);

  useEffect(() => {
    const handler = (data: CSGO) => setGameData(data);
    GSI.on("data", handler);
    return () => {
      GSI.off("data", handler);
    };
  }, []);

  return (
    <GameDataContext.Provider value={{ gameData }}>
      {children}
    </GameDataContext.Provider>
  );
};

export default GameDataContext;
