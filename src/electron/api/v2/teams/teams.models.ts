export class Team {
  _id: string;
  name: string;
  country: string;
  shortName: string;
  logo: string;
  last_updated: number;
  extra: string;

  constructor(
    _id: string,
    name: string,
    country: string,
    shortName: string,
    logo: string,
    last_updated: number,
    extra: string
  ) {
    this._id = _id;
    this.name = name;
    this.country = country;
    this.shortName = shortName;
    this.logo = logo;
    this.last_updated = last_updated;
    this.extra = extra;
  }
}
