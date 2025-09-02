import React from "react";
import { PlayersProvider } from "../pages/Players/PlayersContext";
import { MatchesProvider } from "../pages/Matches/MatchesContext";
import { TeamsProvider } from "../pages/Teams/TeamsContext";
import { ThemesProvider } from "./ThemesContext";
import { DrawerProvider } from "./DrawerContext";
import { CoachesProvider } from "../pages/Coaches/CoachesContext";
import { GameDataProvider } from "./GameDataContext";

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <CoachesProvider>
      <GameDataProvider>
        <ThemesProvider>
          <MatchesProvider>
            <PlayersProvider>
              <DrawerProvider>
                <TeamsProvider>{children}</TeamsProvider>
              </DrawerProvider>
            </PlayersProvider>
          </MatchesProvider>
        </ThemesProvider>
      </GameDataProvider>
    </CoachesProvider>
  );
};
