// ============================================================================
// ErrorBanner.tsx — Mensaje de error compartido por todas las pantallas.
//
// Se ve igual en dos situaciones distintas:
//   1) La pagina no pudo CARGAR datos (ej. el backend respondio 403 porque
//      el rol actual no tiene permiso para ver este curso).
//   2) Un formulario (matricular, emitir certificado...) fallo al ENVIARSE;
//      en ese caso el mensaje llega por la URL como "?error=..." (ver el
//      patron en cada actions.ts) porque una Server Action no puede
//      devolver un valor directo a la pagina sin convertir el formulario en
//      un Client Component — este approach mas simple alcanza para el
//      alcance actual del frontend.
// ============================================================================

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-bg px-4 py-3 text-sm text-danger"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        className="mt-0.5 h-5 w-5 shrink-0"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
      </svg>
      <p>{message}</p>
    </div>
  );
}
