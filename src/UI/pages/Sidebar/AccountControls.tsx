import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { MdRefresh, MdSettings, MdSwapHoriz } from "react-icons/md";
import { useDrawer } from "../../hooks";
import { socket } from "../../api/socket";
import useGameData from "../../context/useGameData";
import { useMatches } from "../Matches/useMatches";
import { canReverseSides } from "../Matches/matchUtils";

export const AccountToggle = () => {
  const { isOpen } = useDrawer();
  const { gameData } = useGameData();
  const { currentMatch, updateMatch } = useMatches();
  const [overlayStatus, setOverlayStatus] = useState<OverlayStatus | null>(null);
  const [overlayLoading, setOverlayLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadStatus = async () => {
      try {
        const status = await window.electron.getOverlayStatus();
        setOverlayStatus(status);
      } catch (error) {
        console.error("Failed to load overlay status:", error);
      } finally {
        setOverlayLoading(false);
      }

      unsubscribe = window.electron.onOverlayStatus((status) => {
        setOverlayStatus(status);
      });
    };

    void loadStatus();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const overlayVisible = overlayStatus?.isVisible ?? false;
  const refreshDisabled = overlayLoading || !overlayVisible;
  const refreshTitle = overlayVisible
    ? "Refresh overlay HUD"
    : "Overlay is not active";
  const switchSidesDisabled =
    !currentMatch || !canReverseSides(currentMatch, gameData);

  const handleRefreshHud = () => {
    if (refreshDisabled) return;
    socket.emit("refreshHUD");
  };

  const handleSwitchSides = async () => {
    if (switchSidesDisabled) return;
    if (!currentMatch || !gameData || !gameData.map || !gameData.map.name) {
      return;
    }

    try {
      const mapName = gameData.map.name.substring(
        gameData.map.name.lastIndexOf("/") + 1,
      );
      const veto = currentMatch.vetos.find((v) => v.mapName === mapName);
      if (!veto) return;

      const updatedVetos = currentMatch.vetos.map((v) =>
        v.mapName === mapName ? { ...v, reverseSide: !v.reverseSide } : v,
      );

      const updatedMatch: Match = { ...currentMatch, vetos: updatedVetos };
      await updateMatch(currentMatch.id, updatedMatch);
    } catch (err) {
      console.error("Failed to switch sides:", err);
    }
  };

  return (
    <div className="relative flex flex-col gap-2 pb-5 text-text-secondary">
      <button
        className="relative flex items-center rounded-lg py-2 pl-4 hover:bg-border disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleRefreshHud}
        title={refreshTitle}
        disabled={refreshDisabled}
      >
        <MdRefresh className="size-7 shrink-0" />
        {isOpen && <p className="pl-2 font-semibold">Refresh HUD</p>}
      </button>
      <button
        className="relative flex items-center rounded-lg py-2 pl-4 hover:bg-border disabled:cursor-not-allowed disabled:opacity-60"
        onClick={handleSwitchSides}
        title="Switch sides for current map"
        disabled={switchSidesDisabled}
      >
        <MdSwapHoriz className="size-7 shrink-0" />
        {isOpen && <p className="pl-2 font-semibold">Switch sides</p>}
      </button>
      <NavLink
        to="/settings"
        title="Open settings"
        className={({ isActive }) =>
          `relative flex items-center rounded-lg py-2 pl-4 transition-colors ${
            isActive
              ? "bg-background-light text-text shadow"
              : "text-text-secondary hover:bg-border"
          }`
        }
      >
        {({ isActive }) => (
          <>
            <MdSettings
              className={`size-7 shrink-0 ${
                isActive ? "text-primary-light" : "text-text-disabled"
              }`}
            />
            {isOpen && (
              <p
                className={`pl-2 font-semibold ${
                  isActive ? "text-text" : "text-text-secondary"
                }`}
              >
                Settings
              </p>
            )}
          </>
        )}
      </NavLink>
    </div>
  );
};
