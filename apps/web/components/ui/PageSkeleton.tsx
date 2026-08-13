// ============================================================================
// PageSkeleton.tsx — Lo que se ve MIENTRAS un Server Component todavía está
// pidiendo sus datos (ver app/(app)/loading.tsx y
// app/admin-plataforma/loading.tsx, que renderizan esto vía el
// "loading.tsx" de Next.js — Next envuelve automáticamente "{children}" del
// layout en un <Suspense> con esto como fallback, la barra lateral NUNCA
// desaparece mientras tanto).
//
// Antes de esto, cualquier pantalla que tardara un instante en responder
// (Reportes hace 6 llamadas en paralelo, ver reportes/page.tsx) se sentía
// "trabada": nada cambiaba en pantalla hasta que TODO llegaba de golpe. Un
// esqueleto simple no acorta la espera real, pero comunica "esto está
// cargando" de inmediato en vez de dejar la pantalla congelada.
//
// A propósito no imita cada pantalla pixel por pixel (seria un esqueleto
// distinto por ruta, mucho mantenimiento para poco beneficio real) — un
// bloque de título + un par de tarjetas cubre razonablemente bien la
// mayoría de las pantallas de negocio de esta app.
// ============================================================================

export function PageSkeleton() {
  return (
    <div className="animate-pulse" role="status" aria-label="Cargando…">
      <div className="mb-2 h-7 w-56 rounded-md bg-black/[.08] dark:bg-white/[.10]" />
      <div className="mb-8 h-4 w-80 max-w-full rounded-md bg-black/[.06] dark:bg-white/[.08]" />

      <div className="mb-4 h-32 rounded-xl border border-border bg-black/[.04] dark:bg-white/[.06]" />

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="h-10 border-b border-border bg-black/[.05] dark:bg-white/[.07]" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 border-b border-border bg-black/[.02] last:border-b-0 dark:bg-white/[.03]" />
        ))}
      </div>
    </div>
  );
}
