export class Match {
  _id: string;
  team1: string;
  team2: string;
  score: [number, number];
  status: "waiting" | "in_progress" | "finished";
  last_updated: number;

  constructor(
    _id: string,
    team1: string,
    team2: string,
    score: [number, number],
    status: "waiting" | "in_progress" | "finished",
    last_updated: number
  ) {
    this._id = _id;
    this.team1 = team1;
    this.team2 = team2;
    this.score = score;
    this.status = status;
    this.last_updated = last_updated;
  }
}
