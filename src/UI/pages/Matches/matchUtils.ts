import { CSGO } from "csgogsi";

export const getMapNameFromGameData = (gameData: CSGO | null): string | null => {
  if (!gameData || !gameData.map || !gameData.map.name) return null;
  return gameData.map.name.substring(gameData.map.name.lastIndexOf("/") + 1);
};

export const canReverseSides = (match: Match, gameData: CSGO | null): boolean => {
  const mapName = getMapNameFromGameData(gameData);
  if (!mapName) return false;
  return !!match.vetos.find((v) => v.mapName === mapName);
};

export default canReverseSides;
