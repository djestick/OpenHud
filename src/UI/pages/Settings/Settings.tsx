import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import { useThemes } from "../../hooks/useThemes";
import { useAppSettings } from "../../hooks/useAppSettings";

const SCALE_STEP = 5;
const MIN_SCALE = 75;
const MAX_SCALE = 150;

const clampScale = (value: number) =>
  Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));

const LinkButton = ({
  href,
  label,
}: {
  href: string;
  label: string;
}) => {
  const handleClick = () => {
    if (window.electron?.openExternalLink) {
      window.electron.openExternalLink(href);
    } else {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="font-semibold text-primary-light hover:underline"
    >
      {label}
    </button>
  );
};

const Switch = ({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onToggle}
    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${checked ? "bg-primary-light" : "bg-border"}`}
  >
    <span
      className={`inline-block size-5 transform rounded-full bg-background-primary shadow transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`}
    />
  </button>
);

export const Settings = () => {
  const { theme, setTheme } = useThemes();
  const { appScale, setAppScale } = useAppSettings();
  const [scaleDraft, setScaleDraft] = useState(String(appScale));

  useEffect(() => {
    setScaleDraft(String(appScale));
  }, [appScale]);

  const isLightTheme = theme === "light";

  const handleThemeToggle = () => {
    setTheme(isLightTheme ? "dark" : "light");
  };

  const applyScale = (nextValue: number) => {
    const clamped = clampScale(nextValue);
    setAppScale(clamped);
    setScaleDraft(String(clamped));
  };

  const resolveDraftValue = () => {
    const numeric = Number.parseInt(scaleDraft, 10);
    return Number.isFinite(numeric) ? numeric : appScale;
  };

  const handleDecreaseScale = () => {
    applyScale(resolveDraftValue() - SCALE_STEP);
  };

  const handleIncreaseScale = () => {
    applyScale(resolveDraftValue() + SCALE_STEP);
  };

  const handleScaleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/[^\d]/g, "");
    setScaleDraft(raw);
  };

  const commitScaleInput = () => {
    const numeric = Number.parseInt(scaleDraft, 10);
    if (Number.isFinite(numeric)) {
      applyScale(numeric);
    } else {
      setScaleDraft(String(appScale));
    }
  };

  return (
    <section className="relative flex h-full w-full flex-col gap-6 py-6">
      <div className="flex w-full items-center justify-between gap-4">
        <h2 className="text-3xl font-semibold">Settings</h2>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 rounded-lg border border-border bg-background-secondary/40 p-6">
          <span className="text-xs uppercase tracking-wide text-text-secondary">
            Appearance
          </span>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
                Theme
              </span>
              <span className="text-lg font-semibold text-text">Light mode</span>
            </div>
            <Switch
              checked={isLightTheme}
              onToggle={handleThemeToggle}
              label="Toggle light theme"
            />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Interface scale (75%-150%)
            </span>
            <div className="flex w-full max-w-md items-center gap-3">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background-light text-xl text-text transition hover:bg-background-light/70"
                onClick={handleDecreaseScale}
                title="Decrease interface scale"
              >
                -
              </button>
              <div className="flex h-10 items-center gap-2 overflow-hidden rounded-md border border-border bg-background-light px-3">
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-16 border-0 bg-transparent text-center text-lg font-semibold text-text outline-none focus:border-0 focus:outline-none focus:ring-0"
                  value={scaleDraft}
                  onChange={handleScaleInputChange}
                  onBlur={commitScaleInput}
                  onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                    if (event.key === "Enter") {
                      commitScaleInput();
                    }
                  }}
                  aria-label="Interface scale percentage"
                />
                <span className="text-lg font-semibold text-text-secondary">
                  %
                </span>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background-light text-xl text-text transition hover:bg-background-light/70"
                onClick={handleIncreaseScale}
                title="Increase interface scale"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-background-secondary/40 p-6">
          <span className="text-xs uppercase tracking-wide text-text-secondary">
            Information
          </span>
          <p className="text-sm leading-relaxed text-text-secondary">
            Original developer{" "}
            <LinkButton
              href="https://github.com/JohnTimmermann"
              label="JohnTimmermann"
            />{" "}
            | Mod created by{" "}
            <LinkButton href="https://github.com/djestick" label="djestick" />{" "}
            with love 💖
          </p>
        </div>
      </div>
    </section>
  );
};

export default Settings;
