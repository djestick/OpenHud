import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { FiChevronDown, FiChevronUp, FiX } from "react-icons/fi";
import { ButtonContained } from "../../components";
import { apiUrl } from "../../api/api";
import { PlayerSilhouette } from "../Players/PlayersPage";

type CategoryKey = keyof DataExportSelection;

type CategoryItem = {
  id: string;
  label: string;
  lines: string[];
  imageUrl?: string;
  badgeImageUrl?: string;
  badgeLabel?: string;
};

type CategoryConfig = {
  key: CategoryKey;
  title: string;
  items: CategoryItem[];
};

type SelectionState = Record<CategoryKey, string[]>;

const defaultExpanded: Record<CategoryKey, boolean> = {
  players: true,
  teams: false,
  coaches: false,
  matches: false,
};

const createSelectionFromSnapshot = (snapshot: DatabaseSnapshot): SelectionState => ({
  players: snapshot.players.map((player) => player._id),
  teams: snapshot.teams.map((team) => team._id),
  coaches: snapshot.coaches.map((coach) => coach.steamid),
  matches: snapshot.matches.map((match) => String(match.id)),
});

const getInitials = (value: string) => {
  if (!value) return "?";
  const parts = value.split(" ").filter(Boolean);
  if (parts.length === 0) return value.charAt(0).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const buildPlayerAvatarUrl = (player: Player) =>
  player.avatar
    ? `${apiUrl}/players/avatar/${player._id}?v=${encodeURIComponent(player.avatar)}`
    : PlayerSilhouette;

const buildTeamLogoUrl = (teamId: string | null | undefined) =>
  teamId ? `${apiUrl}/teams/logo/${teamId}` : undefined;

const composeSelection = (
  key: CategoryKey,
  selection: SelectionState,
  items: CategoryItem[],
): DataSelection => {
  const ids = selection[key] ?? [];
  if (items.length === 0) {
    return { includeAll: true, ids: [] };
  }
  if (ids.length >= items.length) {
    return { includeAll: true, ids: [] };
  }
  return { includeAll: false, ids };
};

interface ImportDataModalProps {
  isOpen: boolean;
  snapshot: DatabaseSnapshot;
  filePath: string;
  onClose: () => void;
  onConfirm: (selection: DataExportSelection) => Promise<void>;
  externalError?: string | null;
}

export const ImportDataModal = ({
  isOpen,
  snapshot,
  filePath,
  onClose,
  onConfirm,
  externalError,
}: ImportDataModalProps) => {
  const [selectedIds, setSelectedIds] = useState<SelectionState>(
    createSelectionFromSnapshot(snapshot),
  );
  const [expanded, setExpanded] =
    useState<Record<CategoryKey, boolean>>(defaultExpanded);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(createSelectionFromSnapshot(snapshot));
    setExpanded(defaultExpanded);
    setError(null);
  }, [isOpen, snapshot]);

  useEffect(() => {
    setError(externalError ?? null);
  }, [externalError]);

  const teamById = useMemo(() => {
    return snapshot.teams.reduce((acc, team) => {
      acc.set(team._id, team);
      return acc;
    }, new Map<string, DatabaseTeamRow>());
  }, [snapshot.teams]);

  const categories = useMemo<CategoryConfig[]>(() => {
    return [
      {
        key: "players",
        title: "Players",
        items: snapshot.players.map((player) => {
          const playerTeam = player.team ? teamById.get(player.team) : undefined;
          const teamName = playerTeam?.name ?? "Unassigned team";
          const lines: string[] = [];
          const fullName = [player.firstName, player.lastName]
            .filter(Boolean)
            .join(" ");
          if (fullName) lines.push(fullName);
          lines.push(`Team: ${teamName}`);
          lines.push(`Steam ID: ${player.steamid ?? "—"}`);

          return {
            id: player._id,
            label: player.username ?? player._id,
            lines,
            imageUrl: buildPlayerAvatarUrl(player as unknown as Player),
            badgeImageUrl: playerTeam?.logo
              ? buildTeamLogoUrl(playerTeam._id)
              : undefined,
            badgeLabel: !playerTeam?.logo ? teamName : undefined,
          };
        }),
      },
      {
        key: "teams",
        title: "Teams",
        items: snapshot.teams.map((team) => {
          const lines: string[] = [];
          if (team.shortName) {
            lines.push(`Tag: ${team.shortName}`);
          }
          if (team.country) {
            lines.push(`Country: ${team.country}`);
          }
          return {
            id: team._id,
            label: team.name ?? team._id,
            lines,
            imageUrl: team.logo ? buildTeamLogoUrl(team._id) : undefined,
          };
        }),
      },
      {
        key: "coaches",
        title: "Coaches",
        items: snapshot.coaches.map((coach) => {
          const coachTeam = coach.team ? teamById.get(coach.team) : undefined;
          const teamName = coachTeam?.name ?? "Unassigned team";
          return {
            id: coach.steamid,
            label: coach.name || coach.steamid,
            lines: [`Team: ${teamName}`, `Steam ID: ${coach.steamid}`],
            imageUrl: coachTeam?.logo
              ? buildTeamLogoUrl(coachTeam._id)
              : undefined,
            badgeLabel: !coachTeam?.logo ? teamName : undefined,
          };
        }),
      },
      {
        key: "matches",
        title: "Matches",
        items: snapshot.matches.map((match) => {
          const leftTeam =
            typeof match.left_id === "string"
              ? teamById.get(match.left_id)?.name ?? match.left_id
              : "TBD";
          const rightTeam =
            typeof match.right_id === "string"
              ? teamById.get(match.right_id)?.name ?? match.right_id
              : "TBD";
          const label =
            leftTeam === "TBD" && rightTeam === "TBD"
              ? `Match ${match.id}`
              : `${leftTeam} vs ${rightTeam}`;
          return {
            id: String(match.id),
            label,
            lines: [
              `Type: ${String(match.matchType ?? "").toUpperCase() || "N/A"}`,
              `Current: ${match.current ? "Yes" : "No"}`,
            ],
          };
        }),
      },
    ];
  }, [snapshot, teamById]);

  const hasSelection = useMemo(() => {
    return categories.some(({ key, items }) => {
      if (items.length === 0) return false;
      return (selectedIds[key] ?? []).length > 0;
    });
  }, [categories, selectedIds]);

  const handleOverlayClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const toggleExpand = (key: CategoryKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleItem = (key: CategoryKey, id: string) => {
    setSelectedIds((prev) => {
      const current = new Set(prev[key] ?? []);
      if (current.has(id)) {
        current.delete(id);
      } else {
        current.add(id);
      }
      return {
        ...prev,
        [key]: Array.from(current),
      };
    });
    setError(null);
  };

  const selectAllCategory = (key: CategoryKey, items: CategoryItem[]) => {
    setSelectedIds((prev) => ({
      ...prev,
      [key]: items.map((item) => item.id),
    }));
    setError(null);
  };

  const clearCategory = (key: CategoryKey) => {
    setSelectedIds((prev) => ({
      ...prev,
      [key]: [],
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!hasSelection) {
      setError("Select at least one item to import.");
      return;
    }

    setSubmitLoading(true);
    setError(null);

    const payload: DataExportSelection = {
      players: composeSelection(
        "players",
        selectedIds,
        categories.find((category) => category.key === "players")?.items || [],
      ),
      teams: composeSelection(
        "teams",
        selectedIds,
        categories.find((category) => category.key === "teams")?.items || [],
      ),
      coaches: composeSelection(
        "coaches",
        selectedIds,
        categories.find((category) => category.key === "coaches")?.items || [],
      ),
      matches: composeSelection(
        "matches",
        selectedIds,
        categories.find((category) => category.key === "matches")?.items || [],
      ),
    };

    try {
      await onConfirm(payload);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to import data.";
      setError(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderPreview = (item: CategoryItem) => {
    if (item.imageUrl) {
      return (
        <img
          src={item.imageUrl}
          alt=""
          className="size-10 rounded-md object-cover"
          loading="lazy"
        />
      );
    }

    return (
      <div className="flex size-10 items-center justify-center rounded-md bg-background-primary/80 text-sm font-semibold uppercase text-text-secondary">
        {getInitials(item.label)}
      </div>
    );
  };

  const renderBadge = (item: CategoryItem) => {
    if (item.badgeImageUrl) {
      return (
        <img
          src={item.badgeImageUrl}
          alt=""
          className="size-8 rounded-md object-cover"
          loading="lazy"
        />
      );
    }
    if (item.badgeLabel) {
      return (
        <span className="rounded-md bg-background-primary/70 px-2 py-1 text-xs font-semibold uppercase text-text-secondary">
          {item.badgeLabel}
        </span>
      );
    }
    return null;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      onClick={handleOverlayClick}
    >
      <div
        className="relative w-full max-w-3xl rounded-lg bg-background-primary p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close import data modal"
          className="absolute right-4 top-4 text-text-secondary transition hover:text-primary"
          onClick={onClose}
        >
          <FiX className="size-5" />
        </button>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-text">Import data</h2>
          <p className="text-sm text-text-secondary">
            Source file: <span className="break-all">{filePath}</span>
          </p>
        </div>

        <div className="flex max-h-[55vh] flex-col gap-4 overflow-y-auto pr-1">
          {categories.map(({ key, title, items }) => {
            const isExpanded = expanded[key];
            const checkedCount = (selectedIds[key] ?? []).length;
            const summary = `${checkedCount}/${items.length}`;

            return (
              <div
                key={key}
                className="rounded-lg border border-border bg-background-secondary/50"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-left text-lg font-semibold text-text transition hover:text-primary"
                    onClick={() => toggleExpand(key)}
                  >
                    {isExpanded ? (
                      <FiChevronUp className="size-5" />
                    ) : (
                      <FiChevronDown className="size-5" />
                    )}
                    {title}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-text-secondary">
                      Selected {summary}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase text-primary transition hover:text-primary-light"
                        onClick={() => selectAllCategory(key, items)}
                        disabled={items.length === 0}
                      >
                        Select all
                      </button>
                      <span className="text-text-secondary">·</span>
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase text-primary transition hover:text-primary-light"
                        onClick={() => clearCategory(key)}
                        disabled={items.length === 0}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="flex flex-col gap-2 border-t border-border px-4 py-3">
                    {items.length === 0 ? (
                      <span className="text-sm text-text-secondary">
                        Nothing to show in this category.
                      </span>
                    ) : (
                      items.map((item) => {
                        const checked = (selectedIds[key] ?? []).includes(
                          item.id,
                        );
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center gap-3 rounded-md px-3 py-2 transition ${
                              checked
                                ? "bg-background-primary/80"
                                : "bg-background-primary/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="size-4 accent-primary"
                              checked={checked}
                              onChange={() => toggleItem(key, item.id)}
                            />
                            {renderPreview(item)}
                            <div className="flex flex-1 flex-col text-sm">
                              <span className="font-semibold text-text">
                                {item.label}
                              </span>
                              {item.lines.map((line, index) => (
                                <span
                                  key={`${item.id}-detail-${index}`}
                                  className="text-xs text-text-secondary"
                                >
                                  {line}
                                </span>
                              ))}
                            </div>
                            {renderBadge(item)}
                          </label>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-4 rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-full border border-border px-5 py-1.5 text-sm font-semibold uppercase text-text-secondary transition hover:bg-background-light/60"
            onClick={() => {
              setSelectedIds(createSelectionFromSnapshot(snapshot));
              setError(null);
            }}
            disabled={submitLoading}
          >
            Reset
          </button>
          <ButtonContained
            type="button"
            onClick={handleSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? "Importing..." : "Submit"}
          </ButtonContained>
        </div>
      </div>
    </div>
  );
};

export default ImportDataModal;
