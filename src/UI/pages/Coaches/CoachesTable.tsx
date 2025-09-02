import { MdDelete, MdEdit } from "react-icons/md";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useCoaches, } from "../../hooks";
import { Coach } from "./coachApi";
import { apiUrl } from "../../api/api";

interface CoachTableProps {
  onEdit: (coach: Coach) => void;
}

export const CoachesTable = ({ onEdit }: CoachTableProps) => {
  const { filteredCoaches } = useCoaches();
  return (
    <table className="table-fixed">
      <thead className="sticky top-16 border-b border-border bg-background-secondary shadow">
        <tr>
          <th className="p-4 text-sm" align="left">
            Name
          </th>
          <th className="p-4 text-sm" align="center">
            Team
          </th>
          <th className="p-4 text-sm" align="center">
            SteamID
          </th>
          <th className="p-4 text-sm" align="right">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border bg-background-secondary">
        {filteredCoaches.map((coach: Coach) => (
          <CoachRow key={coach.steamid} coach={coach} onEdit={onEdit} />
        ))}
      </tbody>
    </table>
  );
};

interface CoachRowProps {
  coach: Coach;
  onEdit: (coach: Coach) => void;
}

const CoachRow = ({ coach, onEdit }: CoachRowProps) => {
  const { deleteCoach } = useCoaches();


  const handleEditClick = () => {
    if (onEdit) {
      onEdit(coach);
    }
  };

  return (
    <tr id={"coach_" + coach.steamid}>
      <td className="px-4 py-2 text-xl font-semibold md:text-2xl" align="left">
        {coach.name || "Unnamed Coach"}
      </td>
      <td
        className="px-4 py-2 font-semibold uppercase text-gray-400"
        align="center"
      >
        {coach?.team && (
                  <img
                    src={apiUrl + "/teams/logo/" + coach.team}
                    alt="Team Logo"
                    className="size-12"
                  />
                )}
      </td>
      <td className="px-4 py-2 text-lg font-semibold" align="center">
        {coach.steamid}
      </td>
      <td className="px-4 py-2" align="right">
        <div className="inline-flex">
            <PrimaryButton onClick={() => handleEditClick()}>
              <MdEdit className="size-6" />
            </PrimaryButton>

            <PrimaryButton onClick={() => deleteCoach(coach.steamid)}>
              <MdDelete className="size-6" />
            </PrimaryButton>
          </div>
      </td>
    </tr>
  );
};
