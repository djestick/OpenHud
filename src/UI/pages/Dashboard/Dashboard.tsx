import { useState } from "react";
import { Container, ButtonContained } from "../../components";
import { useGameData } from "../../context/useGameData";
import { Topbar } from "../MainPanel/Topbar";
import { PlayersTile } from "./PlayersTile";
import { MdRefresh } from "react-icons/md";

interface StatusPillProps {
  label: string;
  active: boolean;
}

const StatusPill = ({ label, active }: StatusPillProps) => {
  const baseClasses =
    "flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-medium transition-colors";
  const activeClasses = "border-green-500 bg-green-500/10 text-green-400";
  const inactiveClasses = "border-border bg-background-secondary text-text/60";

  return (
    <div className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}>
      <span
        className={`size-3 rounded-full ${
          active ? "bg-green-400" : "bg-neutral-600/50"
        }`}
      />
      {label}
    </div>
  );
};

export const Dashboard = () => {
  const { gameData, hasData, refreshGameData } = useGameData();
  const [copyStatus, setCopyStatus] = useState<boolean | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(null), 2000);
      },
      (err) => {
        console.error("Failed to copy to clipboard:", err);
        setCopyStatus(false);
        setTimeout(() => setCopyStatus(null), 2000);
      }
    );
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    void refreshGameData().finally(() => {
      setIsRefreshing(false);
    });
  };

  // no-op: players list built on render from gameData when needed

  return (
    <div className="relative flex size-full flex-col gap-4">
      <Topbar
        header="Dashboard"
        headerSlot={<StatusPill label={hasData ? "Data ready" : "No data"} active={hasData} />}
        rightSlot={
          <ButtonContained
            type="button"
            onClick={handleRefresh}
            title="Refresh dashboard data"
            aria-label="Refresh dashboard data"
            disabled={isRefreshing}
            className="gap-2 bg-background-light px-3 py-1.5 text-text hover:bg-background-light/80 disabled:opacity-60 disabled:text-text"
          >
            <MdRefresh className="size-5" />
          </ButtonContained>
        }
      />
      <Container>
        {gameData && (
          <div className="flex gap-2">
            <PlayersTile playersFromGame={gameData.players} copyToClipboard={copyToClipboard} />
          </div>
        )}
        {copyStatus && (
          <div className={`p-4 fixed top-8 left-1/2 -translate-x-1/2 z-50 ${copyStatus ? "bg-green-900 text-green-500 border-green-500" : "bg-red-900 text-red-500 border-red-500"} rounded-lg`}>
            {copyStatus ? "Copied successfully!" : "Failed to copy!"}
          </div>
        )}
      </Container>
    </div>
  );
};
