import React from "react";

interface Props {
  veto: Veto | null | undefined;
  playersMap?: Record<string, string>;
}

export const CurrentMapRounds: React.FC<Props> = ({ veto, playersMap = {} }) => {
  if (!veto) return <p>No veto configured for current map</p>;

  return (
    <div className="min-w-80">
        <h5 className="font-semibold">Rounds for {veto.mapName}</h5>
        <div className="max-h-96 overflow-y-auto">
        {veto.rounds && veto.rounds.length ? (
            veto.rounds.map((round, i) => (
            <div key={i} className="mb-2 p-2 border rounded">
                <p className="font-semibold">Round {i + 1}</p>
                <p>Winner: {round?.winner ?? "-"}</p>
                <p>Win type: {round?.win_type ?? "-"}</p>
                {round && round.players ? (
                <div>
                    <p className="font-semibold">Players:</p>
                    <table>
                    <thead>
                        <tr>
                        <th className="p-2 border">Name</th>
                        <th className="p-2 border">Kills</th>
                        <th className="p-2 border">Damage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(round.players).map(([steamid, prd]) => (
                        <tr key={steamid}>
                            <td className="p-2 border">{playersMap[steamid] || steamid}</td>
                            <td className="p-2 border">{prd.kills}</td>
                            <td className="p-2 border">{prd.damage}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                ) : (
                <p>No player round data</p>
                )}
            </div>
            ))
        ) : (
            <p>No rounds yet for this map</p>
        )}
        </div>
    </div>
  );
};

export default CurrentMapRounds;
