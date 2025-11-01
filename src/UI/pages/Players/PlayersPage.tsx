import { useState } from "react";
import { ButtonContained } from "../../components";
import { MdRefresh } from "react-icons/md";
import { usePlayers } from "./usePlayers";
import PlayerSilhouette from "../../assets/player_silhouette.webp";
import { PlayerForm } from "./PlayersForm";
import { Topbar } from "../MainPanel/Topbar";
import { PlayersTable } from "./PlayersTable";

export const PlayersPage = () => {
  const [open, setOpen] = useState(false);
  const { fetchPlayers } = usePlayers();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchPlayers().finally(() => {
      setIsRefreshing(false);
    });
  };

  return (
    <section className="relative flex size-full flex-col gap-1">
      <Topbar
        header="Players"
        buttonText="Player"
        openForm={setOpen}
        rightSlot={
          <ButtonContained
            type="button"
            onClick={handleRefresh}
            title="Refresh players data"
            aria-label="Refresh players data"
            disabled={isRefreshing}
            className="gap-2 bg-background-light px-3 py-1.5 text-text hover:bg-background-light/80 disabled:opacity-60 disabled:text-text"
          >
            <MdRefresh className="size-5" />
          </ButtonContained>
        }
      />
      <PlayersTable setOpenState={setOpen} />
      <PlayerForm open={open} setOpen={setOpen} />
    </section>
  );
};

export { PlayerSilhouette };
