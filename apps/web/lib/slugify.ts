// ============================================================================
// slugify.ts — Convierte "Instituto San Martín" en "instituto-san-martin":
// minúsculas, sin tildes/diéresis (normalize + quitar los diacríticos que
// separa), cualquier caracter que no sea letra/número pasa a guión, guiones
// repetidos o en las puntas se colapsan. Tope de 40 (mismo limite que
// create-tenant-registration.dto.ts en el backend).
//
// Compartido entre RegistrationForm.tsx (formulario público de inscripción)
// y admin-plataforma/instituciones/nueva (alta directa por un administrador
// de plataforma) — mismo comportamiento en los dos lugares donde se sugiere
// un subdominio a partir de un nombre.
// ============================================================================

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    // Marcas diacriticas combinantes (tildes, diéresis...) que "normalize"
    // separo del caracter base -- escape Unicode explicito (U+0300-U+036F)
    // en vez de pegar el caracter combinante literal aca, para no depender
    // de que el archivo se guarde/lea siempre con la misma codificacion.
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
