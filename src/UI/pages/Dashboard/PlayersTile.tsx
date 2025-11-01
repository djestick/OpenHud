import { useMemo, useRef, useState } from "react";
import { ButtonContained } from "../../components";
import { PlayerForm } from "../Players/PlayersForm";
import { CoachForm } from "../Coaches/CoachesForm";
import type { CoachFormPrefill } from "../Coaches/CoachForm";
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
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between">
        <h5 className="font-semibold">{label}</h5>
        <span className="rounded-full border border-border bg-background-secondary px-2 py-0.5 text-xs text-text/80">
          {columnDetails.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {columnDetails.map(({ player, existingPlayer, existingCoach, avatarSrc }) => (
                <div
                  className="flex items-center justify-between rounded-lg border border-border bg-background-secondary px-3 py-2 hover:bg-background-light"
                  key={player.steamid}
                >
                  <div className="flex min-w-0 items-center">
                    <img src={avatarSrc} alt="Player avatar" className="mr-3 size-12 rounded object-cover" />
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{player.name}</div>
                      <button
                        type="button"
                        title="Copy SteamID"
                        className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-text/80 hover:bg-background-light"
                        onClick={() => copyToClipboard(player.steamid)}
                      >
                        <MdContentCopy className="size-3.5" />
                        <span className="truncate max-w-[140px] md:max-w-[200px]">{player.steamid}</span>
                      </button>
                    </div>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    {existingCoach ? (
                      <ButtonContained
                        className="px-3 py-1 text-xs"
                        title="Edit Coach"
                        onClick={() => {
                          setSelectedCoach(existingCoach);
                          setCoachIsEditing(true);
                          setCoachPrefill(undefined);
                          setOpenCoachForm(true);
                        }}
                      >
                        <span className="inline-flex items-center gap-1">
                          <MdEdit className="size-4" /> Edit
                        </span>
                      </ButtonContained>
                    ) : (
                      <ButtonContained
                        className="px-3 py-1 text-xs"
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
                          <span className="inline-flex items-center gap-1">
                            <MdEdit className="size-4" /> Edit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <MdPersonAdd className="size-4" /> Create
                          </span>
                        )}
                      </ButtonContained>
                    )}
                  </div>
                </div>
              ))}
      </div>
      {columnCoaches.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-text/60">
                  {label} coaches
                </div>
                <div className="flex flex-col gap-2">
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
                        className="flex items-center justify-between rounded-lg border border-border bg-background-secondary px-3 py-2"
                        key={`coach-${coach.steamid}`}
                      >
                        <div className="flex min-w-0 items-center">
                          <img src={coachAvatar} alt="Coach avatar" className="mr-3 size-12 rounded object-cover" />
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{displayName}</div>
                            <button
                              type="button"
                              title="Copy SteamID"
                              className="mt-1 inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-text/80 hover:bg-background-light"
                              onClick={() => copyToClipboard(coach.steamid)}
                            >
                              <MdContentCopy className="size-3.5" />
                              <span className="truncate max-w-[140px] md:max-w-[200px]">{coach.steamid}</span>
                            </button>
                          </div>
                        </div>
                        <ButtonContained
                          className="px-3 py-1 text-xs"
                          title="Edit Coach"
                          onClick={() => {
                            setSelectedCoach(coach);
                            setCoachIsEditing(true);
                            setCoachPrefill(undefined);
                            setOpenCoachForm(true);
                          }}
                        >
                          <span className="inline-flex items-center gap-1">
                            <MdEdit className="size-4" /> Edit
                          </span>
                        </ButtonContained>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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




