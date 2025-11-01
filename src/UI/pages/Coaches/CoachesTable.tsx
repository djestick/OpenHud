import { MdDelete, MdEdit } from "react-icons/md";
import { PrimaryButton } from "../../components/PrimaryButton";
import { useCoaches } from "../../hooks";
import { Coach } from "./coachApi";
import { apiUrl } from "../../api/api";
import { PlayerSilhouette } from "../Players/PlayersPage";

interface CoachTableProps {
  onEdit: (coach: Coach) => void;
}

export const CoachesTable = ({ onEdit }: CoachTableProps) => {
  const { filteredCoaches } = useCoaches();
  return (
    <div className="relative flex-1 w-full overflow-y-auto">
      <table className="table-fixed w-full">
        <thead className="sticky top-0 border-b border-border bg-background-secondary shadow">
          <tr>
            <th className="p-4 text-sm" align="left">
              Avatar
            </th>
            <th className="p-4 text-sm" align="center">
              Username
            </th>
            <th className="p-4 text-sm" align="center">
              Name
            </th>
            <th className="p-4 text-sm" align="center">
              Country
            </th>
            <th className="p-4 text-sm" align="center">
              SteamID
            </th>
            <th className="p-4 text-sm" align="center">
              Team
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
    </div>
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

  const displayName = [coach.firstName, coach.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || coach.name || coach.username || "Unnamed Coach";

  const avatarSrc = coach.avatar
    ? `${apiUrl}/coach/avatar/${coach.steamid}?t=${coach.updatedAt ?? ""}`
    : PlayerSilhouette;

  return (
    <tr id={`coach_${coach.steamid}`}>
      <td className="px-4 py-2" align="left">
        <img
          src={avatarSrc}
          alt="Coach avatar"
          className="size-20 rounded object-cover"
        />
      </td>
      <td className="px-4 py-2 font-semibold" align="center">
        {coach.username || "-"}
      </td>
      <td className="px-4 py-2" align="center">
        {displayName}
      </td>
      <td className="px-4 py-2 font-semibold" align="center">
        {coach.country || "-"}
      </td>
      <td className="px-4 py-2 font-semibold" align="center">
        {coach.steamid}
      </td>
      <td className="px-4 py-2 font-semibold" align="center">
        {coach?.team ? (
          <img
            src={`${apiUrl}/teams/logo/${coach.team}`}
            alt="Team Logo"
            className="size-12"
          />
        ) : (
          "-"
        )}
      </td>
      <td className="px-4 py-2" align="right">
        <div className="inline-flex">
          <PrimaryButton onClick={handleEditClick}>
            <MdEdit className="size-5" />
          </PrimaryButton>

          <PrimaryButton onClick={() => deleteCoach(coach.steamid)}>
            <MdDelete className="size-5" />
          </PrimaryButton>
        </div>
      </td>
    </tr>
  );
};
