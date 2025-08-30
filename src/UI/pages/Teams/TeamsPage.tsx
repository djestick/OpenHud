import { useState } from "react";
import { TeamsTable } from "./TeamsTable";
import { TeamsForm } from "./TeamForm";
import { Topbar } from "../MainPanel/Topbar";

export const TeamsPage = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex size-full flex-col">
      <Topbar header="Teams" buttonText="Team" openForm={setOpen} />
      <TeamsForm open={open} setOpen={setOpen} />
      <TeamsTable setOpenState={setOpen} />
    </div>
  );
};
