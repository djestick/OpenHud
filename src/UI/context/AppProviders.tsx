import React from "react";
import { PlayersProvider } from "../pages/Players/PlayersContext";
import { MatchesProvider } from "../pages/Matches/MatchesContext";
import { TeamsProvider } from "../pages/Teams/TeamsContext";
import { DrawerProvider } from "./DrawerContext";
import { CoachesProvider } from "../pages/Coaches/CoachesContext";
import { GameDataProvider } from "./GameDataContext";
import { ThemesProvider } from "./ThemesContext";
import { AppSettingsProvider } from "./AppSettingsContext";

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <CoachesProvider>
      <GameDataProvider>
        <AppSettingsProvider>
          <ThemesProvider>
            <MatchesProvider>
              <PlayersProvider>
                <DrawerProvider>
                  <TeamsProvider>{children}</TeamsProvider>
                </DrawerProvider>
              </PlayersProvider>
            </MatchesProvider>
          </ThemesProvider>
        </AppSettingsProvider>
      </GameDataProvider>
    </CoachesProvider>
  );
};
