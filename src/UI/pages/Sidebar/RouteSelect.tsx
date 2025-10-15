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
  MdOutlineMonitor,
} from "react-icons/md";
import { useDrawer } from "../../hooks";
import { socket } from "../../api/socket";

interface RouteConfig {
  Icon: IconType;
  title: string;
  to: string;
  target?: string;
}

const baseRoutes: RouteConfig[] = [
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

  return (
    <div className="relative size-full overflow-y-auto">
      <div className="relative flex flex-col items-center justify-between gap-2 py-5">
        {baseRoutes.map((route) => (
          <NavRoutes key={route.to} {...route} isOpen={isOpen} />
        ))}
        <div className="mt-4 flex size-full w-full border-t border-border pt-4 text-text">
          <NavRoutes
            Icon={MdOutlineMonitor}
            title="HUD"
            to="hud"
            isOpen={isOpen}
          />
        </div>
        <div className="mt-4 flex size-full w-full border-t border-border pt-4 text-text">
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
    </div>
  );
};

interface NavRoutesProps extends RouteConfig {
  isOpen: boolean;
}

const NavRoutes = ({ Icon, title, target, to, isOpen }: NavRoutesProps) => {
  return (
    <NavLink
      to={to}
      target={target}
      className={({ isActive }) =>
        `flex w-full items-center gap-4 rounded-lg py-2 pl-3.5 transition-colors ${isActive ? "bg-background-light text-text shadow" : "text-text-secondary hover:bg-background-light/60"}`
      }
    >
      {({ isActive }) => (
        <div className="flex h-9 items-center">
          <Icon
            className={`absolute size-7 ${isActive ? "text-primary-light" : "text-text-disabled"}`}
          />
          {isOpen && (
            <div className="flex flex-col pl-10">
              <p className={`font-semibold ${isActive ? "" : "text-text-disabled"}`}>
                {title}
              </p>
            </div>
          )}
        </div>
      )}
    </NavLink>
  );
};
