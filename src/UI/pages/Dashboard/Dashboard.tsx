import { useState } from "react";
import { Container } from "../../components";
import { useGameData } from "../../context/useGameData";
import { getMapNameFromGameData } from "../Matches/matchUtils";
import CurrentMapRounds from "./CurrentMapRounds";
import { Tile } from "./Tile";
import { Topbar } from "../MainPanel/Topbar";
import { useMatches } from "../Matches/useMatches";

export const Dashboard = () => {
  const { gameData } = useGameData();
  const { currentMatch } = useMatches();
  const [copyStatus, setCopyStatus] = useState<boolean | null>(null);

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

  // no-op: players list built on render from gameData when needed

  return (
    <div className="relative flex size-full flex-col gap-4">
      <Topbar header="Dashboard" />
      <Container>
        {gameData ? (
          <div className="flex gap-2">
            <Tile
              title="Players Connected"
              body={
                <>
                  {gameData.players.map((player) => (
                    <div className="flex flex-col" key={player.steamid}>
                      <h6>{player.name}</h6>
                      <button
                        type="button"
                        className="place-self-center bg-background-light hover:bg-background-hover p-1 rounded-lg"
                        onClick={() => copyToClipboard(player.steamid)}
                      >
                        {player.steamid}
                      </button>
                    </div>
                  ))}
                </>
              }
            />

            <div className="flex flex-col gap-2 rounded bg-background-secondary p-4">
                <>
                  <p>Name: {gameData?.map?.name?.substring(gameData.map.name.lastIndexOf("/") + 1) ?? "-"}</p>
                  {(() => {
                    if (!gameData || !currentMatch) return null;
                    const mapName = getMapNameFromGameData(gameData);
                    if (!mapName) return null;
                    const veto = currentMatch.vetos.find((v) => v.mapName === mapName);

                    const playersMap: Record<string, string> = {};
                    gameData.players.forEach((p) => {
                      playersMap[p.steamid] = p.name;
                    });

                    return <CurrentMapRounds veto={veto} playersMap={playersMap} />;
                  })()}
                </>
            </div>
          </div>
        ) : (
          <h3>Not connected to a server</h3>
        )}
        {copyStatus && (
          <div className={`p-4 fixed top-8 right-8 z-50 ${copyStatus ? "bg-green-900 text-green-500 border-green-500" : "bg-red-900 text-red-500 border-red-500"} rounded-lg`}>
            {copyStatus ? "Copied successfully!" : "Failed to copy!"}
          </div>
        )}
      </Container>
    </div>
  );
};
