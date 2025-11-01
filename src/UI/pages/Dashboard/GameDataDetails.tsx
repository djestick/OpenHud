import { useState } from "react";
import type { ReactNode } from "react";
import { MdKeyboardArrowRight } from "react-icons/md";
import type {
  Bomb,
  CSGO,
  CSGORaw,
  Grenade,
  Map as GameMap,
  PhaseRaw,
  Player,
  Weapon,
} from "csgogsi";

interface GameDataDetailsProps {
  data: CSGO | null;
  rawData: CSGORaw | null;
}

type CollapsibleLevel = 0 | 1 | 2;

interface CollapsibleCardProps {
  title: string;
  subtitle?: ReactNode;
  defaultOpen?: boolean;
  level?: CollapsibleLevel;
  className?: string;
  children: ReactNode;
}

const containerByLevel: Record<CollapsibleLevel, string> = {
  0: "rounded-2xl border border-border/70 bg-background-secondary/40 backdrop-blur-sm",
  1: "rounded-xl border border-border/60 bg-background-secondary/50",
  2: "rounded-lg border border-border/50 bg-background-secondary/40",
};

const headerByLevel: Record<CollapsibleLevel, string> = {
  0: "px-5 py-4",
  1: "px-4 py-3",
  2: "px-3 py-2.5",
};

const bodyByLevel: Record<CollapsibleLevel, string> = {
  0: "px-5 pb-5 pt-2.5",
  1: "px-4 pb-4 pt-2",
  2: "px-3 pb-3 pt-1.5",
};

const titleByLevel: Record<CollapsibleLevel, string> = {
  0: "text-sm font-semibold uppercase tracking-[0.2em] text-text",
  1: "text-[13px] font-semibold uppercase tracking-[0.18em] text-text",
  2: "text-xs font-semibold uppercase tracking-[0.16em] text-text",
};

