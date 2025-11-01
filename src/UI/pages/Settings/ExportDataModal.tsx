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
import { playerApi } from "../Players/playersApi";
import { teamApi } from "../Teams/teamsApi";
import { coachApi } from "../Coaches/coachApi";
import type { Coach } from "../Coaches/coachApi";
import { matchApi } from "../Matches/matchApi";
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
  total: number;
};

type SelectionState = Record<CategoryKey, string[]>;

const createEmptySelection = (): SelectionState => ({
  players: [],
  teams: [],
  coaches: [],
  matches: [],
});

const computeSelection = (
  playersList: Player[],
  teamsList: Team[],
  coachesList: Coach[],
  matchesList: Match[],
): SelectionState => ({
  players: playersList.map((player) => player._id),
  teams: teamsList.map((team) => team._id),
  coaches: coachesList.map((coach) => coach.steamid),
  matches: matchesList.map((match) => match.id),
});

const defaultExpanded: Record<CategoryKey, boolean> = {
  players: true,
  teams: false,
  coaches: false,
  matches: false,
};

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: ExportDataResult) => void;
}

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

const buildCoachAvatarUrl = (coach: Coach) =>
  coach.avatar
    ? `${apiUrl}/coach/avatar/${coach.steamid}?v=${encodeURIComponent(coach.avatar)}`
    : PlayerSilhouette;

const buildTeamLogoUrl = (teamId: string | null | undefined) =>
  teamId ? `${apiUrl}/teams/logo/${teamId}` : undefined;

