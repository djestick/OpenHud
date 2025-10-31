import { ButtonContained, Searchbar } from "../../components";
import { useLocation } from "react-router-dom";
import { usePlayers, useTeams, useCoaches, useMatches } from "../../hooks";
import type { ReactNode } from "react";

interface TopBarProps {
  header: string;
  buttonText?: string;
  openForm?: (open: boolean) => void;
  rightSlot?: ReactNode;
}

export const Topbar = ({ header, buttonText, openForm, rightSlot }: TopBarProps) => {
  const location = useLocation();
  const { searchPlayers } = usePlayers();
  const { searchTeams } = useTeams();
  const { searchCoaches } = useCoaches();
  const { searchMatches } = useMatches();

  const pathname = location.pathname;
  const searchComponent =
    pathname === "/players" ? (
      <Searchbar dataSearch={searchPlayers} align="right" />
    ) : pathname === "/teams" ? (
      <Searchbar dataSearch={searchTeams} align="right" />
    ) : pathname === "/coaches" ? (
      <Searchbar dataSearch={searchCoaches} align="right" />
    ) : pathname === "/matches" || pathname === "/" ? (
      <Searchbar dataSearch={searchMatches} align="right" />
    ) : null;

  return (
    <div
      id="TopBar"
      className="sticky top-0 z-10 flex h-16 w-full shrink-0 items-center justify-center bg-background-primary px-2"
    >
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="noDrag capitalize">{header}</h3>
        </div>
        <div className="flex items-center justify-end gap-4">
          {searchComponent}
          {rightSlot}
          {openForm && (
            <ButtonContained onClick={() => openForm(true)}>
              Create {buttonText}
            </ButtonContained>
          )}
        </div>
      </div>
    </div>
  );
};
