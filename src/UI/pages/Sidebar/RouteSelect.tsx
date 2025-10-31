import { NavLink } from "react-router-dom";
import matchesIcon from "../../assets/matches.svg?raw";
import playersIcon from "../../assets/players.svg?raw";
import teamsIcon from "../../assets/teams.svg?raw";
import coachIcon from "../../assets/coach.svg?raw";
import dashboardIcon from "../../assets/dashboard.svg?raw";
import hudIcon from "../../assets/hud.svg?raw";
import overlayIcon from "../../assets/overlay.svg?raw";
import { useDrawer } from "../../hooks";
import { InlineSvgIcon } from "../../components/InlineSvgIcon";

interface RouteConfig {
  icon: string;
  title: string;
  to: string;
  target?: string;
}

const baseRoutes: RouteConfig[] = [
  /* Matches redirect to home (/) */
  { icon: matchesIcon, title: "Matches", to: "" },
  { icon: playersIcon, title: "Players", to: "players" },
  { icon: teamsIcon, title: "Teams", to: "teams" },
  { icon: coachIcon, title: "Coaches", to: "coaches" },
  { icon: dashboardIcon, title: "Dashboard", to: "dashboard" },
];

export const RouteSelect = () => {
  const { isOpen } = useDrawer();

  return (
    <div className="relative size-full overflow-y-auto">
      <div className="relative flex flex-col items-center justify-between gap-2 py-5">
        {baseRoutes.map((route) => (
          <NavRoutes key={route.to} {...route} isOpen={isOpen} />
        ))}
        <div className="mt-4 flex size-full w-full border-t border-border pt-4 text-text">
          <div className="flex w-full flex-col gap-2">
            <NavRoutes
              icon={hudIcon}
              title="HUD"
              to="hud"
              isOpen={isOpen}
            />
            <NavRoutes
              icon={overlayIcon}
              title="Overlay"
              to="overlay"
              isOpen={isOpen}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface NavRoutesProps extends RouteConfig {
  isOpen: boolean;
}

const NavRoutes = ({ icon, title, target, to, isOpen }: NavRoutesProps) => {
  const linkLayoutClasses = isOpen ? "gap-3 pl-3.5" : "justify-center";

  return (
    <NavLink
      to={to}
      target={target}
      className={({ isActive }) =>
        `flex w-full items-center rounded-lg py-2 transition-colors ${linkLayoutClasses} ${isActive ? "bg-background-light text-text shadow" : "text-text-disabled hover:bg-border"}`
      }
    >
      {({ isActive }) => (
        <div className={`flex h-9 w-full items-center ${isOpen ? "gap-3" : "justify-center"}`}>
          <InlineSvgIcon
            svg={icon}
            className={`flex size-7 items-center justify-center rounded p-1 ${isActive ? "text-primary-light" : "text-text-disabled"}`}
          />
          {isOpen && (
            <p className={`font-semibold ${isActive ? "" : "text-text-disabled"}`}>
              {title}
            </p>
          )}
        </div>
      )}
    </NavLink>
  );
};
