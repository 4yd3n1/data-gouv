import { fmt } from "@/lib/format";

interface TopOrg {
  nom: string;
  actions: number;
}

interface LobbyingDensityProps {
  actionCount: number;
  lobbyCount: number;
  topOrgs: TopOrg[];
  domainLabel: string;
}

export function LobbyingDensity({
  actionCount,
  lobbyCount,
  topOrgs,
  domainLabel,
}: LobbyingDensityProps) {
  if (actionCount === 0) {
    return (
      <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
        <p className="text-sm text-bureau-500">
          Aucune action de lobbying recensée dans ce domaine.
        </p>
      </div>
    );
  }

  const maxActions = topOrgs[0]?.actions ?? 1;

  return (
    <div className="rounded-xl border border-bureau-700/30 bg-bureau-800/20 p-5">
      {/* Summary */}
      <div className="flex items-baseline gap-3 mb-4">
        <span className="text-2xl font-bold text-amber">{fmt(actionCount)}</span>
        <span className="text-sm text-bureau-400">
          actions · <span className="text-bureau-300">{fmt(lobbyCount)} organisations</span>
        </span>
      </div>
      <p className="text-xs text-bureau-500 mb-4 uppercase tracking-widest">{domainLabel}</p>

      {/* Top orgs */}
      {topOrgs.length > 0 && (
        <div className="space-y-2.5">
          {topOrgs.map((org) => (
            <div key={org.nom}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-bureau-300 truncate max-w-[200px]">{org.nom}</span>
                <span className="text-xs text-bureau-500 shrink-0 ml-2">{fmt(org.actions)}</span>
              </div>
              <div className="h-1 rounded-full bg-bureau-700/40 overflow-hidden">
                <div
                  className="h-full bg-amber/40 rounded-full"
                  style={{ width: `${(org.actions / maxActions) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
