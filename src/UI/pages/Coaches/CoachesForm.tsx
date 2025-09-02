import { useEffect, useState } from "react";
import {
  ButtonContained,
  Container,
  TextInput,
  Dialog,
} from "../../components";
import { useCoaches, useTeams } from "../../hooks";
import { Coach } from "./coachApi";

interface CoachFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const CoachForm = ({ open, setOpen }: CoachFormProps) => {
  const {
    createCoach,
    updateCoach,
    selectedCoach,
    isEditing,
    setIsEditing,
    setSelectedCoach,
  } = useCoaches();
  const { teams } = useTeams();

  const [steamid, setSteamId] = useState("");
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [steamidError, setSteamIdError] = useState("");
  const [steamidFormatError, setSteamIdFormatError] = useState("");

  useEffect(() => {
    if (isEditing && selectedCoach) {
      // Update form fields when selectedCoach prop changes
      setSteamId(selectedCoach.steamid);
      setName(selectedCoach.name || "");
      setTeam(selectedCoach.team || "");
    } else {
      handleReset();
    }
  }, [isEditing, selectedCoach]);

  const validateForm = () => {
    let isValid = true;
    setSteamIdError("");
    setSteamIdFormatError("");

    if (!steamid) {
      setSteamIdError("SteamID64 is required");
      isValid = false;
    } else if (!/^\d{17}$/.test(steamid)) {
      setSteamIdFormatError("SteamID64 must be 17 digits long");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return; // Early return if validation fails

    setIsSubmitting(true);
    const coach: Coach = {
      steamid: steamid,
      name: name,
      team: team
    }
  
    try {
      if (isEditing && selectedCoach) {
        await updateCoach(selectedCoach.steamid, coach);
      } else if (createCoach) {
        await createCoach(coach); 
      }
      await createCoach(coach); 
    } catch (error) {
      console.error("Error submitting coach:", error);
    } finally {
      setOpen(false);
      handleReset();
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    handleReset(); // Reset form fields
    setOpen(false);
  };

  const handleReset = () => {
    setIsEditing(false);
    setSelectedCoach(null);
    setName("");
    setSteamId("");
    setTeam("");
    setSteamIdError("");
    setSteamIdFormatError("");
  };

  return (
    <Dialog onClose={handleCancel} open={open}>
      <h1>{isEditing && "Editing"}</h1>
      <div className="flex flex-1 border-b border-border">
        <h3 className="px-6 py-4 font-semibold">
          {isEditing ? `Updating: ${name}` : "Create Coach"}
        </h3>
      </div>
      <Container>
        <div className="grid w-full flex-1 grid-cols-2 gap-4 overflow-y-scroll p-6">
          <TextInput
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextInput
            label="SteamID64"
            value={steamid}
            onChange={(e) => setSteamId(e.target.value)}
            required
            error={!!steamidError || !!steamidFormatError} // Set error state based on steamidError or steamidFormatError
            errorMessage={steamidError || steamidFormatError} // Show error message below field
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
            <ButtonContained color="secondary" onClick={handleCancel}>
              Cancel
            </ButtonContained>
          )}
        </div>
      </div>
    </Dialog>
  );
};
