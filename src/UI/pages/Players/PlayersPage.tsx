import { useState } from "react";
import PlayerSilhouette from "../../assets/player_silhouette.webp";
import { PlayerForm } from "./PlayersForm";
import { Topbar } from "../MainPanel/Topbar";
import { usePlayers } from "../../hooks";
import { PlayersTable } from "./PlayersTable";

export const PlayersPage = () => {
  const [open, setOpen] = useState(false);
  const { setSelectedPlayer, setIsEditing } = usePlayers();

  const handleEditPlayer = (player: Player) => {
    setIsEditing(true);
    setOpen(true);
    setSelectedPlayer(player);
  };

  return (
    <section className="relative flex size-full flex-col gap-1">
      <Topbar header="Players" buttonText="Player" openForm={setOpen} />
      <PlayerForm open={open} setOpen={setOpen} />
      <PlayersTable onEdit={handleEditPlayer} />
    </section>
  );
};

export { PlayerSilhouette };
