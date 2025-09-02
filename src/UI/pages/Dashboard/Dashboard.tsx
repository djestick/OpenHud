import { useState } from "react";
import { Container } from "../../components";
import { useGameData } from "../../context/useGameData";
import { Tile } from "./Tile";
import { Topbar } from "../MainPanel/Topbar";

export const Dashboard = () => {
  const { gameData } = useGameData();
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

  return (
    <div className="relative flex size-full flex-col gap-4">
      <Topbar header="Dashboard" />
      <Container>
        {gameData ? (
          <div className="grid grid-flow-row auto-rows-max">
            <Tile
              title="Players Connected"
              body={
                <>
                  {gameData.players.map((player) => (
                    <div className="flex flex-col" key={player.steamid}>
                      <h6>{player.name} </h6>
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
          </div>
        ) : (
          <h3>Not connected to a server</h3>
        )}
        {copyStatus && (
          <div className={`p-4 ${copyStatus ? "bg-green-900 text-green-500 border-green-500" : "bg-red-900 text-red-500 border-red-500"} rounded-lg`}>
            {copyStatus ? "Copied successfully!" : "Failed to copy!"}
          </div>
        )}
      </Container>
    </div>
  );
};
