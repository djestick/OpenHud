import { ReactElement } from "react";

interface TileProps {
  title?: string;
  body: ReactElement;
}

export const Tile = ({ title, body }: TileProps) => {
  return (
    <div className="flex flex-col gap-2 rounded bg-background-secondary p-4">
      {title && <h4 className="font-semibold">{title}</h4>}
      <div className="grid grid-cols-2 gap-5">{body}</div>
    </div>
  );
};
