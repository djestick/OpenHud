import { useState } from "react";
import { MatchesTable } from "./MatchesTable";
import { MatchForm } from "./MatchForm";
import { Topbar } from "../MainPanel/Topbar";
import { useMatches } from "./useMatches";

export { MatchTypes, maps } from "./matchConstants";

export const MatchesPage = () => {
  const [open, setOpen] = useState(false);
  const { setSelectedMatch, setIsEditing } = useMatches();

  const handleEditMatch = (match: Match) => {
    setIsEditing(true);
    setOpen(true);
    setSelectedMatch(match);
  };

  return (
    <section id="MatchPage" className="relative flex size-full flex-col gap-1">
      <Topbar header="Matches" buttonText="Match" openForm={setOpen} />
      <MatchForm setOpen={setOpen} open={open} />
      <MatchesTable onEdit={handleEditMatch} />
    </section>
  );
};
