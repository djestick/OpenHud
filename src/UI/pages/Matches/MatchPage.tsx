import { useState } from "react";
import { ButtonContained } from "../../components";
import { MdRefresh } from "react-icons/md";
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
  const { setSelectedMatch, setIsEditing, fetchMatches } = useMatches();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleEditMatch = (match: Match) => {
    setIsEditing(true);
    setOpen(true);
    setSelectedMatch(match);
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchMatches().finally(() => {
      setIsRefreshing(false);
    });
  };

  return (
    <section id="MatchPage" className="relative flex size-full flex-col gap-1">
      <Topbar
        header="Matches"
        buttonText="Match"
        openForm={setOpen}
        rightSlot={
          <ButtonContained
            type="button"
            onClick={handleRefresh}
            title="Refresh matches data"
            aria-label="Refresh matches data"
            disabled={isRefreshing}
            className="gap-2 bg-background-light px-3 py-1.5 text-text hover:bg-background-light/80 disabled:opacity-60 disabled:text-text"
          >
            <MdRefresh className="size-5" />
          </ButtonContained>
        }
      />
      <MatchForm setOpen={setOpen} open={open} />
      <MatchesTable onEdit={handleEditMatch} />
    </section>
  );
};
