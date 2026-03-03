import { useMemo, useRef, useState } from "react";
import { ButtonContained } from "../../components";
import { PlayerForm } from "../Players/PlayersForm";
import { CoachForm } from "../Coaches/CoachesForm";
import type { CoachFormPrefill } from "../Coaches/CoachesForm";
import type { Coach } from "../Coaches/coachApi";
import { usePlayers } from "../Players/usePlayers";
import { useCoaches } from "../Coaches/useCoaches";
import { useTeams } from "../Teams/useTeams";
import { MdContentCopy, MdEdit, MdPersonAdd } from "react-icons/md";
import playerSilhouette from "../../assets/player_silhouette.webp";
import { apiUrl } from "../../api/api";

type ConnectedPlayer = {
  name: string;
  steamid: string;
  clan?: string | null;
  team?: { side?: string; id?: string | null; name?: string | null };
};

interface PlayersTileProps {
  playersFromGame: ConnectedPlayer[];
  copyToClipboard: (text: string) => void;
}

export const PlayersTile = ({ playersFromGame, copyToClipboard }: PlayersTileProps) => {
  const { players, setSelectedPlayer, setIsEditing } = usePlayers();
  const { coaches, setSelectedCoach, setIsEditing: setCoachIsEditing } = useCoaches();
  const { teams } = useTeams();
  const coachSideMemory = useRef<Map<string, SideLabel>>(new Map());

  const [openPlayerForm, setOpenPlayerForm] = useState(false);
  const [playerPrefill, setPlayerPrefill] = useState<{ username?: string; steamId?: string }>();
  const [openCoachForm, setOpenCoachForm] = useState(false);
  const [coachPrefill, setCoachPrefill] = useState<CoachFormPrefill | undefined>(undefined);

  const ctPlayers = playersFromGame.filter((p) => (p.team?.side || "").toUpperCase() === "CT");
  const tPlayers = playersFromGame.filter((p) => (p.team?.side || "").toUpperCase() === "T");

  type SideLabel = "CT" | "T";

  const normalizeTeamId = (value: string | null | undefined) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  const normalizeString = (value: string | null | undefined) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.toLowerCase() : null;
  };

  const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

  type PlayerDetail = {
    player: ConnectedPlayer;
    existingPlayer?: Player;
    existingCoach?: Coach;
    avatarSrc: string;
  };

  const playerDetailsByLabel: Record<SideLabel, PlayerDetail[]> = useMemo(() => {
    const buildDetails = (list: ConnectedPlayer[]): PlayerDetail[] =>
      list.map((player) => {
        const existingPlayer = players.find((p) => p.steamid === player.steamid);
        const existingCoach = coaches.find((c) => c.steamid === player.steamid);
        const avatarSrc = existingPlayer?.avatar
          ? `${apiUrl}/players/avatar/${existingPlayer._id}?t=${existingPlayer.updatedAt ?? ""}`
          : existingCoach?.avatar
            ? `${apiUrl}/coach/avatar/${existingCoach.steamid}?t=${existingCoach.updatedAt ?? ""}`
            : playerSilhouette;

        return { player, existingPlayer, existingCoach, avatarSrc };
      });

    return {
      CT: buildDetails(ctPlayers),
      T: buildDetails(tPlayers),
    };
  }, [coaches, ctPlayers, players, tPlayers]);

  const sideSteamIds = useMemo(
    () => ({
      CT: new Set(playerDetailsByLabel.CT.map((detail) => detail.player.steamid)),
      T: new Set(playerDetailsByLabel.T.map((detail) => detail.player.steamid)),
    }),
    [playerDetailsByLabel]
  );

  const teamIdsFromPlayersDb = useMemo(
    () => ({
      CT: new Set(
        playerDetailsByLabel.CT
          .map((detail) => detail.existingPlayer?.team)
          .filter(isNonEmptyString)
      ),
      T: new Set(
        playerDetailsByLabel.T
          .map((detail) => detail.existingPlayer?.team)
          .filter(isNonEmptyString)
      ),
    }),
    [playerDetailsByLabel]
  );

  const teamIdsFromGame = useMemo(
    () => ({
      CT: new Set(ctPlayers.map((player) => player.team?.id).filter(isNonEmptyString)),
      T: new Set(tPlayers.map((player) => player.team?.id).filter(isNonEmptyString)),
    }),
    [ctPlayers, tPlayers]
  );

  const scoreboardTeamNames = useMemo(
    () => ({
      CT: new Set(
        playerDetailsByLabel.CT
          .map((detail) => detail.player.team?.name)
          .filter(isNonEmptyString)
      ),
      T: new Set(
        playerDetailsByLabel.T
          .map((detail) => detail.player.team?.name)
          .filter(isNonEmptyString)
      ),
    }),
    [playerDetailsByLabel]
  );

  const scoreboardTeamClans = useMemo(
    () => ({
      CT: new Set(
        playerDetailsByLabel.CT
          .map((detail) => detail.player.clan)
          .filter(isNonEmptyString)
      ),
      T: new Set(
        playerDetailsByLabel.T
          .map((detail) => detail.player.clan)
          .filter(isNonEmptyString)
      ),
    }),
    [playerDetailsByLabel]
  );

  const teamsIndex = useMemo(() => {
    const byName = new Map<string, string>();
    const byShort = new Map<string, string>();
    const byExtraTag = new Map<string, string>();

    teams.forEach((team) => {
      const normalizedName = normalizeString(team.name);
      if (normalizedName) {
        byName.set(normalizedName, team._id);
      }
      const normalizedShort = normalizeString(team.shortName);
      if (normalizedShort) {
        byShort.set(normalizedShort, team._id);
      }
      const extraTag = typeof team.extra?.tag === "string" ? normalizeString(team.extra.tag) : null;
      if (extraTag) {
        byExtraTag.set(extraTag, team._id);
      }
    });

    return { byName, byShort, byExtraTag };
  }, [teams]);

  const dbTeamIdsBySide = useMemo(() => {
    const collectIds = (side: SideLabel) => {
      const ids = new Set<string>();

      teamIdsFromPlayersDb[side].forEach((id) => ids.add(id));

      scoreboardTeamNames[side].forEach((name) => {
        const normalized = normalizeString(name);
        if (!normalized) return;
        const match = teamsIndex.byName.get(normalized);
        if (match) {
          ids.add(match);
        }
      });

      scoreboardTeamClans[side].forEach((clan) => {
        const normalized = normalizeString(clan);
        if (!normalized) return;
        const matchByShort = teamsIndex.byShort.get(normalized);
        if (matchByShort) {
          ids.add(matchByShort);
          return;
        }
        const matchByExtra = teamsIndex.byExtraTag.get(normalized);
        if (matchByExtra) {
          ids.add(matchByExtra);
        }
      });

      return ids;
    };

    return {
      CT: collectIds("CT"),
      T: collectIds("T"),
    };
  }, [scoreboardTeamClans, scoreboardTeamNames, teamIdsFromPlayersDb, teamsIndex]);

  const coachesByLabel: Record<SideLabel, Coach[]> = useMemo(() => {
    const grouped: Record<SideLabel, Coach[]> = { CT: [], T: [] };
    const ensureCoach = (side: SideLabel, coach: Coach) => {
      if (!grouped[side].some((existing) => existing.steamid === coach.steamid)) {
        grouped[side].push(coach);
      }
    };

    const memory = coachSideMemory.current;

    const currentCoachSteamIds = new Set<string>();

    coaches.forEach((coach) => {
      currentCoachSteamIds.add(coach.steamid);
      let side: SideLabel | null = null;

      if (sideSteamIds.CT.has(coach.steamid)) {
        side = "CT";
      } else if (sideSteamIds.T.has(coach.steamid)) {
        side = "T";
      } else {
        const normalizedTeam = normalizeTeamId(coach.team);
        if (normalizedTeam) {
          if (
            dbTeamIdsBySide.CT.has(normalizedTeam) ||
            teamIdsFromGame.CT.has(normalizedTeam)
          ) {
            side = "CT";
          } else if (
            dbTeamIdsBySide.T.has(normalizedTeam) ||
            teamIdsFromGame.T.has(normalizedTeam)
          ) {
            side = "T";
          } else {
            const shorthand = normalizedTeam.toUpperCase();
            if (shorthand === "CT" || shorthand === "T") {
              side = shorthand;
            }
          }
        }
      }

      if (!side) {
        side = memory.get(coach.steamid) ?? null;
      }

      if (!side) {
        side = grouped.CT.length <= grouped.T.length ? "CT" : "T";
      }

      memory.set(coach.steamid, side);
      ensureCoach(side, coach);
    });

    memory.forEach((_value, key) => {
      if (!currentCoachSteamIds.has(key)) {
        memory.delete(key);
      }
    });

    return grouped;
  }, [coaches, dbTeamIdsBySide, sideSteamIds, teamIdsFromGame]);

  const renderColumn = (label: SideLabel) => {
    const columnDetails = playerDetailsByLabel[label];
    const columnCoaches = coachesByLabel[label];

    return (
      <div className="flex flex-col rounded-2xl bg-background-secondary/30 shadow-sm backdrop-blur-sm overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center justify-between px-5 py-4 bg-background-secondary/50">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-text">
              {label === "CT" ? "Counter-Terrorists" : "Terrorists"}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-secondary">
              Players
            </span>
          </div>
          <span className="rounded-full bg-background-secondary px-3 py-1 text-xs font-bold text-text/80 shadow-sm">
            {columnDetails.length}
          </span>
        </div>

        <div className="flex flex-col gap-3 p-5">
          {columnDetails.map(({ player, existingPlayer, existingCoach, avatarSrc }) => (
            <div
              className="flex items-center justify-between rounded-xl bg-background shadow-sm hover:shadow-md hover:bg-background-light transition-all duration-200 px-4 py-3"
              key={player.steamid}
            >
              <div className="flex min-w-0 items-center gap-4">
                <img src={avatarSrc} alt="Player avatar" className="size-12 rounded-lg bg-background-secondary object-cover shadow-sm" />
                <div className="flex min-w-0 flex-col py-0.5">
                  <div className="truncate font-semibold text-sm leading-tight text-text/90">{player.name}</div>
                  <button
                    type="button"
                    title="Copy SteamID"
                    className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-background-secondary hover:bg-primary/10 hover:text-primary px-2.5 py-0.5 text-[11px] font-medium text-text-secondary transition-colors"
                    onClick={() => copyToClipboard(player.steamid)}
                  >
                    <MdContentCopy className="size-3" />
                    <span className="truncate max-w-[150px] md:max-w-[200px] font-mono tracking-tight">{player.steamid}</span>
                  </button>
                </div>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                {existingCoach ? (
                  <ButtonContained
                    className="px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase shadow-none bg-background-secondary hover:bg-background-light text-text/80"
                    title="Edit Coach"
                    onClick={() => {
                      setSelectedCoach(existingCoach);
                      setCoachIsEditing(true);
                      setCoachPrefill(undefined);
                      setOpenCoachForm(true);
                    }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <MdEdit className="size-3.5" /> Edit
                    </span>
                  </ButtonContained>
                ) : (
                  <ButtonContained
                    className="px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase shadow-none bg-background-secondary hover:bg-background-light text-text/80"
                    title={existingPlayer ? "Edit Player" : "Create Player"}
                    onClick={() => {
                      if (existingPlayer) {
                        setSelectedPlayer(existingPlayer);
                        setIsEditing(true);
                        setPlayerPrefill(undefined);
                      } else {
                        setIsEditing(false);
                        setPlayerPrefill({ username: player.name, steamId: player.steamid });
                      }
                      setOpenPlayerForm(true);
                    }}
                  >
                    {existingPlayer ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MdEdit className="size-3.5" /> Edit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <MdPersonAdd className="size-3.5" /> Create
                      </span>
                    )}
                  </ButtonContained>
                )}
              </div>
            </div>
          ))}

          {columnCoaches.length > 0 && (
            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
                  Coaches
                </span>
                <span className="rounded-full bg-background-secondary px-2.5 py-0.5 text-[10px] font-bold text-text/80 shadow-sm">
                  {columnCoaches.length}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {columnCoaches.map((coach) => {
                  const displayName =
                    [coach.firstName, coach.lastName]
                      .filter(Boolean)
                      .join(" ")
                      .trim() || coach.name || coach.username || "Unnamed Coach";
                  const coachAvatar = coach.avatar
                    ? `${apiUrl}/coach/avatar/${coach.steamid}?t=${coach.updatedAt ?? ""}`
                    : playerSilhouette;
                  return (
                    <div
                      className="flex items-center justify-between rounded-xl bg-background shadow-sm hover:shadow-md hover:bg-background-light transition-all duration-200 px-4 py-3"
                      key={`coach-${coach.steamid}`}
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <img src={coachAvatar} alt="Coach avatar" className="size-12 rounded-lg bg-background-secondary object-cover shadow-sm" />
                        <div className="flex min-w-0 flex-col py-0.5">
                          <div className="truncate font-semibold text-sm leading-tight text-text/90">{displayName}</div>
                          <button
                            type="button"
                            title="Copy SteamID"
                            className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-background-secondary hover:bg-primary/10 hover:text-primary px-2.5 py-0.5 text-[11px] font-medium text-text-secondary transition-colors"
                            onClick={() => copyToClipboard(coach.steamid)}
                          >
                            <MdContentCopy className="size-3" />
                            <span className="truncate max-w-[150px] md:max-w-[200px] font-mono tracking-tight">{coach.steamid}</span>
                          </button>
                        </div>
                      </div>
                      <ButtonContained
                        className="ml-4 px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase shadow-none bg-background-secondary hover:bg-background-light text-text/80 shrink-0"
                        title="Edit Coach"
                        onClick={() => {
                          setSelectedCoach(coach);
                          setCoachIsEditing(true);
                          setCoachPrefill(undefined);
                          setOpenCoachForm(true);
                        }}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <MdEdit className="size-3.5" /> Edit
                        </span>
                      </ButtonContained>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <PlayerForm open={openPlayerForm} setOpen={setOpenPlayerForm} prefill={playerPrefill} />
      <CoachForm open={openCoachForm} setOpen={setOpenCoachForm} prefill={coachPrefill} />
      <div className="grid grid-cols-2 gap-4">
        {renderColumn("CT")}
        {renderColumn("T")}
      </div>
    </>
  );
};




