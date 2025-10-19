export const MatchTypes = ["bo1", "bo2", "bo3", "bo5"] as const;
export type MatchTypeKey = (typeof MatchTypes)[number];

export const maps = [
  "de_mirage",
  "de_cache",
  "de_inferno",
  "de_dust2",
  "de_train",
  "de_overpass",
  "de_nuke",
  "de_vertigo",
  "de_ancient",
  "de_anubis",
];

