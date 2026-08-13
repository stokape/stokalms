// ============================================================================
// SuccessBanner.tsx — El mensaje verde de "guardado con éxito" que antes
// estaba copiado y pegado (con leves variaciones) en 9 pantallas distintas.
// Dos cosas nuevas respecto a esas copias sueltas:
//
//   1) "role=status"/"aria-live=polite" — un lector de pantalla lo anuncia
//      solo (antes, alguien que no ve la pantalla no se enteraba de que su
//      "Guardar" funcionó, a menos que el foco ya estuviera justo ahí).
//   2) Se desvanece solo a los ~4.5s (clase "success-banner", ver
//      globals.css) — sensación de "toast" sin agregar NINGÚN JavaScript
//      de cliente: es una animación CSS con "animation-fill-mode: forwards"
//      que además colapsa su alto, así que no deja un hueco vacío
//      ocupando espacio después de desvanecerse. Respeta
//      "prefers-reduced-motion" (ver globals.css): con esa preferencia
//      activada, el aviso simplemente se queda fijo en vez de animarse.
//
// A propósito NO se saca del DOM con un timer de JavaScript (la alternativa
// "toast" más común): eso exigiría convertir cada una de las 9 pantallas en
// Client Component solo para esto. El mensaje de ERROR (ver
// ErrorBanner.tsx) es la excepción: ese SÍ debe quedarse fijo, porque puede
// pedir una acción de la persona, no es una confirmación de "ya está".
// ============================================================================

export function SuccessBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="success-banner mb-6 rounded-lg border border-success/30 bg-success-bg p-4 text-sm text-success"
    >
      {children}
    </div>
  );
}
