import { Outlet } from "react-router-dom";

export const PageContainer = () => {
  return (
    <div
      id="PageContainer"
      className="floating-panel relative z-1000 mr-5 flex h-full w-full flex-1 flex-col overflow-hidden"
    >
      <div className="flex flex-1 flex-col overflow-y-auto px-6 py-6 md:px-10 md:py-8">
        <Outlet />
      </div>
    </div>
  );
};
