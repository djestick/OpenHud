import { MdDelete, MdEdit } from "react-icons/md";
import { useTeams } from "./useTeams";
import { PrimaryButton } from "../../components/PrimaryButton";
import { apiUrl } from "../../api/api";

interface TeamsTableProps {
  onEdit: (team: Team) => void;
}

export const TeamsTable = ({ onEdit }: TeamsTableProps) => {
  const { filteredTeams, deleteTeam } = useTeams();
  return (
    <table className="table-fixed">
      <thead className="sticky top-16 border-b border-border bg-background-secondary shadow">
        <tr>
          <th className="p-4 text-sm" align="left">
            Logo
          </th>
          <th className="p-4 text-sm" align="center">
            Name
          </th>
          <th className="p-4 text-sm" align="center">
            Short Name
          </th>
          <th className="p-4 text-sm" align="center">
            Country
          </th>
          <th className="p-4 text-sm" align="right">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border bg-background-secondary">
        {filteredTeams.map((team: Team, index) => (
          <TeamRow
            key={index}
            team={team}
            onEdit={onEdit}
            deleteTeam={deleteTeam}
          />
        ))}
      </tbody>
    </table>
  );
};

interface TeamRowProps {
  team: Team;
  onEdit: (team: Team) => void;
  deleteTeam: (id: string) => void;
}

const TeamRow = ({ team, onEdit, deleteTeam }: TeamRowProps) => {
  const handleEditClick = () => {
    if (onEdit) {
      onEdit(team); // Call onEdit prop function if provided
    }
  };

  return (
    <tr id={"team_" + team._id}>
      <td className="px-4 py-2" align="left">
        <img
          src={apiUrl + "/teams/logo/" + team._id}
          alt="Team Logo"
          className="size-12"
        />
      </td>
      <td className="px-4 py-2 text-lg font-semibold" align="center">
        {team.name}
      </td>
      <td className="px-4 py-2" align="center">
        {team.shortName}
      </td>
      <td className="px-4 py-2 font-semibold" align="center">
        {team.country}
      </td>
      <td className="px-4 py-2" align="right">
        <div className="inline-flex">
          <PrimaryButton onClick={() => handleEditClick()}>
            <MdEdit className="size-5" />
          </PrimaryButton>

          <PrimaryButton onClick={() => deleteTeam(team._id)}>
            <MdDelete className="size-5" />
          </PrimaryButton>
        </div>
      </td>
    </tr>
  );
};
