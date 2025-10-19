import { useEffect, useState } from "react";
import { MatchTypes, MatchTypeKey } from "./matchConstants";
import { VetoRow } from "./VetoRow";
import { ButtonContained, Container, Dialog } from "../../components";
import { useMatches } from "./useMatches";
import { useTeams } from "../../hooks";

interface MatchFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

type VetoType = Veto["type"];

const VETO_CONFIG: Record<MatchTypeKey, VetoType[]> = {
  bo1: ["ban", "ban", "ban", "ban", "ban", "ban", "decider"],
  bo3: ["ban", "ban", "pick", "pick", "ban", "ban", "decider"],
  bo5: ["pick", "pick", "pick", "pick", "decider"],
};

const MATCH_TYPES: readonly MatchTypeKey[] = MatchTypes;
const DEFAULT_MATCH_TYPE: MatchTypeKey = MATCH_TYPES[0];
const FALLBACK_MATCH_TYPE: MatchTypeKey =
  MATCH_TYPES[1] ?? DEFAULT_MATCH_TYPE;

const createEmptyVeto = (type: VetoType): Veto => ({
  teamId: "",
  mapName: "",
  side: "NO",
  type,
  mapEnd: false,
  reverseSide: false,
});

const buildDefaultVetos = (matchType: MatchTypeKey): Veto[] =>
  VETO_CONFIG[matchType].map((type) => createEmptyVeto(type));

export const MatchForm = ({ open, setOpen }: MatchFormProps) => {
  const {
    isEditing,
    selectedMatch,
    setCurrentMatch,
    createMatch,
    updateMatch,
    setIsEditing,
    setSelectedMatch
  } = useMatches();
  const { teams } = useTeams();

  const [matchType, setMatchType] = useState<MatchTypeKey>(DEFAULT_MATCH_TYPE);
  const [leftTeamId, setLeftTeamId] = useState<string | null>(null);
  const [leftTeamWins, setLeftTeamWins] = useState<number>(0);
  const [rightTeamId, setRightTeamId] = useState<string | null>(null);
  const [rightTeamWins, setRightTeamWins] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(""); // Added for error message
  const [vetos, setVetos] = useState<Veto[]>(() => buildDefaultVetos(DEFAULT_MATCH_TYPE));
  const [autoTeamsFirst, setAutoTeamsFirst] = useState<"left" | "right">("left");

  const leftTeam = teams.find((team) => team._id === leftTeamId);
  const rightTeam = teams.find((team) => team._id === rightTeamId);

  useEffect(() => {
    if (isEditing && selectedMatch) {
      setLeftTeamId(selectedMatch.left.id);
      setRightTeamId(selectedMatch.right.id);
      setLeftTeamWins(selectedMatch.left.wins);
      setRightTeamWins(selectedMatch.right.wins);
      const maybeType = selectedMatch.matchType as MatchTypeKey;
      const safeType = MATCH_TYPES.includes(maybeType)
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

  const validateForm = () => {
    let isValid = true;
    setErrorMessage("");

    if (!leftTeamId || !rightTeamId) {
      setErrorMessage("Please select both teams.");
      isValid = false;
    }

    if (!MATCH_TYPES.includes(matchType)) {
      setErrorMessage("Invalid match type selected.");
      isValid = false;
    }

    return isValid;
  };

  const handleVetoChange = (index: number, key: keyof Veto, value: any) => {
    const updatedVetos = [...vetos];
    updatedVetos[index] = { ...updatedVetos[index], [key]: value };
    setVetos(updatedVetos);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const newMatch: Match = {
      id: selectedMatch?.id || "",
      left: { id: leftTeamId, wins: leftTeamWins },
      right: { id: rightTeamId, wins: rightTeamWins },
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
    setLeftTeamWins(0);
    setRightTeamWins(0);
    setErrorMessage("");
    setAutoTeamsFirst("left");
    setVetos(buildDefaultVetos(DEFAULT_MATCH_TYPE));
  };

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

  const vetoSource = vetos;

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
        <div className="flex flex-1 flex-col overflow-y-scroll p-6">
          <div className="my-2 flex items-center justify-center gap-4">
            <div className="bg-background-primary">
              <select
                className="min-w-[12rem] w-auto rounded-md border border-border bg-background-secondary px-3 py-2 text-base text-text"
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
                className="min-w-[12rem] w-auto rounded-md border border-border bg-background-secondary px-3 py-2 text-base text-text"
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

          <div className="my-2 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Left Wins</label>
              <input
                type="number"
                min={0}
                className="h-8 w-20 rounded border border-gray-300 px-2"
                value={leftTeamWins}
                onChange={(e) => setLeftTeamWins(Number(e.target.value || 0))}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Right Wins</label>
              <input
                type="number"
                min={0}
                className="h-8 w-20 rounded border border-gray-300 px-2"
                value={rightTeamWins}
                onChange={(e) => setRightTeamWins(Number(e.target.value || 0))}
              />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <form className="flex flex-col items-center justify-center gap-2 rounded-md bg-background-primary p-3">
              <label
                htmlFor="Match Type"
                className="text-sm font-semibold uppercase text-gray-400"
              >
                Best of
              </label>
              <select
                className="min-w-[8rem] w-auto rounded-md border border-border bg-background-secondary px-3 py-2 text-base text-text"
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
          <table className="min-w-full divide-y divide-slate-400">
            <thead className="bg-background-secondary">
              <tr>
                <TableTH title="veto" />
                <TableTH title="type" />
                <TableTH title="Team" />
                <TableTH title="Map" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 p-4">
              {vetoSource.map((veto, index) => (
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
