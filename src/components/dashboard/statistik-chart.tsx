export type StatistikBar = { label: string; persenTuntas: number; tuntas: number; belumTuntas: number };

/** Proporsi peserta tuntas (semua indikator terisi) vs belum, per program — 1 batang = 100% peserta program itu. */
export function StatistikChart({ data }: { data: StatistikBar[] }) {
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Belum ada data.</p>;

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-emerald-600" /> Tuntas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/30" /> Belum tuntas
        </span>
      </div>

      <div className="flex h-40 items-end gap-3">
        {data.map((d) => (
          <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div
              className="grid w-full max-w-10 grid-rows-[1fr_auto] gap-0.5 rounded-sm"
              style={{ height: "100%" }}
              title={`${d.label}: ${d.tuntas} tuntas, ${d.belumTuntas} belum tuntas`}
            >
              <div className="flex flex-col justify-end overflow-hidden rounded-t-sm bg-muted-foreground/20">
                <div className="rounded-t-sm bg-emerald-600" style={{ height: `${d.persenTuntas}%` }} />
              </div>
            </div>
            <p className="w-full truncate text-center text-[0.65rem] text-muted-foreground">{d.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
