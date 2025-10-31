import { useCallback, useEffect, useRef, useState } from "react";
import { MdClose } from "react-icons/md";
import { VscChromeMinimize, VscChromeMaximize } from "react-icons/vsc";

export const AppFrame = () => {
  const appFrameRef = useRef<HTMLDivElement | null>(null);
  const [maximized, setMaximized] = useState<boolean>(false);

  const handle_maximize = useCallback(() => {
    if (maximized || screen.availWidth - window.innerWidth === 0) {
      window.electron.sendFrameAction("RESET");
    } else {
      window.electron.sendFrameAction("MAXIMIZE");
    }
    setMaximized(!maximized);
  }, [maximized]);

  useEffect(() => {
    const appFrame = appFrameRef.current;
    if (!appFrame) return;

    const handleDoubleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!appFrame.contains(event.target)) return;
      handle_maximize();
    };

    document.addEventListener("dblclick", handleDoubleClick);
    return () => {
      document.removeEventListener("dblclick", handleDoubleClick);
    };
  }, [handle_maximize]);

  return (
    <div
      id="AppFrame"
      ref={appFrameRef}
      className="relative flex h-7 w-full items-center bg-background-secondary pl-4 text-text"
    >
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 font-semibold text-center">
        <div className="flex items-center gap-1">
          <p>Open</p>
          <p className="text-primary-light">Hud</p>
        </div>
        <span className="text-xs font-normal uppercase tracking-wide text-text-secondary">
          modded by @djestick
        </span>
      </div>
      <div className="absolute right-0 inline-flex h-full w-min justify-end">
        <button
          id="minimize"
          onClick={() => window.electron.sendFrameAction("MINIMIZE")}
          className="noDrag flex w-12 items-center justify-center transition-colors hover:bg-border hover:text-primary"
        >
          <VscChromeMinimize className="size-5" />
        </button>
        <button
          id="maximize"
          onClick={handle_maximize}
          className="noDrag flex w-12 items-center justify-center transition-colors hover:bg-border hover:text-primary"
        >
          <VscChromeMaximize className="size-5" />
        </button>
        <button
          id="quit"
          onClick={() => window.electron.sendFrameAction("CLOSE")}
          className="noDrag flex w-12 items-center justify-center transition-colors hover:bg-border hover:bg-red-400"
        >
          <MdClose className="size-5" />
        </button>
      </div>
    </div>
  );
};
