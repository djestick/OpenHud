import { PageContainer } from "./PageContainer";
export const MainPanel = () => {
  return (
    <main
      id="MainPanel"
      className="flex flex-1 flex-col overflow-hidden bg-background-secondary pb-5"
    >
      <div className="flex h-full w-full flex-1">
        <PageContainer />
      </div>
    </main>
  );
};
