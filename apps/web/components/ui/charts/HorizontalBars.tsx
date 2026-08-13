// ============================================================================
// HorizontalBars.tsx — Gráfico de barras horizontales, UNA sola serie (ej.
// "cursos con más matrículas", "alumnos por cohorte"). Server Component
// normal (sin "use client"): HTML + CSS puro, cero JavaScript — cada barra
// es un <div> con "width: N%", nunca SVG medido a mano. Sigue el skill de
// dataviz: color SOLO en la marca (nunca en el texto), valor en el extremo,
// una sola serie no necesita leyenda (el título de la tarjeta ya dice qué
// se mide), y el tooltip nativo del navegador (atributo "title") sirve de
// capa de interacción sin JS.
// ============================================================================

interface HorizontalBarsDatum {
  key: string;
  label: string;
  value: number;
}

export function HorizontalBars({
  data,
  valueFormatter = String,
}: {
  data: HorizontalBarsDatum[];
  valueFormatter?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-3">
            <span className="w-28 shrink-0 truncate text-xs text-muted" title={d.label}>
              {d.label}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-black/[.05] dark:bg-white/[.08]">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%`, backgroundColor: 'var(--chart-1)' }}
                title={`${d.label}: ${valueFormatter(d.value)}`}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums">
              {valueFormatter(d.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Vista en tabla para lectores de pantalla (ver skill de dataviz,
         "a table view exists") — mismos datos, oculta visualmente. */}
      <table className="sr-only">
        <tbody>
          {data.map((d) => (
            <tr key={d.key}>
              <th scope="row">{d.label}</th>
              <td>{valueFormatter(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
