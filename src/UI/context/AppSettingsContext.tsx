import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface AppSettingsContextValue {
  appScale: number;
  setAppScale: (value: number) => void;
  increaseAppScale: () => void;
  decreaseAppScale: () => void;
  resetAppScale: () => void;
}

const DEFAULT_SCALE = 100;
const MIN_SCALE = 75;
const MAX_SCALE = 150;
const SCALE_STEP = 5;
const STORAGE_KEY = "openhud:app-scale";

const clampScale = (value: number) =>
  Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(value)));

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(
  undefined,
);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [appScale, setAppScaleState] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_SCALE;
    try {
      const storedValue = window.localStorage?.getItem(STORAGE_KEY);
      if (storedValue) {
        const parsed = Number.parseInt(storedValue, 10);
        if (!Number.isNaN(parsed)) {
          return clampScale(parsed);
        }
      }
    } catch {
      /* noop - fall back to default */
    }
    return DEFAULT_SCALE;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage?.setItem(STORAGE_KEY, String(appScale));
    } catch {
      /* ignore storage write errors */
    }
    if (window.electron?.setAppZoom) {
      const zoomFactor = appScale / 100;
      window.electron.setAppZoom(zoomFactor);
    }
  }, [appScale]);

  const setAppScale = useCallback((value: number) => {
    setAppScaleState(clampScale(value));
  }, []);

  const increaseAppScale = useCallback(() => {
    setAppScaleState((current) => clampScale(current + SCALE_STEP));
  }, []);

  const decreaseAppScale = useCallback(() => {
    setAppScaleState((current) => clampScale(current - SCALE_STEP));
  }, []);

  const resetAppScale = useCallback(() => {
    setAppScaleState(DEFAULT_SCALE);
  }, []);

  const contextValue = useMemo(
    () => ({
      appScale,
      setAppScale,
      increaseAppScale,
      decreaseAppScale,
      resetAppScale,
    }),
    [appScale, decreaseAppScale, increaseAppScale, resetAppScale, setAppScale],
  );

  return (
    <AppSettingsContext.Provider value={contextValue}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettingsContext = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error(
      "useAppSettingsContext must be used within an AppSettingsProvider",
    );
  }
  return context;
};
