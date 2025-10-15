import { useCallback, useEffect, useMemo, useState } from "react";
import { MdFolderOpen, MdRefresh } from "react-icons/md";
import api, { HudDescriptor } from "../../api/api";
import { ButtonContained, Dialog } from "../../components";
import { socket } from "../../api/socket";

export const HudPage = () => {
  const [huds, setHuds] = useState<HudDescriptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmHud, setConfirmHud] = useState<HudDescriptor | null>(null);
  const [saving, setSaving] = useState(false);

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

  const activeHud = useMemo(
    () => huds.find((hud) => hud.isActive) ?? null,
    [huds],
  );

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

  return (
    <section className="relative flex h-full w-full flex-col gap-6 py-6">
      <div className="flex w-full items-center justify-between gap-4">
        <h2 className="text-3xl font-semibold">HUD</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background-light text-text hover:bg-background-light/70 disabled:opacity-50"
            onClick={handleRefreshClick}
            title="Refresh list"
            aria-label="Refresh HUD list"
            disabled={loading}
          >
            <MdRefresh className="size-5" />
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

      <div className="flex w-full flex-1 flex-col overflow-hidden rounded-lg border border-border bg-background-secondary/40">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-text-secondary">
            Loading HUDs...
          </div>
        ) : huds.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-text-secondary">
            No HUDs found. Place them under resources/src/assets beside the executable.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full table-fixed">
              <thead className="sticky top-0 bg-background-primary">
                <tr>
                  <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                    Active
                  </th>
                  <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                    Preview
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                    Name
                  </th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                    Version
                  </th>
                  <th className="w-32 px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                    Author
                  </th>
                  <th className="w-36 px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                    Folder
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background-secondary">
                {huds.map((hud) => (
                  <HudRow
                    key={hud.id}
                    hud={hud}
                    onSelect={requestHudChange}
                    isActive={hud.id === activeHud?.id}
                  />
                ))}
              </tbody>
            </table>
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

interface HudRowProps {
  hud: HudDescriptor;
  onSelect: (hud: HudDescriptor) => void;
  isActive: boolean;
}

const HudRow = ({ hud, onSelect, isActive }: HudRowProps) => {
  return (
    <tr
      className={`transition hover:bg-background-light/30 ${isActive ? "bg-background-light/20" : ""}`}
    >
      <td className="px-4 py-3">
        <input
          type="radio"
          className="size-4 accent-primary"
          name="hud-selection"
          checked={isActive}
          onChange={() => onSelect(hud)}
        />
      </td>
      <td className="px-4 py-3">
        {hud.thumbnailDataUri ? (
          <img
            src={hud.thumbnailDataUri}
            alt={hud.name}
            className="h-16 w-24 rounded object-cover"
          />
        ) : (
          <div className="flex h-16 w-24 items-center justify-center rounded border border-dashed border-border text-xs text-text-secondary">
            No preview
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="font-semibold">{hud.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">
        {hud.version ?? "-"}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">
        {hud.author ?? "-"}
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary">{hud.folder}</td>
    </tr>
  );
};
