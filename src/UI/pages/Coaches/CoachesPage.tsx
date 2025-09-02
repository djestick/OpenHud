import { useState } from "react";
import { Topbar } from "../MainPanel/Topbar";
import { useCoaches } from "./useCoaches";
import { CoachesTable } from "./CoachesTable";
import { Coach } from "./coachApi";
import { CoachForm } from "./CoachesForm";

export const CoachesPage = () => {
  const [open, setOpen] = useState(false);
  const { setSelectedCoach, setIsEditing } = useCoaches();

  const handleEditCoach = (coach: Coach) => {
    setIsEditing(true);
    setOpen(true);
    setSelectedCoach(coach);
  };

  return (
    <section id="CoachPage" className="relative flex size-full flex-col gap-1">
      <Topbar header="Coaches" buttonText="Coach" openForm={setOpen} />
      <CoachForm setOpen={setOpen} open={open} />
      <CoachesTable onEdit={handleEditCoach} />
    </section>
  );
};
