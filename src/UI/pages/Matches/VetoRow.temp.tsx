import React from "react";
import { maps } from "./matchConstants";

interface Team {
  _id: string;
  name: string;
}

interface Veto {
  type: "pick" | "ban" | "decider";
  teamId?: string;
  mapName?: string;
  mapEnd?: boolean;
  score?: Record<string, number>;
  winner?: string;
}

interface VetoRowProps {
  index: number;
  veto: Veto;
  leftTeamId: string | null;
  rightTeamId: string | null;
  teams: Team[];
  onVetoChange: (
    index: number,
    key: keyof Veto,
    value: Veto[keyof Veto] | undefined,
  ) => void;
}

export const VetoRow = React.memo<VetoRowProps>(
  ({
    index,
    veto,
    leftTeamId,
    rightTeamId,
    teams,
    onVetoChange,
  }): JSX.Element => {
    const leftTeam = teams.find((team) => team._id === leftTeamId);
    const rightTeam = teams.find((team) => team._id === rightTeamId);
    const hasMatchTeams = Boolean(leftTeamId && rightTeamId);
    const resultInputsDisabled = !hasMatchTeams;
    const winnerRadioName = `winner-${index}`;

    const getScoreValue = (teamId: string | null): number | "" => {
      if (!teamId || !veto.score) return "";
      const value = veto.score[teamId];
      return typeof value === "number" ? value : "";
    };

    const handleScoreChange = (teamId: string | null, rawValue: string) => {
      if (!teamId) return;

      if (rawValue === "") {
        if (!veto.score) {
          onVetoChange(index, "score", undefined);
          return;
        }
        const nextScore = { ...veto.score };
        delete nextScore[teamId];
        const hasValues = Object.keys(nextScore).length > 0;
        onVetoChange(index, "score", hasValues ? nextScore : undefined);
        return;
      }

      const parsed = Number(rawValue);
      if (Number.isNaN(parsed)) return;
      const safeValue = Math.max(0, Math.round(parsed));
      const nextScore = { ...(veto.score ?? {}) };
      nextScore[teamId] = safeValue;
      onVetoChange(index, "score", nextScore);
    };

    const handleWinnerChange = (teamId: string | null) => {
      if (!teamId) return;
      onVetoChange(index, "winner", teamId);
    };

    const handleMapEndToggle = (checked: boolean) => {
      onVetoChange(index, "mapEnd", checked);
      if (!checked) {
        onVetoChange(index, "score", undefined);
        onVetoChange(index, "winner", undefined);
      }
    };

    const renderResultColumn = (
      teamId: string | null,
      label: string,
    ): JSX.Element => {
      const scoreValue = getScoreValue(teamId);
      const isWinner = Boolean(teamId && veto.winner === teamId);

      return (
        <div key={teamId ?? label} className="flex flex-col items-center gap-2">
          <input
            type="number"
            min={0}
            placeholder="0"
            className="border-border/60 bg-background-secondary/60 w-16 rounded-full border px-3 py-1 text-center text-base font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            value={scoreValue}
            onChange={(e) => {
              handleScoreChange(teamId, e.target.value);
              // If score is set and no winner is selected, automatically set this team as winner
              if (e.target.value && !veto.winner && teamId) {
                handleWinnerChange(teamId);
              }
            }}
            disabled={!teamId || resultInputsDisabled}
            inputMode="numeric"
          />
          <label className="flex items-center gap-2 text-xs font-semibold text-text">
            <input
              type="radio"
              name={winnerRadioName}
              className="size-3.5 appearance-none rounded-full border border-border bg-background-secondary transition-colors checked:border-primary checked:bg-primary focus-visible:outline-none disabled:opacity-40"
              checked={isWinner}
              onChange={() => handleWinnerChange(teamId)}
              disabled={!teamId || resultInputsDisabled}
            />
            <span className="whitespace-nowrap">Winner</span>
          </label>
        </div>
      );
    };

    return (
      <tr className="bg-background-secondary odd:bg-background-primary">
        <td className="px-6 py-4">
          <h4 className="text-center font-semibold">Veto {index + 1}</h4>
        </td>
        <td className="px-6 py-4">
          <form className="flex w-full flex-col">
            <div className="flex w-full flex-col justify-center space-y-1">
              {["pick", "ban", "decider"].map((option) => (
                <label key={option} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value={option}
                    checked={veto.type === option}
                    onChange={(e) => {
                      const newType = e.target.value as
                        | "pick"
                        | "ban"
                        | "decider";
                      onVetoChange(index, "type", newType);
                      if (newType === "ban") {
                        handleMapEndToggle(false);
                      }
                    }}
                    name={`Type-${index}`}
                    className="form-radio text-primary"
                  />
                  <span>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </form>
        </td>
        <td className="px-6 py-4">
          <div className="w-full">
            <select
              className="w-auto min-w-[10rem] rounded-md border border-border bg-background-secondary px-3 py-2 text-base text-text disabled:cursor-not-allowed disabled:opacity-70"
              disabled={veto.type === "decider"}
              value={veto.type === "decider" ? "decider" : (veto.teamId ?? "")}
              onChange={(e) => onVetoChange(index, "teamId", e.target.value)}
              name={veto.type === "decider" ? "Decider" : "Team"}
            >
              <option value="" disabled>
                Team
              </option>
              {veto.type === "decider" && (
                <option value="decider">Decider</option>
              )}
              {leftTeamId && leftTeam && (
                <option value={leftTeamId}>{leftTeam.name}</option>
              )}
              {rightTeamId && rightTeam && (
                <option value={rightTeamId}>{rightTeam.name}</option>
              )}
            </select>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="w-full">
            <select
              className="w-auto min-w-[10rem] rounded-md border border-border bg-background-secondary px-3 py-2 text-base text-text"
              value={veto.mapName ?? ""}
              onChange={(e) => {
                onVetoChange(index, "mapName", e.target.value);
              }}
              name="Map"
            >
              <option value="" disabled>
                Map
              </option>
              {maps.map((map) => (
                <option key={map} value={map}>
                  {map.charAt(3).toUpperCase() + map.slice(4)}
                </option>
              ))}
            </select>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="grid grid-cols-3 gap-8">
            <div className="flex justify-center">
              {veto.type !== "ban" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={veto.mapEnd}
                    onChange={(e) => handleMapEndToggle(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="whitespace-nowrap text-sm">It's over</span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center">
              {veto.mapEnd && (
                <>
                  <div className="mb-2 font-medium">
                    {leftTeam?.name ?? "Team One"}
                  </div>
                  {renderResultColumn(leftTeamId, "team1")}
                </>
              )}
            </div>

            <div className="flex flex-col items-center">
              {veto.mapEnd && (
                <>
                  <div className="mb-2 font-medium">
                    {rightTeam?.name ?? "Team Two"}
                  </div>
                  {renderResultColumn(rightTeamId, "team2")}
                </>
              )}
            </div>
          </div>
        </td>
      </tr>
    );
  },
);
