import React, { createContext, useEffect, useRef, useState } from "react";
import { CSGO, CSGORaw } from "csgogsi";
import { GSI, socket } from "../api/socket";

interface GameDataContextValue {
  gameData: CSGO | null;
  rawGameData: CSGORaw | null;
  isConnected: boolean;
  hasData: boolean;
  refreshGameData: () => Promise<void>;
}

const GameDataContext = createContext<GameDataContextValue | undefined>(
  undefined,
);

export const GameDataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [gameData, setGameData] = useState<CSGO | null>(null);
  const [rawGameData, setRawGameData] = useState<CSGORaw | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(socket.connected);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const handleData = (data: CSGO) => setGameData(data);
    GSI.on("data", handleData);
    return () => {
      GSI.off("data", handleData);
    };
  }, []);

  useEffect(() => {
    const handleRaw = (data: CSGORaw) => setRawGameData(data);
    GSI.on("raw", handleRaw);
    return () => {
      GSI.off("raw", handleRaw);
    };
  }, []);

  useEffect(() => {
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  useEffect(() => {
    const handleClear = () => {
      setGameData(null);
      setRawGameData(null);
    };
    socket.on("dashboard:clear", handleClear);
    return () => {
      socket.off("dashboard:clear", handleClear);
    };
  }, []);

  const hasData = Boolean(gameData);

  const refreshGameData = () =>
    new Promise<void>((resolve) => {
      if (isRefreshingRef.current) {
        resolve();
        return;
      }

      isRefreshingRef.current = true;
      setGameData(null);
      setRawGameData(null);
      let timeoutId: ReturnType<typeof window.setTimeout> | undefined;

      const cleanup = () => {
        if (!isRefreshingRef.current) {
          return;
        }
        socket.off("update", handleUpdate);
        socket.off("dashboard:clear", handleCleared);
        if (timeoutId !== undefined) {
          window.clearTimeout(timeoutId);
          timeoutId = undefined;
        }
        isRefreshingRef.current = false;
        resolve();
      };

      const handleUpdate = () => {
        cleanup();
      };

      const handleCleared = () => {
        cleanup();
      };

      socket.on("update", handleUpdate);
      socket.on("dashboard:clear", handleCleared);
      socket.emit("refreshDashboard");
      timeoutId = window.setTimeout(cleanup, 1500);
    });

  return (
    <GameDataContext.Provider
      value={{ gameData, rawGameData, isConnected, hasData, refreshGameData }}
    >
      {children}
    </GameDataContext.Provider>
  );
};

export default GameDataContext;