const CollapsibleCard = ({
  title,
  subtitle,
  defaultOpen = false,
  level = 0,
  className = "",
  children,
}: CollapsibleCardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const containerClass = ["w-full", containerByLevel[level], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      <button
        type="button"
        className={`flex w-full items-center justify-between gap-3 text-left transition ${headerByLevel[level]}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <div className="flex flex-col gap-1">
          <span className={titleByLevel[level]}>{title}</span>
          {subtitle && (
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-text-secondary">
              {subtitle}
            </span>
          )}
        </div>
        <MdKeyboardArrowRight
          className={`size-5 shrink-0 text-text transition-transform ${isOpen ? "rotate-90" : ""}`}
        />
      </button>
      {isOpen && (
        <div className={`space-y-4 text-sm text-text ${bodyByLevel[level]}`}>{children}</div>
      )}
    </div>
  );
};

interface InfoRowProps {
  label: string;
  value: ReactNode;
}

const InfoRow = ({ label, value }: InfoRowProps) => {
  const isEmpty =
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim().length === 0);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-secondary">
        {label}
      </span>
      <div className="break-words text-sm text-text">{isEmpty ? "-" : value}</div>
    </div>
  );
};

interface InfoGridProps {
  items: InfoRowProps[];
  columns?: 1 | 2 | 3;
}

const InfoGrid = ({ items, columns = 2 }: InfoGridProps) => {
  const columnClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
        ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2";

  return (
    <div className={`grid gap-4 ${columnClass}`}>
      {items.map((item) => (
        <InfoRow key={item.label} {...item} />
      ))}
    </div>
  );
};

const formatNumberArray = (values: number[] | undefined) =>
  values && values.length ? values.map((value) => value.toFixed(1)).join(", ") : "-";

const RoundWinsList = ({ map }: { map: GameMap | undefined }) => {
  if (!map?.round_wins) return <span>-</span>;
  const entries = Object.entries(map.round_wins);
  if (entries.length === 0) return <span>-</span>;

  return (
    <div className="flex flex-col gap-1 text-sm text-text">
      {entries.map(([round, outcome]) => (
        <span key={round}>
          Round {round}: {outcome}
        </span>
      ))}
    </div>
  );
};

const WeaponList = ({ weapons }: { weapons: Weapon[] }) => (
  <div className="grid gap-3">
    {weapons.map((weapon) => (
      <div
        key={weapon.id}
        className="rounded-lg border border-border/60 bg-background px-3 py-2 shadow"
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-text">{weapon.name || weapon.id}</span>
          <span className="text-xs uppercase tracking-[0.14em] text-text-secondary">
            {weapon.type ?? "Unknown"}
          </span>
        </div>
        <InfoGrid
          columns={2}
          items={[
            { label: "State", value: weapon.state },
            { label: "PaintKit", value: weapon.paintkit },
            { label: "AmmoClip", value: weapon.ammo_clip },
            { label: "AmmoClipMax", value: weapon.ammo_clip_max },
            { label: "AmmoReserve", value: weapon.ammo_reserve },
          ]}
        />
      </div>
    ))}
  </div>
);

const GrenadeList = ({ grenades }: { grenades: Grenade[] }) => (
  <div className="grid gap-3">
    {grenades.map((grenade) => (
      <div
        key={grenade.id}
        className="rounded-lg border border-border/60 bg-background px-3 py-2 shadow"
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold capitalize text-text">{grenade.type}</span>
          <span className="text-xs uppercase tracking-[0.14em] text-text-secondary">
            Owner: {grenade.owner ?? "Unknown"}
          </span>
        </div>
        <InfoGrid
          items={[
            { label: "Lifetime", value: grenade.lifetime },
            {
              label: "Velocity",
              value: "velocity" in grenade ? formatNumberArray(grenade.velocity) : "-",
            },
            {
              label: "Position",
              value: "position" in grenade ? formatNumberArray(grenade.position) : "-",
            },
            {
              label: "EffectTime",
              value: "effecttime" in grenade ? grenade.effecttime : "-",
            },
          ]}
        />
        {"flames" in grenade && Array.isArray(grenade.flames) && (
          <div className="rounded border border-border/60 bg-background-secondary/60 p-2 text-xs leading-relaxed">
            <pre className="whitespace-pre-wrap break-words">
              {JSON.stringify(grenade.flames, null, 2)}
            </pre>
          </div>
        )}
      </div>
    ))}
  </div>
);

const PlayerPanel = ({ player }: { player: Player }) => {
  const activeWeapon = player.weapons.find((weapon) => weapon.state === "active") ?? null;

  return (
    <CollapsibleCard
      level={2}
      title={player.name || player.defaultName || "Unknown player"}
      subtitle={`${player.team.side} - ${player.team.name ?? "Unknown team"}`}
      defaultOpen={false}
    >
      <InfoGrid
        items={[
          { label: "SteamID", value: player.steamid },
          { label: "Clan", value: player.clan },
          {
            label: "ObserverSlot",
            value: player.observer_slot !== undefined ? player.observer_slot : "-",
          },
          { label: "Money", value: player.state.money },
          { label: "EquipmentValue", value: player.state.equip_value },
          { label: "Health", value: player.state.health },
          { label: "Armor", value: player.state.armor },
          { label: "Helmet", value: player.state.helmet ? "Yes" : "No" },
          {
            label: "DefuseKit",
            value:
              player.state.defusekit !== undefined
                ? player.state.defusekit
                  ? "Yes"
                  : "No"
                : "-",
          },
          { label: "FlashAmount", value: player.state.flashed },
          { label: "SmokedAmount", value: player.state.smoked },
          { label: "BurningAmount", value: player.state.burning },
        ]}
      />
      <InfoGrid
        items={[
          { label: "RoundKills", value: player.state.round_kills },
          { label: "RoundHSKills", value: player.state.round_killhs },
          { label: "RoundTotalDamage", value: player.state.round_totaldmg },
          { label: "Kills", value: player.stats.kills },
          { label: "Assists", value: player.stats.assists },
          { label: "Deaths", value: player.stats.deaths },
          { label: "MVPs", value: player.stats.mvps },
          { label: "Score", value: player.stats.score },
        ]}
      />
      <InfoGrid
        columns={1}
        items={[
          { label: "Position", value: formatNumberArray(player.position) },
          { label: "ForwardDirection", value: formatNumberArray(player.forward) },
          { label: "ActiveWeapon", value: activeWeapon?.name ?? "-" },
        ]}
      />
      {player.weapons.length > 0 && (
        <CollapsibleCard
          level={2}
          title="Weapons"
          subtitle={`${player.weapons.length} item(s)`}
          defaultOpen={false}
        >
          <WeaponList weapons={player.weapons} />
        </CollapsibleCard>
      )}
    </CollapsibleCard>
  );
};

const TeamPlayersSection = ({ label, players }: { label: string; players: Player[] }) => {
  if (!players.length) return null;

  return (
    <CollapsibleCard
      level={1}
      title={`${label} Players`}
      subtitle={`${players.length} connected`}
      defaultOpen={false}
    >
      <div className="flex flex-col gap-3">
        {players.map((player) => (
          <PlayerPanel key={player.steamid ?? player.name} player={player} />
        ))}
      </div>
    </CollapsibleCard>
  );
};

const PhaseCountdownDetails = ({
  phase,
  className,
}: {
  phase: PhaseRaw | null;
  className?: string;
}) => {
  if (!phase) return null;

  return (
    <CollapsibleCard
      className={className}
      title="Phase Countdown"
      subtitle="Live match timing"
      defaultOpen={false}
    >
      <InfoGrid
        items={[
          { label: "Phase", value: phase.phase },
          {
            label: "PhaseEndsIn",
            value:
              phase.phase_ends_in !== undefined
                ? `${Number.parseFloat(phase.phase_ends_in).toFixed(2)}s`
                : "-",
          },
        ]}
      />
    </CollapsibleCard>
  );
};

const BombDetails = ({ bomb, className }: { bomb: Bomb | null; className?: string }) => {
  if (!bomb) return null;

  return (
    <CollapsibleCard
      className={className}
      title="Bomb"
      subtitle={`State: ${bomb.state}`}
      defaultOpen={false}
    >
      <InfoGrid
        items={[
          {
            label: "Player",
            value: bomb.player ? `${bomb.player.name} (${bomb.player.steamid})` : "-",
          },
          {
            label: "Countdown",
            value: bomb.countdown !== undefined ? `${bomb.countdown.toFixed(2)}s` : "-",
          },
          { label: "Site", value: bomb.site },
          { label: "Position", value: formatNumberArray(bomb.position) },
        ]}
      />
    </CollapsibleCard>
  );
};

const TournamentDraftBlock = ({
  data,
  className,
}: {
  data: unknown;
  className?: string;
}) => {
  if (!data) return null;

  return (
    <CollapsibleCard className={className} title="Tournament Draft" defaultOpen={false}>
      <pre className="whitespace-pre-wrap break-words rounded border border-border/60 bg-background-secondary/60 p-3 text-xs leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </CollapsibleCard>
  );
};

const PreviouslyBlock = ({
  data,
  className,
}: {
  data: unknown;
  className?: string;
}) => {
  if (!data) return null;

  return (
    <CollapsibleCard
      className={className}
      title="Previously"
      subtitle="Previous gamestate snapshot"
      defaultOpen={false}
    >
      <pre className="whitespace-pre-wrap break-words rounded border border-border/60 bg-background-secondary/60 p-3 text-xs leading-relaxed">
        {JSON.stringify(data, null, 2)}
      </pre>
    </CollapsibleCard>
  );
};

export const GameDataDetails = ({ data, rawData }: GameDataDetailsProps) => {
  const allPlayers = data?.players ?? [];
  const grenades = data?.grenades ?? [];
  const observedPlayer = data?.player ?? null;
  const observer = data?.observer ?? null;
  const bomb = data?.bomb ?? null;

  const playersByTeam = (() => {
    const grouped = {
      ct: [] as Player[],
      t: [] as Player[],
      other: [] as Player[],
    };

    allPlayers.forEach((player) => {
      const side = (player.team?.side ?? "").toUpperCase();
      if (side === "CT") {
        grouped.ct.push(player);
      } else if (side === "T") {
        grouped.t.push(player);
      } else {
        grouped.other.push(player);
      }
    });

    return grouped;
  })();

  if (!data && !rawData) return null;

  const provider = rawData?.provider ?? data?.provider ?? null;
  const map = data?.map;
  const round = data?.round ?? null;
  const phaseCountdowns = data?.phase_countdowns ?? null;
  const tournamentDraft =
    rawData && (rawData as unknown as { tournament_draft?: unknown }).tournament_draft;
  const previously = rawData?.previously;
  const auth = rawData?.auth ?? null;

  const hasSecondarySections =
    Boolean(observedPlayer) ||
    playersByTeam.ct.length > 0 ||
    playersByTeam.t.length > 0 ||
    playersByTeam.other.length > 0 ||
    grenades.length > 0 ||
    Boolean(tournamentDraft) ||
    Boolean(previously);

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="grid w-full items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr%))]">
        {provider && (
          <CollapsibleCard
            className="self-start"
            title="Provider"
            subtitle="Metadata"
            defaultOpen={false}
          >
            <InfoGrid
              items={[
                { label: "Name", value: provider.name },
                { label: "AppID", value: provider.appid },
                { label: "Version", value: provider.version },
                { label: "SteamID", value: provider.steamid },
                {
                  label: "Timestamp",
                  value:
                    "timestamp" in provider ? (provider as { timestamp?: number }).timestamp : "-",
                },
              ]}
            />
          </CollapsibleCard>
        )}

        {round && (
          <CollapsibleCard
            className="self-start"
            title="Round"
            subtitle="Current round state"
            defaultOpen={false}
          >
            <InfoGrid
              items={[
                { label: "Phase", value: round.phase },
                { label: "BombState", value: round.bomb },
                { label: "WinningTeam", value: round.win_team },
              ]}
            />
          </CollapsibleCard>
        )}

        <PhaseCountdownDetails
          className="self-start"
          phase={phaseCountdowns ?? null}
        />
        <BombDetails className="self-start" bomb={bomb} />

        {map && (
          <CollapsibleCard
            className="col-span-full self-start"
            title="Map"
            subtitle={`${map.name} - ${map.mode}`}
            defaultOpen={false}
          >
            <InfoGrid
              columns={3}
              items={[
                { label: "Mode", value: map.mode },
                { label: "Phase", value: map.phase },
                { label: "Round", value: map.round },
                {
                  label: "MatchesToWinSeries",
                  value: map.num_matches_to_win_series,
                },
                { label: "CurrentSpectators", value: map.current_spectators },
                { label: "SouvenirsTotal", value: map.souvenirs_total },
              ]}
            />
            <CollapsibleCard
              level={1}
              title="Round Wins"
              subtitle="Historical outcomes"
              defaultOpen={false}
            >
              <RoundWinsList map={map} />
            </CollapsibleCard>
            <div className="grid gap-3 lg:grid-cols-2">
              <CollapsibleCard
                level={1}
                title="CT Statistics"
                subtitle={map.team_ct.name ?? "Counter-Terrorists"}
                defaultOpen={false}
              >
                <InfoGrid
                  items={[
                    { label: "Name", value: map.team_ct.name },
                    { label: "Flag", value: map.team_ct.country },
                    { label: "Score", value: map.team_ct.score },
                    {
                      label: "ConsecutiveRoundLosses",
                      value: map.team_ct.consecutive_round_losses,
                    },
                    {
                      label: "RemainingTimeouts",
                      value: map.team_ct.timeouts_remaining,
                    },
                    {
                      label: "MatchesWonThisSeries",
                      value: map.team_ct.matches_won_this_series,
                    },
                  ]}
                />
              </CollapsibleCard>
              <CollapsibleCard
                level={1}
                title="T Statistics"
                subtitle={map.team_t.name ?? "Terrorists"}
                defaultOpen={false}
              >
                <InfoGrid
                  items={[
                    { label: "Name", value: map.team_t.name },
                    { label: "Flag", value: map.team_t.country },
                    { label: "Score", value: map.team_t.score },
                    {
                      label: "ConsecutiveRoundLosses",
                      value: map.team_t.consecutive_round_losses,
                    },
                    {
                      label: "RemainingTimeouts",
                      value: map.team_t.timeouts_remaining,
                    },
                    {
                      label: "MatchesWonThisSeries",
                      value: map.team_t.matches_won_this_series,
                    },
                  ]}
                />
              </CollapsibleCard>
            </div>
          </CollapsibleCard>
        )}

        {auth && (
          <CollapsibleCard
            className="self-start"
            title="Auth"
            subtitle="GSI authentication token"
            defaultOpen={false}
          >
            <InfoGrid
              items={[
                { label: "Token", value: (auth as { token?: string }).token ?? "-" },
              ]}
            />
          </CollapsibleCard>
        )}
      </div>

      {hasSecondarySections && (
        <div className="grid w-full items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(320px,1fr))]">
          {observedPlayer && (
            <CollapsibleCard
              className="self-start"
              title="Observed Player"
              subtitle={observedPlayer.name ?? observedPlayer.steamid ?? "Player"}
              defaultOpen={false}
            >
              <InfoGrid
                columns={2}
                items={[
                  { label: "SteamID", value: observedPlayer.steamid },
                  { label: "Name", value: observedPlayer.name },
                  { label: "Clan", value: observedPlayer.clan },
                  {
                    label: "Team",
                    value: `${observedPlayer.team.side} - ${
                      observedPlayer.team.name ?? "Unknown"
                    }`,
                  },
                  {
                    label: "ObserverSlot",
                    value:
                      observedPlayer.observer_slot !== undefined
                        ? observedPlayer.observer_slot
                        : "-",
                  },
                  {
                    label: "Activity",
                    value: observer?.activity ?? "-",
                  },
                ]}
              />
              <InfoGrid
                items={[
                  { label: "Health", value: observedPlayer.state.health },
                  { label: "Armor", value: observedPlayer.state.armor },
                  {
                    label: "Helmet",
                    value: observedPlayer.state.helmet ? "Yes" : "No",
                  },
                  { label: "Money", value: observedPlayer.state.money },
                  { label: "EquipmentValue", value: observedPlayer.state.equip_value },
                  { label: "FlashAmount", value: observedPlayer.state.flashed },
                  { label: "SmokedAmount", value: observedPlayer.state.smoked },
                  { label: "BurningAmount", value: observedPlayer.state.burning },
                  { label: "RoundKills", value: observedPlayer.state.round_kills },
                  { label: "RoundHSKills", value: observedPlayer.state.round_killhs },
                  {
                    label: "RoundTotalDamage",
                    value: observedPlayer.state.round_totaldmg,
                  },
                  {
                    label: "DefuseKit",
                    value:
                      observedPlayer.state.defusekit !== undefined
                        ? observedPlayer.state.defusekit
                          ? "Yes"
                          : "No"
                        : "-",
                  },
                ]}
              />
              <InfoGrid
                items={[
                  { label: "Kills", value: observedPlayer.stats.kills },
                  { label: "Assists", value: observedPlayer.stats.assists },
                  { label: "Deaths", value: observedPlayer.stats.deaths },
                  { label: "MVPs", value: observedPlayer.stats.mvps },
                  { label: "Score", value: observedPlayer.stats.score },
                ]}
              />
              <InfoGrid
                columns={1}
                items={[
                  {
                    label: "SpectationTarget",
                    value: observer?.spectarget ?? "-",
                  },
                  {
                    label: "Position",
                    value:
                      observer?.position && observer.position.length
                        ? formatNumberArray(observer.position)
                        : "-",
                  },
                  {
                    label: "ForwardDirection",
                    value:
                      observer?.forward && observer.forward.length
                        ? formatNumberArray(observer.forward)
                        : "-",
                  },
                ]}
              />
              {observedPlayer.weapons.length > 0 && (
                <CollapsibleCard
                  level={1}
                  title="Weapons"
                  subtitle={`${observedPlayer.weapons.length} item(s)`}
                  defaultOpen={false}
                >
                  <WeaponList weapons={observedPlayer.weapons} />
                </CollapsibleCard>
              )}
            </CollapsibleCard>
          )}

          {(playersByTeam.ct.length ||
            playersByTeam.t.length ||
            playersByTeam.other.length) && (
            <CollapsibleCard
              className="self-start"
              title="All Players"
              subtitle={`${allPlayers.length} total`}
              defaultOpen={false}
            >
              <div className="flex flex-col gap-3">
                <TeamPlayersSection label="Counter-Terrorist" players={playersByTeam.ct} />
                <TeamPlayersSection label="Terrorist" players={playersByTeam.t} />
                <TeamPlayersSection label="Spectators" players={playersByTeam.other} />
              </div>
            </CollapsibleCard>
          )}

          {grenades.length > 0 && (
            <CollapsibleCard
              className="self-start"
              title="Active Grenades"
              subtitle={`${grenades.length} detected`}
              defaultOpen={false}
            >
              <GrenadeList grenades={grenades} />
            </CollapsibleCard>
          )}

          <TournamentDraftBlock data={tournamentDraft} className="self-start" />
          <PreviouslyBlock data={previously} className="self-start" />
        </div>
      )}
    </div>
  );
};

