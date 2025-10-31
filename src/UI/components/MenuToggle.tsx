import { useDrawer } from "../hooks";
import menuIcon from "../assets/menu.svg?raw";
import { InlineSvgIcon } from "./InlineSvgIcon";

export const MenuToggle = () => {
  const { toggleDrawer } = useDrawer();
  return (
    <div className="flex w-full items-center pl-2.5">
      <button
        className="noDrag flex items-center rounded-lg p-1 text-text-disabled hover:bg-border"
        onClick={toggleDrawer}
      >
        <InlineSvgIcon svg={menuIcon} className="noDrag size-7 p-1" />
      </button>
    </div>
  );
};