export const ExportDataModal = ({
  isOpen,
  onClose,
  onSuccess,
}: ExportDataModalProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const [selectedIds, setSelectedIds] = useState<SelectionState>(
    createEmptySelection(),
  );
  const [expanded, setExpanded] =
    useState<Record<CategoryKey, boolean>>(defaultExpanded);

  const [loadingData, setLoadingData] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teamById = useMemo(() => {
    return teams.reduce((acc, team) => {
      acc.set(team._id, team);
      return acc;
    }, new Map<string, Team>());
  }, [teams]);

  const categories = useMemo<CategoryConfig[]>(() => {
    return [
      {
        key: "players",
        title: "Players",
        items: players.map((player) => {
          const fullName = [player.firstName, player.lastName]
            .filter(Boolean)
            .join(" ");
          const playerTeam = player.team ? teamById.get(player.team) : undefined;
          const teamName = playerTeam?.name ?? "Unassigned team";

          return {
            id: player._id,
            label: player.username,
            lines: [
              fullName || undefined,
              `Team: ${teamName}`,
              `Steam ID: ${player.steamid}`,
            ].filter(Boolean) as string[],
            imageUrl: buildPlayerAvatarUrl(player),
            badgeImageUrl: playerTeam?.logo
              ? buildTeamLogoUrl(playerTeam._id)
              : undefined,
            badgeLabel: !playerTeam?.logo ? teamName : undefined,
          };
        }),
        total: players.length,
      },
      {
        key: "teams",
        title: "Teams",
        items: teams.map((team) => ({
          id: team._id,
          label: team.name,
          lines: [
            team.shortName ? `Tag: ${team.shortName}` : undefined,
            team.country ? `Country: ${team.country}` : undefined,
          ].filter(Boolean) as string[],
          imageUrl: team.logo ? buildTeamLogoUrl(team._id) : undefined,
        })),
        total: teams.length,
      },
      {
        key: "coaches",
        title: "Coaches",
        items: coaches.map((coach) => {
          const coachTeam = coach.team ? teamById.get(coach.team) : undefined;
          const teamName = coachTeam?.name ?? "Unassigned team";
          return {
            id: coach.steamid,
            label: coach.name || coach.steamid,
            lines: [
              `Team: ${teamName}`,
              `Steam ID: ${coach.steamid}`,
            ],
            imageUrl: buildCoachAvatarUrl(coach),
            badgeImageUrl: coachTeam?.logo
              ? buildTeamLogoUrl(coachTeam._id)
              : undefined,
            badgeLabel: !coachTeam?.logo ? teamName : undefined,
          };
        }),
        total: coaches.length,
      },
      {
        key: "matches",
        title: "Matches",
        items: matches.map((match) => {
          const leftTeam = match.left?.id
            ? teamById.get(match.left.id)?.name ?? match.left.id
            : "TBD";
          const rightTeam = match.right?.id
            ? teamById.get(match.right.id)?.name ?? match.right.id
            : "TBD";
          const label =
            leftTeam === "TBD" && rightTeam === "TBD"
              ? `Match ${match.id}`
              : `${leftTeam} vs ${rightTeam}`;

          return {
            id: match.id,
            label,
            lines: [
              `Type: ${match.matchType?.toUpperCase() ?? "N/A"}`,
              `Current: ${match.current ? "Yes" : "No"}`,
            ],
          };
        }),
        total: matches.length,
      },
    ];
  }, [players, teams, coaches, matches, teamById]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isCancelled = false;

    const load = async () => {
      setLoadingData(true);
      setSubmitLoading(false);
      setError(null);
      setExpanded(defaultExpanded);

      try {
        const [playersData, teamsData, coachesData, matchesData] =
          await Promise.all([
            playerApi.getAll(),
            teamApi.getAll(),
            coachApi.getAll(),
            matchApi.getAll(),
          ]);

        if (isCancelled) return;

        setPlayers(playersData);
        setTeams(teamsData);
        setCoaches(coachesData);
        setMatches(matchesData);
        setSelectedIds(
          computeSelection(playersData, teamsData, coachesData, matchesData),
        );
      } catch (err) {
        if (isCancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load data for export.";
        setError(message);
        setPlayers([]);
        setTeams([]);
        setCoaches([]);
        setMatches([]);
        setSelectedIds(createEmptySelection());
      } finally {
        if (!isCancelled) {
          setLoadingData(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

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

  const handleReset = () => {
    setSelectedIds(computeSelection(players, teams, coaches, matches));
    setError(null);
  };

  const composeSelection = (
    key: CategoryKey,
    items: CategoryItem[],
  ): DataSelection => {
    const ids = selectedIds[key] ?? [];
    if (items.length === 0) {
      return { includeAll: true, ids: [] };
    }
    if (ids.length >= items.length) {
      return { includeAll: true, ids: [] };
    }
    return { includeAll: false, ids };
  };

  const handleSubmit = async () => {
    if (!window.electron?.exportData) {
      setError("Export is not available in this environment.");
      return;
    }

    const totalAvailable = categories.reduce(
      (sum, category) => sum + category.items.length,
      0,
    );

    if (totalAvailable > 0 && !hasSelection) {
      setError("Select at least one item to export.");
      return;
    }

    setSubmitLoading(true);
    setError(null);

    try {
      const payload: DataExportSelection = {
        players: composeSelection(
          "players",
          categories.find((category) => category.key === "players")?.items ||
            [],
        ),
        teams: composeSelection(
          "teams",
          categories.find((category) => category.key === "teams")?.items || [],
        ),
        coaches: composeSelection(
          "coaches",
          categories.find((category) => category.key === "coaches")?.items ||
            [],
        ),
        matches: composeSelection(
          "matches",
          categories.find((category) => category.key === "matches")?.items ||
            [],
        ),
      };

      const result = await window.electron.exportData(payload);
      if (result.cancelled) {
        return;
      }

      if (!result.success) {
        setError(result.message || "Export failed.");
        return;
      }

      onSuccess(result);
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to export data.";
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
        className="relative w-full max-w-3xl rounded-2xl bg-background-primary p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close export data modal"
          className="absolute right-4 top-4 text-text-secondary transition hover:text-primary"
          onClick={onClose}
        >
          <FiX className="size-5" />
        </button>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-text">Export data</h2>
        </div>

        {loadingData ? (
          <div className="flex h-40 items-center justify-center text-text-secondary">
            Loading data...
          </div>
        ) : (
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
                                    key={`${item.id}-line-${index}`}
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
        )}

        {error && (
          <div className="mt-4 rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-full border border-border px-5 py-1.5 text-sm font-semibold uppercase text-text-secondary transition hover:bg-background-light/60"
            onClick={handleReset}
            disabled={loadingData || submitLoading}
          >
            Reset
          </button>
          <ButtonContained
            type="button"
            onClick={handleSubmit}
            disabled={loadingData || submitLoading}
          >
            {submitLoading ? "Exporting..." : "Submit"}
          </ButtonContained>
        </div>
      </div>
    </div>
  );
};

export default ExportDataModal;
