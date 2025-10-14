import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { IconType } from "react-icons";
import {
  MdOutlinePerson,
  MdGroups,
  MdDashboard,
  MdAddCircle,
  MdPlayArrow,
  MdSports,
  MdRefresh,
  MdViewQuilt,
} from "react-icons/md";
import { useDrawer } from "../../hooks";
import { socket } from "../../api/socket";
import api, { HudDescriptor } from "../../api/api";
import { HudSelectorDialog } from "./HudSelectorDialog";

interface RouteProps {
  Icon: IconType;
  title: string;
  to: string;
  target?: string;
}

const routes: RouteProps[] = [
  /* Matches redirect to home (/) */
  { Icon: MdAddCircle, title: "Matches", to: "" },
  { Icon: MdOutlinePerson, title: "Players", to: "players" },
  { Icon: MdGroups, title: "Teams", to: "teams" },
  { Icon: MdSports, title: "Coaches", to: "coaches" },
  { Icon: MdDashboard, title: "Dashboard", to: "dashboard" },
];

const refreshHud = () => {
  console.log("Refreshing hud");
  socket.emit("refreshHUD");
};

export const RouteSelect = () => {
  const { isOpen } = useDrawer();
  const [isHudDialogOpen, setHudDialogOpen] = useState(false);
  const [activeHudName, setActiveHudName] = useState<string | null>(null);

  useEffect(() => {
    api.hud
      .selected()
      .then((hud) => {
        if (hud && typeof hud.name === "string") {
          setActiveHudName(hud.name);
        }
      })
      .catch(() => undefined);
  }, []);

  const handleHudSelected = (hud: HudDescriptor) => {
    setActiveHudName(hud.name);
    setHudDialogOpen(false);
    refreshHud();
  };

  return (
    <div className="relative size-full overflow-y-auto">
      <div className="relative flex flex-col items-center justify-between gap-4 py-5">
        {routes.map((route, index) => (
          <NavRoutes key={index} {...route} />
        ))}
        <div className="flex size-full w-full text-text">
          <button
            className="relative flex h-7 w-full items-center gap-1 rounded-lg bg-primary py-5 hover:bg-primary-dark"
            onClick={() => setHudDialogOpen(true)}
          >
            <MdViewQuilt className="absolute left-3.5 size-7" />
            {isOpen && (
              <div className="flex flex-col pl-14 pr-3 text-left">
                <p className="font-semibold">HUD</p>
                {activeHudName && (
                  <span className="truncate text-xs text-text-secondary">
                    {activeHudName}
                  </span>
                )}
              </div>
            )}
          </button>
        </div>
        <div className="flex size-full w-full border-t border-border pt-4 text-text">
          <button
            className="relative flex h-7 w-full items-center gap-1 rounded-lg bg-primary py-5 hover:bg-primary-dark"
            onClick={() => window.electron.startOverlay()}
          >
            <MdPlayArrow className="absolute left-3.5 size-7" />
            {isOpen && <p className="pl-14 font-semibold">Overlay</p>}
          </button>
        </div>
        <div className="flex size-full w-full text-text">
          <button
            className="relative flex h-7 w-full items-center gap-1 rounded-lg bg-primary py-5 hover:bg-primary-dark"
            onClick={refreshHud}
          >
            <MdRefresh className="absolute left-3.5 size-7" />
            {isOpen && <p className="pl-14 font-semibold">Refresh hud</p>}
          </button>
        </div>
      </div>
      <HudSelectorDialog
        open={isHudDialogOpen}
        onClose={() => setHudDialogOpen(false)}
        onSelected={handleHudSelected}
      />
    </div>
  );
};

const NavRoutes = ({ Icon, title, target, to }: RouteProps) => {
  const { isOpen } = useDrawer();
  return (
    <NavLink
      to={to}
      target={target}
      className={({ isActive }) =>
        `flex w-full items-center gap-4 rounded-lg py-2 pl-3.5 ${isActive ? "bg-background-light text-text shadow" : "text-text-secondary shadow-none hover:bg-background-light"}`
      }
    >
      {({ isActive }) => (
        <div className="flex h-7 items-center">
          <Icon
            className={`size-7 ${isActive ? "text-primary-light" : "text-text-disabled"} absolute`}
          />
          {isOpen && (
            <p
              className={`font-semibold ${isActive ? "" : "text-text-disabled"} pl-10`}
            >
              {title}
            </p>
          )}
        </div>
      )}
    </NavLink>
  );
};
