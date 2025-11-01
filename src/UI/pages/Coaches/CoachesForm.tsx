import { useCallback, useEffect, useState } from "react";
import {
  ButtonContained,
  Container,
  TextInput,
  Dialog,
} from "../../components";
import { countries } from "../../api/countries";
import { useCoaches, useTeams } from "../../hooks";
import { usePlayers } from "../Players/usePlayers";
import { coachApi } from "./coachApi";
import { apiUrl } from "../../api/api";

export interface CoachFormPrefill {
  username?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  steamId?: string;
  teamId?: string;
  country?: string;
}

interface CoachFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  prefill?: CoachFormPrefill;
}

export const CoachForm = ({ open, setOpen, prefill }: CoachFormProps) => {
  const {
    createCoach,
    updateCoach,
    selectedCoach,
    isEditing,
    setIsEditing,
    setSelectedCoach,
    fetchCoaches,
  } = useCoaches();
  const { teams } = useTeams();
  const { fetchPlayers } = usePlayers();

  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [steamId, setSteamId] = useState("");
  const [team, setTeam] = useState("");
  const [country, setCountry] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatar, setAvatar] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [steamIdError, setSteamIdError] = useState("");
  const [steamIdFormatError, setSteamIdFormatError] = useState("");

  const clearFormFields = useCallback(() => {
    setUsername("");
    setFirstName("");
    setLastName("");
    setSteamId("");
    setTeam("");
    setCountry("");
    setAvatarFile(null);
    setAvatar("");
    setUsernameError("");
    setSteamIdError("");
    setSteamIdFormatError("");
  }, []);

  useEffect(() => {
    if (isEditing && selectedCoach) {
      setUsername(selectedCoach.username ?? "");
      setFirstName(selectedCoach.firstName ?? "");
      setLastName(selectedCoach.lastName ?? "");
      setSteamId(selectedCoach.steamid ?? "");
      setTeam(selectedCoach.team ?? "");
      setCountry(selectedCoach.country ?? "");
      setAvatar(selectedCoach.avatar ?? "");
      setAvatarFile(null);
      setUsernameError("");
      setSteamIdError("");
      setSteamIdFormatError("");
    } else if (open && prefill) {
      const derivedName = prefill.name ?? "";
      const derivedFirst = prefill.firstName ?? derivedName.split(" ")[0] ?? "";
      const derivedLast =
        prefill.lastName ??
        (derivedName
          .split(" ")
          .slice(1)
          .join(" ") || "");

      setUsername(prefill.username ?? derivedName ?? "");
      setFirstName(derivedFirst.trim());
      setLastName(derivedLast.trim());
      setSteamId(prefill.steamId ?? "");
      setTeam(prefill.teamId ?? "");
      setCountry(prefill.country ?? "");
      setAvatarFile(null);
      setAvatar("");
      setUsernameError("");
      setSteamIdError("");
      setSteamIdFormatError("");
    } else if (!isEditing && !prefill && open) {
      clearFormFields();
    }
  }, [isEditing, selectedCoach, open, prefill, clearFormFields]);

  const validateForm = () => {
    let isValid = true;
    setUsernameError("");
    setSteamIdError("");
    setSteamIdFormatError("");

    if (!username) {
      setUsernameError("Username is required");
      isValid = false;
    }

    if (!steamId) {
      setSteamIdError("SteamID64 is required");
      isValid = false;
    } else if (!/^\d{17}$/.test(steamId)) {
      setSteamIdFormatError("SteamID64 must be 17 digits long");
      isValid = false;
    }

    return isValid;
  };

  const buildFormData = () => {
    const formData = new FormData();
    formData.append("steamid", steamId);
    formData.append("username", username);
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("name", `${firstName} ${lastName}`.trim());
    formData.append("country", country);
    formData.append("team", team);

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    } else if (isEditing && avatar) {
      formData.append("avatar", avatar);
    }

    return formData;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const formData = buildFormData();
      if (isEditing && selectedCoach) {
        await updateCoach(selectedCoach.steamid, formData);
      } else {
        await createCoach(formData);
      }
      handleReset();
      setOpen(false);
    } catch (error) {
      console.error("Error submitting coach:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsEditing(false);
    setSelectedCoach(null);
    clearFormFields();
  };

  const handleCancel = () => {
    handleReset();
    setOpen(false);
  };

  const handleConvertToPlayer = async () => {
    if (!selectedCoach) {
      console.log("No selected coach");
      return;
    }

    console.log("Converting coach to player:", selectedCoach.steamid);

    try {
      await coachApi.convertToPlayer(selectedCoach.steamid);
      console.log("Coach converted to player successfully");
      fetchCoaches();
      fetchPlayers();
      // Optionally, you can add some notification to the user
      setOpen(false);
      handleReset();
    } catch (error) {
      console.error("Error converting coach to player:", error);
    }
  };

  return (
    <Dialog onClose={handleCancel} open={open}>
      <h1>{isEditing && "Editing"}</h1>
      <div className="flex flex-1 border-b border-border">
        <h3 className="px-6 py-4 font-semibold">
          {isEditing ? `Updating: ${selectedCoach?.name ?? username}` : "Create Coach"}
        </h3>
      </div>
      <Container>
        <div className="grid w-full flex-1 grid-cols-2 gap-4 overflow-y-scroll p-6">
          <TextInput
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            error={!!usernameError}
            errorMessage={usernameError}
          />
          <TextInput
            label="SteamID64"
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            required
            error={!!steamIdError || !!steamIdFormatError}
            errorMessage={steamIdError || steamIdFormatError}
          />
          <TextInput
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextInput
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <div>
            <label htmlFor="team" className="mb-2 block font-medium text-text">
              Team
            </label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              name="Team"
            >
              <option value="" className="p-4 text-text">
                Team
              </option>
              {teams.map((teamOption) => (
                <option
                  key={teamOption._id}
                  value={teamOption._id}
                  className="p-4 text-text"
                >
                  {teamOption.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="mb-2 block font-medium">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="">Country</option>
              {Object.entries(countries).map(([key, value]) => (
                <option key={key} value={key}>
                  {value as string}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label
              htmlFor="coach-avatar"
              className="mb-2 block font-medium text-text"
            >
              Avatar
            </label>
            <div className="flex flex-col items-start gap-4">
              {isEditing && selectedCoach?.avatar && selectedCoach.steamid && (
                <img
                  src={`${apiUrl}/coach/avatar/${selectedCoach.steamid}?t=${selectedCoach.updatedAt ?? ""}`}
                  alt="Current Avatar"
                  className="size-36 rounded border object-cover"
                />
              )}

              <input
                type="file"
                id="coach-avatar"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => document.getElementById("coach-avatar")?.click()}
                className="rounded bg-primary px-4 py-2 text-white transition-colors hover:bg-primary-dark"
              >
                Upload Avatar
              </button>

              {avatarFile && (
                <span className="text-sm text-gray-500">{avatarFile.name}</span>
              )}
            </div>
          </div>
        </div>
      </Container>
      <div className="inline-flex w-full justify-end gap-2 border-t border-border p-2">
        <div className="mt-1 flex justify-end gap-1">
          {isSubmitting ? (
            <ButtonContained disabled>Submitting...</ButtonContained>
          ) : (
            <ButtonContained onClick={handleSubmit}>Submit</ButtonContained>
          )}
          <ButtonContained onClick={handleReset}>Reset</ButtonContained>
          {isEditing && (
            <>
            <ButtonContained onClick={handleConvertToPlayer}>
              Convert to Player
            </ButtonContained>
            <ButtonContained color="secondary" onClick={handleCancel}>
              Cancel
            </ButtonContained>
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
};
