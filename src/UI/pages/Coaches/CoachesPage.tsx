import { useState } from "react";
import { ButtonContained } from "../../components";
import { MdRefresh } from "react-icons/md";
import { Topbar } from "../MainPanel/Topbar";
import { useCoaches } from "./useCoaches";
import { CoachesTable } from "./CoachesTable";
import { Coach } from "./coachApi";
import { CoachForm } from "./CoachesForm";

export const CoachesPage = () => {
  const [open, setOpen] = useState(false);
  const { setSelectedCoach, setIsEditing, fetchCoaches } = useCoaches();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleEditCoach = (coach: Coach) => {
    setIsEditing(true);
    setOpen(true);
    setSelectedCoach(coach);
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchCoaches().finally(() => {
      setIsRefreshing(false);
    });
  };

  return (
    <section id="CoachPage" className="relative flex size-full flex-col gap-1">
      <Topbar
        header="Coaches"
        buttonText="Coach"
        openForm={setOpen}
        rightSlot={
          <ButtonContained
            type="button"
            onClick={handleRefresh}
            title="Refresh coaches data"
            aria-label="Refresh coaches data"
            disabled={isRefreshing}
            className="gap-2 bg-background-light px-3 py-1.5 text-text hover:bg-background-light/80 disabled:opacity-60 disabled:text-text"
          >
            <MdRefresh className="size-5" />
          </ButtonContained>
        }
      />
      <CoachForm setOpen={setOpen} open={open} />
      <CoachesTable onEdit={handleEditCoach} />
    </section>
  );
};
