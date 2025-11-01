import { useState } from "react";
import { Tile } from "./Tile";
import { ButtonContained } from "../../components";
import { PlayerForm } from "../Players/PlayersForm";
import { CoachForm } from "../Coaches/CoachesForm";
import { usePlayers } from "../Players/usePlayers";
import { useCoaches } from "../Coaches/useCoaches";
import { MdContentCopy, MdEdit, MdPersonAdd, MdSports } from "react-icons/md";

type ConnectedPlayer = {
  name: string;
  steamid: string;
  team?: { side?: string };
};

interface PlayersTileProps {
  playersFromGame: ConnectedPlayer[];
  copyToClipboard: (text: string) => void;
}

export const PlayersTile = ({ playersFromGame, copyToClipboard }: PlayersTileProps) => {
  const { players, setSelectedPlayer, setIsEditing } = usePlayers();
  const { coaches, setSelectedCoach, setIsEditing: setCoachIsEditing } = useCoaches();

  const [openPlayerForm, setOpenPlayerForm] = useState(false);
  const [playerPrefill, setPlayerPrefill] = useState<{ username?: string; steamId?: string }>();
  const [openCoachForm, setOpenCoachForm] = useState(false);
  const [coachPrefill, setCoachPrefill] = useState<{ name?: string; steamid?: string; teamId?: string }>();

  const ctPlayers = playersFromGame.filter((p) => (p.team?.side || "").toUpperCase() === "CT");
  const tPlayers = playersFromGame.filter((p) => (p.team?.side || "").toUpperCase() === "T");

  const renderColumn = (label: string, list: ConnectedPlayer[]) => (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-3 flex items-center justify-between">
        <h5 className="font-semibold">{label}</h5>
        <span className="rounded-full border border-border bg-background-secondary px-2 py-0.5 text-xs text-text/80">
          {list.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {list.map((player) => {
          const hasPlayer = players.some((p) => p.steamid === player.steamid);
          const hasCoach = coaches.some((c) => c.steamid === player.steamid);
          return (
            <div
              className="flex items-center justify-between rounded-lg border border-border bg-background-secondary px-3 py-2 hover:bg-background-light"
              key={player.steamid}
            >
              <div className="min-w-0">
                <div className="truncate font-semibold">{player.name}</div>
                <button
                  type="button"
                  title="Copy SteamID"
                  className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-text/80 hover:bg-background-light"
                  onClick={() => copyToClipboard(player.steamid)}
                >
                  <MdContentCopy className="size-3.5" />
                  <span className="truncate max-w-[140px] md:max-w-[200px]">{player.steamid}</span>
                </button>
              </div>
              <div className="ml-3 flex shrink-0 items-center gap-2">
                {!hasCoach && (
                  <ButtonContained
                    className="px-3 py-1 text-xs"
                    title={hasPlayer ? "Edit Player" : "Create Player"}
                    onClick={() => {
                      const existing = players.find((p) => p.steamid === player.steamid);
                      if (existing) {
                        setSelectedPlayer(existing);
                        setIsEditing(true);
                        setPlayerPrefill(undefined);
                      } else {
                        setIsEditing(false);
                        setPlayerPrefill({ username: player.name, steamId: player.steamid });
                      }
                      setOpenPlayerForm(true);
                    }}
                  >
                    {hasPlayer ? (
                      <span className="inline-flex items-center gap-1">
                        <MdEdit className="size-4" /> Edit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <MdPersonAdd className="size-4" /> Create
                      </span>
                    )}
                  </ButtonContained>
                )}
                {!hasPlayer && (
                  <ButtonContained
                    className="px-3 py-1 text-xs"
                    title={hasCoach ? "Edit Coach" : "Add as Coach"}
                    onClick={() => {
                      const existingCoach = coaches.find((c) => c.steamid === player.steamid);
                      if (existingCoach) {
                        setSelectedCoach(existingCoach);
                        setCoachIsEditing(true);
                        setCoachPrefill(undefined);
                      } else {
                        setCoachIsEditing(false);
                        setCoachPrefill({ name: player.name, steamid: player.steamid });
                      }
                      setOpenCoachForm(true);
                    }}
                  >
                    {hasCoach ? (
                      <span className="inline-flex items-center gap-1">
                        <MdEdit className="size-4" /> Coach
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <MdSports className="size-4" /> Coach
                      </span>
                    )}
                  </ButtonContained>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <PlayerForm open={openPlayerForm} setOpen={setOpenPlayerForm} prefill={playerPrefill} />
      <CoachForm open={openCoachForm} setOpen={setOpenCoachForm} prefill={coachPrefill} />
      <Tile
        body={
          <>
            {renderColumn("CT", ctPlayers)}
            {renderColumn("T", tPlayers)}
          </>
        }
      />
    </>
  );
};
