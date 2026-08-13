// ============================================================================
// GroupedColumns.tsx — Columnas verticales agrupadas por categoría (ej.
// "matriculados vs completados por mes", "cohorte A vs cohorte B"). Mismo
// criterio que HorizontalBars.tsx: Server Component, HTML + CSS puro (cada
// columna es un <div> con "height: N%" dentro de un contenedor de alto
// fijo), UN SOLO EJE — todas las series comparten la misma escala (nunca
// dos ejes Y distintos, ver skill de dataviz). Con 2+ series se muestra
// leyenda (identidad nunca solo por color); con 1 sola no hace falta.
// ============================================================================

export interface ColumnSeries {
  key: string;
  label: string;
  /** var(--chart-1) / var(--chart-2) — SIEMPRE en ese orden fijo, ver globals.css. */
  color: string;
}

interface GroupedColumnsDatum {
  key: string;
  category: string;
  values: Record<string, number>;
}

export function GroupedColumns({
  data,
  series,
  valueFormatter = String,
  height = 160,
}: {
  data: GroupedColumnsDatum[];
  series: ColumnSeries[];
  valueFormatter?: (n: number) => string;
  height?: number;
}) {
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => d.values[s.key] ?? 0)));

  return (
    <>
      {series.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-muted">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 overflow-x-auto" style={{ height }}>
        {data.map((d) => (
          <div key={d.key} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <div className="flex h-full items-end gap-1">
              {series.map((s) => {
                const v = d.values[s.key] ?? 0;
                const pct = Math.max((v / max) * 100, v > 0 ? 2 : 0);
                return (
                  <div
                    key={s.key}
                    className="flex h-full w-4 flex-col justify-end"
                    title={`${d.category} · ${s.label}: ${valueFormatter(v)}`}
                  >
                    <div className="w-full rounded-t-sm" style={{ height: `${pct}%`, backgroundColor: s.color }} />
                  </div>
                );
              })}
            </div>
            <span className="max-w-[4.5rem] truncate text-center text-[10px] text-muted" title={d.category}>
              {d.category}
            </span>
          </div>
        ))}
      </div>

      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">-</th>
            {series.map((s) => (
              <th key={s.key} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.category}</th>
              {series.map((s) => (
                <td key={s.key}>{valueFormatter(d.values[s.key] ?? 0)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
