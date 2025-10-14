import { useEffect, useMemo, useState } from "react";
import api, { HudDescriptor } from "../../api/api";
import { Dialog, PrimaryButton } from "../../components";
import { socket } from "../../api/socket";

interface HudSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onSelected?: (hud: HudDescriptor) => void;
}

export const HudSelectorDialog = ({
  open,
  onClose,
  onSelected,
}: HudSelectorDialogProps) => {
  const [huds, setHuds] = useState<HudDescriptor[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeId = useMemo(
    () => huds.find((hud) => hud.isActive)?.id ?? null,
    [huds],
  );

  const loadHuds = async () => {
    setLoading(true);
    setError(null);
    try {
      const available = await api.hud.list();
      if (Array.isArray(available)) {
        setHuds(available);
        const active = available.find((hud) => hud.isActive);
        setSelectedId(active ? active.id : null);
      } else {
        setError("Failed to load HUD list.");
      }
    } catch (err) {
      console.error(err);
      setError("Error while loading the HUD list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      return;
    }
    void loadHuds();
  }, [open]);

  const handleClose = () => {
    if (saving) return;
    setError(null);
    onClose();
  };

  const handleApply = async () => {
    if (!selectedId || selectedId === activeId) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await api.hud.select(selectedId);
      if (response && typeof response === "object" && "id" in response) {
        const updated = response as HudDescriptor;
        setHuds((prev) =>
          prev.map((hud) => ({
            ...hud,
            isActive: hud.id === updated.id,
          })),
        );
        setSelectedId(updated.id);
        socket.emit("refreshHUD");
        onSelected?.(updated);
      } else {
        setError("Unexpected response while selecting the HUD.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save the selected HUD.");
    } finally {
      setSaving(false);
    }
  };

  const applyDisabled = !selectedId || selectedId === activeId || saving;

  return (
    <Dialog open={open} onClose={handleClose}>
      <div className="flex w-[640px] max-w-screen-md flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold">HUD Selection</h2>
          <p className="text-sm text-text-secondary">
            Choose a single HUD that the overlay should use.
          </p>
        </header>
        {error && (
          <div className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex min-h-[10rem] items-center justify-center text-text-secondary">
            Loading...
          </div>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto rounded border border-border">
            <table className="w-full table-fixed">
              <thead className="bg-background-secondary">
                <tr>
                  <th className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                    Preview
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                    Name
                  </th>
                  <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                    Version
                  </th>
                  <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                    Author
                  </th>
                  <th className="w-20 px-4 py-3 text-left text-xs font-semibold uppercase text-text-secondary">
                    Select
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-background-secondary/80">
                {huds.map((hud) => (
                  <tr
                    key={hud.id}
                    className={`transition hover:bg-background-light/60 ${selectedId === hud.id ? "bg-background-light/40" : ""}`}
                    onClick={() => setSelectedId(hud.id)}
                  >
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
                      <div className="flex flex-col">
                        <span className="font-semibold">{hud.name}</span>
                        <span className="text-xs text-text-secondary">
                          {hud.type === "custom" ? "Custom HUD" : `Folder: ${hud.folder}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {hud.version ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">
                      {hud.author ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="radio"
                        name="hud-selection"
                        value={hud.id}
                        checked={selectedId === hud.id}
                        onChange={() => setSelectedId(hud.id)}
                        className="size-4 accent-primary"
                      />
                    </td>
                  </tr>
                ))}
                {huds.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-sm text-text-secondary"
                    >
                      No HUDs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <footer className="flex justify-end gap-2">
          <PrimaryButton
            className="bg-background-light px-4 py-2 text-sm font-semibold text-text"
            onClick={handleClose}
            disabled={saving}
          >
            Cancel
          </PrimaryButton>
          <PrimaryButton
            className="bg-primary px-4 py-2 text-sm font-semibold text-white"
            disabled={applyDisabled}
            onClick={handleApply}
          >
            {saving ? "Saving..." : "Apply"}
          </PrimaryButton>
        </footer>
      </div>
    </Dialog>
  );
};
