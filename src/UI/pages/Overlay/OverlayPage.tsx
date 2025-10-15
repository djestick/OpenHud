import { ChangeEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { MdRefresh } from "react-icons/md";
import { ButtonContained } from "../../components";
import { socket } from "../../api/socket";

const SCALE_STEP = 5;
const MIN_SCALE = 25;
const MAX_SCALE = 200;

const clampScale = (value: number) =>
  Math.max(MIN_SCALE, Math.min(MAX_SCALE, value));

export const OverlayPage = () => {
  const [status, setStatus] = useState<OverlayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [scaleDraft, setScaleDraft] = useState("100");

  const isOverlayVisible = status?.isVisible ?? false;
  const displays = status?.displays ?? [];
  const displayValue = useMemo(() => {
    const id = status?.config.displayId;
    return id == null ? "primary" : String(id);
  }, [status?.config.displayId]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const loadStatus = async () => {
      try {
        const current = await window.electron.getOverlayStatus();
        setStatus(current);
        setScaleDraft(String(current.config.scale));
      } catch (error) {
        console.error("Failed to load overlay status", error);
      } finally {
        setLoading(false);
      }
      unsubscribe = window.electron.onOverlayStatus((next) => {
        setStatus(next);
        setScaleDraft(String(next.config.scale));
      });
    };

    void loadStatus();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const handleToggleOverlay = () => {
    if (loading) return;
    if (isOverlayVisible) {
      window.electron.stopOverlay();
    } else {
      window.electron.startOverlay();
    }
  };

  const handleRefreshOverlay = () => {
    if (!isOverlayVisible) return;
    socket.emit("refreshHUD");
  };

  const handleDisplayChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const displayId = value === "primary" ? null : Number(value);
    window.electron.setOverlayConfig({ displayId });
  };

  const parsedDraft = Number.parseInt(scaleDraft, 10);
  const activeScale = Number.isFinite(parsedDraft)
    ? clampScale(parsedDraft)
    : status?.config.scale ?? 100;

  const applyScale = (nextValue: number) => {
    const clamped = clampScale(nextValue);
    setScaleDraft(String(clamped));
    window.electron.setOverlayConfig({ scale: clamped });
  };

  const handleDecreaseScale = () => {
    applyScale(activeScale - SCALE_STEP);
  };

  const handleIncreaseScale = () => {
    applyScale(activeScale + SCALE_STEP);
  };

  const handleScaleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value.replace(/[^\d]/g, "");
    setScaleDraft(raw);
  };

  const commitScaleInput = () => {
    const numeric = Number.parseInt(scaleDraft, 10);
    if (Number.isFinite(numeric)) {
      applyScale(numeric);
    } else if (status) {
      setScaleDraft(String(status.config.scale));
    } else {
      setScaleDraft("100");
    }
  };

  const overlayStatusLabel = isOverlayVisible ? "Shown" : "Hidden";

  const refreshDisabled = loading || !isOverlayVisible;
  const refreshButtonClass = refreshDisabled
    ? "gap-2 rounded-full px-4 py-2 uppercase bg-background-dark text-text-disabled hover:bg-background-dark disabled:cursor-not-allowed disabled:text-text-disabled"
    : "gap-2 rounded-full px-4 py-2 uppercase";

  return (
    <section className="relative flex h-full w-full flex-col gap-6 py-6">
      <div className="flex w-full items-center justify-between gap-4">
        <h2 className="text-3xl font-semibold">Overlay Settings</h2>
        <ButtonContained
          type="button"
          onClick={handleRefreshOverlay}
          title={
            isOverlayVisible ? "Refresh overlay HUD" : "Overlay is not active"
          }
          aria-label="Refresh overlay"
          disabled={refreshDisabled}
          className={refreshButtonClass}
        >
          <MdRefresh className="size-5" />
          Refresh
        </ButtonContained>
      </div>

      <div className="flex flex-col gap-6 rounded-lg border border-border bg-background-secondary/40 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-text-secondary">
              Overlay status
            </span>
            <span
              className={`text-2xl font-semibold ${isOverlayVisible ? "text-green-400" : "text-text-disabled"}`}
            >
              {overlayStatusLabel}
            </span>
          </div>
          <ButtonContained
            disabled={loading}
            className={
              isOverlayVisible
                ? "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }
            onClick={handleToggleOverlay}
          >
            {isOverlayVisible ? "Stop overlay" : "Start overlay"}
          </ButtonContained>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Active display
          </span>
          <select
            className="min-w-[12rem] max-w-md rounded-md border border-border bg-background-light px-3 py-2 text-base text-text"
            value={displayValue}
            onChange={handleDisplayChange}
            disabled={loading}
          >
            <option value="primary">Primary display</option>
            {displays.map((display) => (
              <option key={display.id} value={display.id}>
                {display.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Overlay scale (25%-200%)
          </span>
          <div className="flex w-full max-w-md items-center gap-3">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background-light text-xl text-text transition hover:bg-background-light/70 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleDecreaseScale}
              disabled={loading}
              title="Decrease overlay scale"
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
                disabled={loading}
                aria-label="Overlay scale percentage"
              />
              <span className="text-lg font-semibold text-text-secondary">
                %
              </span>
            </div>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background-light text-xl text-text transition hover:bg-background-light/70 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleIncreaseScale}
              disabled={loading}
              title="Increase overlay scale"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
