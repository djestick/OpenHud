import { useEffect, useState } from "react";
import { MdRemove, MdAdd, MdClose } from "react-icons/md";
import knifeImage from "../../assets/knifeRound.png";
import { PrimaryButton } from "../../components/PrimaryButton";
import { coachApi } from "./coachApi";
import { teamApi } from "../Teams/teamsApi";
import { apiUrl } from "../../api/api";
import { useMatches } from "../../hooks";

interface MatchCardProps {
  match: Match;
}

export const MatchCard = ({ match }: MatchCardProps) => {
  const { handleStopMatch } = useMatches();
  const [teamOne, setTeamOne] = useState<Team | null>(null);
  const [teamTwo, setTeamTwo] = useState<Team | null>(null);
  const [coaches, setCoaches] = useState<string[]>([]);
  const [coachInput, setCoachInput] = useState<string>("");

  useEffect(() => {
    const fetchTeamNames = async () => {
      try {
        if (match.left && match.left.id) {
          setTeamOne(await teamApi.getById(match.left.id));
        } else {
          setTeamOne(null);
        }
        if (match.right && match.right.id) {
          setTeamTwo(await teamApi.getById(match.right.id));
        } else {
          setTeamTwo(null);
        }
      } catch (error) {
        console.error("Error fetching team names:", error);
      }
    };
    fetchTeamNames();
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      const coaches = await coachApi.getAll();
      setCoaches(coaches);
    } catch (error) {
      console.error("Error fetching coaches", error);
    }
  };

  const handleAddCoach = async () => {
    try {
      await coachApi.create(coachInput);
      await fetchCoaches();
      setCoachInput("");
    } catch (error) {
      console.error("Error adding coach", error);
    }
  };

  const handleDeleteCoach = async (coachId: string) => {
    try {
      await coachApi.remove(coachId);
      await fetchCoaches();
    } catch (error) {
      console.error("Error deleting coach", error);
    }
  };

  return (
    <div className="relative flex flex-col bg-background-secondary p-6 rounded-lg shadow-md lg:flex-row">
      <div className="flex flex-auto flex-col items-center justify-center gap-4 p-4">
        <div className="flex flex-col items-center justify-center rounded-lg bg-background-primary px-16 py-8">
          <h1 className="text-4xl font-bold text-sky-500 md:text-5xl">
            MATCH LIVE
          </h1>
          <div id="Score" className="flex gap-8 mt-4">
            <div id="TeamOne" className="flex flex-col items-center gap-2">
              <img
                src={apiUrl + "/teams/logo/" + teamOne?._id}
                alt="Team Logo"
                className="w-16 h-16 rounded-full"
              />
              <h1 className="text-6xl font-bold text-green-500">
                {match.left.wins}
              </h1>
              <div className="inline-flex gap-2">
                <PrimaryButton>
                  <MdAdd />
                </PrimaryButton>
                <PrimaryButton>
                  <MdRemove />
                </PrimaryButton>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold">VS</h1>
              <h5 className="text-lg text-gray-500">{match.matchType}</h5>
            </div>
            <div id="TeamTwo" className="flex flex-col items-center gap-2">
              <img
                src={apiUrl + "/teams/logo/" + teamTwo?._id}
                alt="Team Logo"
                className="w-16 h-16 rounded-full"
              />
              <h1 className="text-6xl font-bold text-red-500">
                {match.right.wins}
              </h1>
              <div className="inline-flex gap-2">
                <PrimaryButton>
                  <MdAdd />
                </PrimaryButton>
                <PrimaryButton>
                  <MdRemove />
                </PrimaryButton>
              </div>
            </div>
          </div>
          <button 
          onClick={() => handleStopMatch(match.id)}
          className="mt-4 rounded bg-secondary px-6 py-2 font-semibold uppercase transition-colors hover:bg-secondary-dark">
            Stop Match
          </button>
          <div className="mt-6 flex flex-col items-center">
            <h5 className="text-lg font-semibold">Coaches</h5>
            <div className="flex gap-4 mt-2">
              <input
                className="h-10 w-48 rounded border border-gray-300 px-2"
                placeholder="SteamID"
                name="coaches"
                type="text"
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
              />
              <button
                className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
                onClick={handleAddCoach}
              >
                Add
              </button>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {coaches.map((coach, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="rounded-l-lg bg-gray-200 px-4 py-2">
                    {/* {coach} */}
                  </div>
                  <button
                    className="rounded-r-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                    onClick={() => handleDeleteCoach(coach)}
                  >
                    <MdClose />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <table className="flex-auto table-fixed mt-6">
        <thead className="border-b border-gray-300">
          <tr>
            <th className="p-2 text-sm text-gray-500" align="center">
              Team
            </th>
            <th className="p-2 text-sm text-gray-500" align="center">
              Type
            </th>
            <th className="p-2 text-sm text-gray-500" align="center">
              Map
            </th>
            <th className="p-2 text-sm text-gray-500" align="center">
              Side
            </th>
            <th className="p-2 text-sm text-gray-500" align="center">
              Winner
            </th>
            <th className="p-2 text-sm text-gray-500" align="center">
              Reverse Side
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.values(match.vetos)
            .filter((veto) => veto.teamId || veto.type === "decider")
            .map((veto, index) => (
              <tr key={index} className="border-b border-gray-300">
                <td className="p-2 text-lg font-semibold" align="center">
                  <img
                    src={
                      veto.teamId === teamOne?._id
                        ? apiUrl + "/teams/logo/" + teamOne?._id
                        : veto.teamId === teamTwo?._id
                        ? apiUrl + "/teams/logo/" + teamTwo?._id
                        : knifeImage
                    }
                    alt="team"
                    className="w-12 h-12 rounded-full"
                  />
                </td>
                <td className="p-2 text-lg font-semibold" align="center">
                  {veto.type}
                </td>
                <td className="p-2 text-lg font-semibold" align="center">
                  {veto.mapName.substring(3)}
                </td>
                <td className="p-2 text-lg font-semibold" align="center">
                  {veto.side === "NO" ? "" : veto.side}
                </td>
                <td className="p-2 text-lg font-semibold" align="center">
                  <form>
                    <select
                      className="rounded-md border border-gray-300 bg-white px-2 py-1"
                      value={veto.winner ? veto.winner : ""}
                    >
                      <option value="">None</option>
                      {teamOne?._id && (
                        <option value={teamOne._id}>{teamOne.name}</option>
                      )}
                      {teamTwo?._id && (
                        <option value={teamTwo._id}>{teamTwo.name}</option>
                      )}
                    </select>
                  </form>
                </td>
                <td className="p-2 text-lg font-semibold" align="center">
                  <input
                    type="checkbox"
                    className="h-5 w-5"
                    checked={veto.reverseSide === true}
                  />
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
