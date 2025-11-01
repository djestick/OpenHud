import { useState } from "react";
import { ButtonContained } from "../../components";
import { MdRefresh } from "react-icons/md";
import { useTeams } from "../../hooks";
import { TeamsTable } from "./TeamsTable";
import { TeamsForm } from "./TeamForm";
import { Topbar } from "../MainPanel/Topbar";

export const TeamsPage = () => {
  const [open, setOpen] = useState(false);
  const { fetchTeams } = useTeams();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    fetchTeams().finally(() => {
      setIsRefreshing(false);
    });
  };

  return (
    <section className="relative flex size-full flex-col gap-1">
      <Topbar
        header="Teams"
        buttonText="Team"
        openForm={setOpen}
        rightSlot={
          <ButtonContained
            type="button"
            onClick={handleRefresh}
            title="Refresh teams data"
            aria-label="Refresh teams data"
            disabled={isRefreshing}
            className="gap-2 bg-background-light px-3 py-1.5 text-text hover:bg-background-light/80 disabled:opacity-60 disabled:text-text"
          >
            <MdRefresh className="size-5" />
          </ButtonContained>
        }
      />
      <TeamsForm open={open} setOpen={setOpen} />
      <TeamsTable setOpenState={setOpen} />
    </section>
  );
};
