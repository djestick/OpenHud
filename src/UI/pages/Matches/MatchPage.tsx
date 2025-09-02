import { useState } from "react";
import { MatchCard } from "./MatchCard";
import { MatchesTable } from "./MatchesTable";
import { MatchForm } from "./MatchForm";
import { Topbar } from "../MainPanel/Topbar";
import { useMatches } from "./useMatches";

export const MatchTypes = ["bo1", "bo2", "bo3", "bo5"];
export const maps = [
  "de_mirage",
  "de_cache",
  "de_inferno",
  "de_dust2",
  "de_train",
  "de_overpass",
  "de_nuke",
  "de_vertigo",
  "de_ancient",
  "de_anubis",
];

export const MatchesPage = () => {
  const [open, setOpen] = useState(false);
  const { setSelectedMatch, setIsEditing, currentMatch } = useMatches();

  const handleEditMatch = (match: Match) => {
    setIsEditing(true);
    setOpen(true);
    setSelectedMatch(match);
  };

  return (
    <section id="MatchPage" className="relative flex size-full flex-col gap-1">
      <Topbar header="Matches" buttonText="Match" openForm={setOpen} />
      {/* {currentMatch && <MatchCard match={currentMatch} />} */}
      <MatchForm setOpen={setOpen} open={open} />
      <MatchesTable onEdit={handleEditMatch} />
    </section>
  );
};
