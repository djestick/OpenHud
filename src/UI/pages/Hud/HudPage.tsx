import { useCallback, useEffect, useRef, useState } from "react";
import { MdFolderOpen, MdRefresh, MdLink } from "react-icons/md";
import api, { HudDescriptor } from "../../api/api";
import { ButtonContained, Dialog } from "../../components";
import { socket } from "../../api/socket";

export const HudPage = () => {
  const [huds, setHuds] = useState<HudDescriptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmHud, setConfirmHud] = useState<HudDescriptor | null>(null);
  const [saving, setSaving] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadHuds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const available = await api.hud.list();
      setHuds(available ?? []);
    } catch (err) {
      console.error(err);
      setError("Failed to load the HUD list. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHuds();
  }, [loadHuds]);

  const handleOpenFolder = () => {
    try {
      window.electron.openHudAssetsDirectory();
    } catch (err) {
      console.error(err);
      setError("Failed to open the assets folder.");
    }
  };

  const requestHudChange = (hud: HudDescriptor) => {
    if (hud.isActive) return;
    setConfirmHud(hud);
  };

  const applyHudChange = async () => {
    if (!confirmHud) return;
    setSaving(true);
    setError(null);
    try {
      await api.hud.select(confirmHud.id);
      await loadHuds();
      socket.emit("refreshHUD");
      setConfirmHud(null);
    } catch (err) {
      console.error(err);
      setError("Failed to apply the selected HUD.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefreshClick = () => {
    void loadHuds();
  };

  const handleCopyUrl = async () => {
    const url = "http://localhost:1349/api/hud";
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      setCopyFeedback(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopyFeedback(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy HUD URL", err);
      setError("Failed to copy the HUD URL to clipboard.");
    }
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <section className="relative flex h-full w-full flex-col gap-6 py-6">
      <div className="flex w-full items-center justify-between gap-4">
        <h2 className="text-3xl font-semibold">HUD</h2>
        <div className="flex items-center gap-2">
          {copyFeedback && (
            <span className="text-xs font-semibold uppercase text-green-400">
              Copied to clipboard
            </span>
          )}
          <button
            type="button"
            className="hover:bg-background-light/70 flex h-10 w-10 items-center justify-center rounded-full bg-background-light text-text disabled:opacity-50"
            onClick={handleRefreshClick}
            title="Refresh list"
            aria-label="Refresh HUD list"
            disabled={loading}
          >
            <MdRefresh className="size-5" />
          </button>
          <button
            type="button"
            className="hover:bg-background-light/70 flex h-10 items-center gap-2 rounded-full bg-background-light px-4 text-sm font-semibold uppercase text-text transition disabled:opacity-50"
            onClick={handleCopyUrl}
            title="Copu URL for OBS"
            aria-label="Copy URL for OBS"
          >
            <MdLink className="size-5" />
            Copy URL
          </button>
          <ButtonContained
            className="gap-2 rounded-full px-4 py-2 uppercase"
            onClick={handleOpenFolder}
          >
            <MdFolderOpen className="size-5" />
            Open folder
          </ButtonContained>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="bg-background-secondary/40 flex w-full flex-1 flex-col overflow-hidden rounded-lg">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-text-secondary">
            Loading HUDs...
          </div>
        ) : huds.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-text-secondary">
            No HUDs found. Place them under resources/src/assets beside the
            executable.
          </div>
        ) : (
          <div className="w-full overflow-auto p-6">
            <div
              className="mx-auto"
              style={{
                display: "grid",
                // auto-fit columns with a clamped column size: columns grow up to 320px
                // and shrink no smaller than 240px so the grid will drop from 3 → 2 → 1
                // as the container narrows (responsive behavior without horizontal scroll).
                // cap the container so it never displays more than 3 columns wide
                // (3 * 320px + 2 * 24px gap = 1008px).
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 320px))",
                gap: "24px",
                justifyContent: "center",
                width: "100%",
                maxWidth: "1008px",
              }}
            >
              {huds.map((hud) => {
                // prefer preview data URI from server, then thumbnail, otherwise try preview.png inside hud.path
                const previewSrcRaw =
                  hud.previewDataUri ??
                  hud.thumbnailDataUri ??
                  (hud.path
                    ? `${hud.path.replace(/\\/g, "/")}/preview.png`
                    : null);
                // If it's not a data/http/file URL, prefix with file:// so electron can load local files
                const previewSrc = previewSrcRaw
                  ? /^(data:|https?:|file:)/.test(previewSrcRaw)
                    ? previewSrcRaw
                    : `file://${encodeURI(previewSrcRaw)}`
                  : null;
                return (
                  <div
                    key={hud.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => requestHudChange(hud)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        requestHudChange(hud);
                    }}
                    className={`relative flex h-[260px] w-full max-w-[320px] cursor-pointer flex-col overflow-hidden rounded-lg border bg-background-secondary shadow-sm transition-none focus:outline-none ${
                      hud.isActive
                        ? "ring-primary/30 border-primary ring-2"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <div
                      className="relative w-full bg-background-secondary"
                      style={{ height: 180 }}
                    >
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt={hud.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-text-secondary">
                          No preview
                        </div>
                      )}

                      {/* Active badge on top-right of preview */}
                      {hud.isActive && (
                        <span className="absolute right-3 top-3 z-20 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                          Active
                        </span>
                      )}

                      {/* Avatar overlapping preview and card body - half on preview, half on body */}
                      <div
                        className="absolute left-4 z-10 flex items-center justify-center overflow-hidden rounded-lg border-4 border-background-secondary bg-background-primary"
                        style={{
                          width: 72,
                          height: 72,
                          bottom: -36,
                        }}
                      >
                        {hud.thumbnailDataUri ? (
                          <img
                            src={hud.thumbnailDataUri}
                            alt={`${hud.name} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-text-secondary">
                            HUD
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between pb-3 pl-2 pr-4 pt-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 pl-28 mt-1">
                            <span className="text-lg font-semibold">
                              {hud.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom info: stick to bottom, centered vertically, folder truncates with ellipsis */}
                      <div className="mt-2 flex w-full items-center text-sm text-text-secondary">
                        <span className="flex-shrink-0">
                          Version: {hud.version ?? "-"}
                        </span>
                        <span className="mx-2 flex-shrink-0">·</span>
                        <span className="flex-1 truncate">
                          Folder: {hud.folder}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <Dialog
        open={Boolean(confirmHud)}
        onClose={() => {
          if (!saving) {
            setConfirmHud(null);
          }
        }}
      >
        <div className="flex w-full max-w-sm flex-col gap-4">
          <h3 className="text-xl font-semibold">Switch HUD?</h3>
          <p className="text-sm text-text-secondary">
            Change the active HUD to{" "}
            <span className="font-semibold text-text">{confirmHud?.name}</span>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              className="rounded-lg bg-background-light px-4 py-2 text-sm font-semibold text-text-secondary hover:text-text"
              onClick={() => setConfirmHud(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              onClick={applyHudChange}
              disabled={saving}
            >
              {saving ? "Saving..." : "Change"}
            </button>
          </div>
        </div>
      </Dialog>
    </section>
  );
};
