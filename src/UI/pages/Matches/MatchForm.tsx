import { useEffect, useMemo, useState } from "react";
import {
  MatchTypes,
  MatchTypeKey,
  DEFAULT_MATCH_TYPE,
  FALLBACK_MATCH_TYPE,
  VETO_CONFIG,
  Veto,
  Match,
  buildDefaultVetos,
  createEmptyVeto,
  calculateSeriesWins,
} from "./matchConstants";
import { VetoRow } from "./VetoRow";
import { ButtonContained, Container, Dialog } from "../../components";
import { useMatches } from "./useMatches";
import { useTeams } from "../../hooks";

interface MatchFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const MatchForm = ({ open, setOpen }: MatchFormProps) => {
  const {
    isEditing,
    selectedMatch,
    setCurrentMatch,
    createMatch,
    updateMatch,
    setIsEditing,
    setSelectedMatch,
  } = useMatches();
  const { teams } = useTeams();

  const [matchType, setMatchType] = useState<MatchTypeKey>(DEFAULT_MATCH_TYPE);
  const [leftTeamId, setLeftTeamId] = useState<string | null>(null);
  const [rightTeamId, setRightTeamId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [vetos, setVetos] = useState<Veto[]>(() =>
    buildDefaultVetos(DEFAULT_MATCH_TYPE),
  );
  const [autoTeamsFirst, setAutoTeamsFirst] = useState<"left" | "right">(
    "left",
  );

  const leftTeam = teams.find((team) => team._id === leftTeamId);
  const rightTeam = teams.find((team) => team._id === rightTeamId);
  const seriesWins = useMemo(
    () => calculateSeriesWins(vetos, leftTeamId, rightTeamId),
    [vetos, leftTeamId, rightTeamId],
  );
  const winsForSubmit = seriesWins.hasResults
    ? seriesWins
    : {
        left: selectedMatch?.left.wins ?? 0,
        right: selectedMatch?.right.wins ?? 0,
      };

  useEffect(() => {
    if (isEditing && selectedMatch) {
      setLeftTeamId(selectedMatch.left.id);
      setRightTeamId(selectedMatch.right.id);
      const maybeType = selectedMatch.matchType as MatchTypeKey;
      const safeType = MatchTypes.includes(maybeType)
        ? maybeType
        : FALLBACK_MATCH_TYPE;
      setMatchType(safeType);
      setCurrentMatch(selectedMatch);
      setVetos(selectedMatch.vetos);
    } else {
      handleReset();
    }
  }, [isEditing, selectedMatch]);

  useEffect(() => {
    setVetos((prevVetos) => {
      const config = VETO_CONFIG[matchType];
      return config.map((type, index) => {
        const existing = prevVetos[index];
        if (existing) {
          return { ...existing, type };
        }
        return createEmptyVeto(type);
      });
    });
  }, [matchType]);

  const handleAutoAssignTeams = () => {
    if (!leftTeamId || !rightTeamId) {
      setErrorMessage("Please select both teams before auto assigning vetos.");
      return;
    }

    setErrorMessage("");

    const startsWithLeft = autoTeamsFirst === "left";
    const firstTeamId = startsWithLeft ? leftTeamId : rightTeamId;
    const secondTeamId = startsWithLeft ? rightTeamId : leftTeamId;
    const config = VETO_CONFIG[matchType];

    setVetos((prevVetos) =>
      config.map((type, index) => {
        const existing = prevVetos[index] ?? createEmptyVeto(type);
        const assignedTeam =
          type === "decider"
            ? ""
            : index % 2 === 0
              ? firstTeamId
              : secondTeamId;

        return {
          ...existing,
          type,
          teamId: assignedTeam,
        };
      }),
    );

    setAutoTeamsFirst(startsWithLeft ? "right" : "left");
  };

  const validateForm = () => {
    setErrorMessage("");

    if (!leftTeamId || !rightTeamId) {
      setErrorMessage("Please select both teams.");
      return false;
    }

    if (!MatchTypes.includes(matchType)) {
      setErrorMessage("Invalid match type selected.");
      return false;
    }

    for (let i = 0; i < vetos.length; i++) {
      const veto = vetos[i];
      if (!veto.mapEnd) continue;

      const leftScore = veto.score?.[leftTeamId];
      const rightScore = veto.score?.[rightTeamId];

      // First check if we have a winner selected
      if (
        !veto.winner ||
        (veto.winner !== leftTeamId && veto.winner !== rightTeamId)
      ) {
        setErrorMessage(`Choose the winner for Veto ${i + 1}.`);
        return false;
      }

      // Only check scores if they're provided and there's no winner
      const hasScores =
        typeof leftScore === "number" || typeof rightScore === "number";
      if (
        hasScores &&
        (typeof leftScore !== "number" || typeof rightScore !== "number")
      ) {
        setErrorMessage(`Enter both scores for Veto ${i + 1}.`);
        return false;
      }
    }

    return true;
  };

  const handleVetoChange = (
    index: number,
    key: keyof Veto,
    value: Veto[keyof Veto] | undefined,
  ) => {
    setVetos((prevVetos) => {
      const updatedVetos = [...prevVetos];
      updatedVetos[index] = { ...updatedVetos[index], [key]: value };
      return updatedVetos;
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const newMatch: Match = {
      id: selectedMatch?.id || "",
      left: { id: leftTeamId, wins: winsForSubmit.left },
      right: { id: rightTeamId, wins: winsForSubmit.right },
      matchType,
      current: selectedMatch ? selectedMatch.current : false,
      vetos: vetos,
    };

    try {
      if (isEditing && selectedMatch) {
        await updateMatch(selectedMatch.id, newMatch);
      } else if (createMatch) {
        await createMatch(newMatch);
      }
    } catch (error) {
      console.error("Error creating/updating match:", error);
    } finally {
      setOpen(false);
      handleReset();
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    handleReset();
    setOpen(false);
  };

  const handleReset = () => {
    setIsEditing(false);
    setSelectedMatch(null);
    setLeftTeamId(null);
    setRightTeamId(null);
    setCurrentMatch(null);
    setMatchType(DEFAULT_MATCH_TYPE);
    setErrorMessage("");
    setAutoTeamsFirst("left");
    setVetos(buildDefaultVetos(DEFAULT_MATCH_TYPE));
  };

  return (
    <Dialog onClose={handleCancel} open={open}>
      <div className="flex flex-1 border-b border-border">
        <h3 className="px-6 py-4 font-semibold">
          {isEditing
            ? `Updating: ${leftTeam?.name} vs ${rightTeam?.name}`
            : "Create Match"}
        </h3>
      </div>
      <Container>
        <div
          className="flex flex-1 flex-col overflow-y-scroll p-6"
          style={{ scrollbarWidth: "none" }}
        >
          {leftTeamId && rightTeamId && (
            <div className="mb-6 flex flex-wrap items-center justify-center gap-6 text-lg font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">
                  {leftTeam?.name ?? "Team one"}
                </span>
                <span className="rounded bg-background-secondary px-3 py-1 text-xl">
                  {winsForSubmit.left}
                </span>
              </div>
              <span className="text-xl font-bold text-text-secondary">-</span>
              <div className="flex items-center gap-2">
                <span className="rounded bg-background-secondary px-3 py-1 text-xl">
                  {winsForSubmit.right}
                </span>
                <span className="text-text-secondary">
                  {rightTeam?.name ?? "Team two"}
                </span>
              </div>
            </div>
          )}

          <div className="my-2 flex items-center justify-center gap-4">
            <div className="bg-background-primary">
              <select
                className="w-auto min-w-[12rem] rounded-md border border-border bg-background-secondary px-3 py-2 text-base text-text"
                value={leftTeamId || ""}
                onChange={(e) => setLeftTeamId(e.target.value)}
                name="Team One"
              >
                <option>Team One</option>
                {teams.map((team) => (
                  <option
                    key={team._id}
                    value={team._id}
                    className="p-4 text-text"
                  >
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <h2 className="font-semibold">VS</h2>

            <div className="bg-background-primary">
              <select
                className="w-auto min-w-[12rem] rounded-md border border-border bg-background-secondary px-3 py-2 text-base text-text"
                value={rightTeamId || ""}
                onChange={(e) => setRightTeamId(e.target.value)}
                name="Team Two"
              >
                <option>Team Two</option>
                {teams.map((team) => (
                  <option
                    key={team._id}
                    value={team._id}
                    className="p-4 text-text"
                  >
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <form className="flex flex-col items-center justify-center bg-background-primary">
              <label
                htmlFor="Match Type"
                className="text-sm font-semibold uppercase text-gray-400"
              >
                Best of
              </label>
              <select
                className="w-auto min-w-[8rem] rounded-md border border-border bg-background-secondary px-3 py-2 text-base text-text"
                value={matchType}
                onChange={(e) => setMatchType(e.target.value as MatchTypeKey)}
                name="Match Type"
              >
                {MatchTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </form>
            <ButtonContained type="button" onClick={handleAutoAssignTeams}>
              Auto teams
            </ButtonContained>
          </div>

          <h5 className="mt-4 font-semibold">Set Vetos:</h5>
          <div className="w-full overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-400">
              <thead className="bg-background-secondary">
                <tr>
                  <TableTH title="Veto" />
                  <TableTH title="Type" />
                  <TableTH title="Team" />
                  <TableTH title="Map" />
                  <TableTH title="Status" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 p-4">
                {vetos.map((veto, index) => (
                  <VetoRow
                    key={index}
                    index={index}
                    veto={veto}
                    leftTeamId={leftTeamId}
                    rightTeamId={rightTeamId}
                    teams={teams}
                    onVetoChange={handleVetoChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Container>
      <div className="inline-flex w-full justify-end gap-2 border-t border-border p-2">
        {errorMessage && (
          <p className="my-1 text-end text-red-500">{errorMessage}</p>
        )}
        <div className="mt-1 flex justify-end gap-1">
          {isSubmitting ? (
            <ButtonContained disabled>Submitting...</ButtonContained>
          ) : (
            <ButtonContained onClick={handleSubmit}>Submit</ButtonContained>
          )}
          <ButtonContained onClick={handleReset}>Reset</ButtonContained>
          {isEditing && (
            <ButtonContained color="secondary" onClick={handleCancel}>
              Cancel
            </ButtonContained>
          )}
        </div>
      </div>
    </Dialog>
  );
};

interface TableTHProps {
  title: string;
}

const TableTH: React.FC<TableTHProps> = ({ title }) => {
  return (
    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-400">
      {title}
    </th>
  );
};
