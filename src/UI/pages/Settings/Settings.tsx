import { ButtonContained } from "../../components";

export const Settings = () => {

  return (
    <div className="flex flex-col gap-6 overflow-y-auto">
      <h2 className="border-b border-border pb-2 font-bold">Settings</h2>
      <div className="container flex flex-col gap-6 overflow-y-auto">
        <div className="rounded-lg bg-background-secondary p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">HUDs Directory</h2>
          <ButtonContained onClick={() => window.electron.openHudsDirectory()}>
            Open Directory
          </ButtonContained>
        </div>
      </div>
    </div>
  );
};

export default Settings;
