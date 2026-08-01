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
    <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
      {message}
    </p>
  );
}
