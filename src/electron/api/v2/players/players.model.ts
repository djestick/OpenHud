export class Player {
  _id: string;
  name: string;
  steamid: string;
  team: string;
  last_updated: number;

  constructor(
    _id: string,
    name: string,
    steamid: string,
    team: string,
    last_updated: number
  ) {
    this._id = _id;
    this.name = name;
    this.steamid = steamid;
    this.team = team;
    this.last_updated = last_updated;
  }
}
