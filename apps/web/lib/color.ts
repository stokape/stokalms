// ============================================================================
// lib/color.ts — Utilidades para aplicar el color de marca de CADA
// institucion (ver Tenant.branding.primaryColor, tenant.service.ts) como
// variables CSS ("--primary"/"--primary-hover"/"--primary-foreground") sin
// depender de ninguna libreria externa: son 3 operaciones simples sobre un
// color hexadecimal (mezclar con negro/blanco, calcular contraste), no vale
// la pena una dependencia nueva solo por esto.
//
// Usado por apps/web/app/layout.tsx para inyectar el <style> que sobreescribe
// la paleta por defecto de globals.css cuando la institucion activa eligio
// su propio color (ver BrandingStudio.tsx, campo "primaryColor").
// ============================================================================

// "#1e90ff" o "1e90ff" -> { r, g, b }. Devuelve null si no es un hex valido
// de 6 digitos (mismo formato que exige "@IsHexColor()" en el backend,
// update-tenant.dto.ts) — nunca deberia pasar, pero un valor corrupto no
// tiene por que romper el render de toda la app.
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!match) return null;
  const int = parseInt(match[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${[r, g, b].map((c) => clamp(c).toString(16).padStart(2, '0')).join('')}`;
}

// Interpola "hex" hacia negro o blanco un "amount" (0-1) — el mismo efecto
// que el "color-mix()" de CSS, pero calculado en el servidor para no
// depender de que TODOS los navegadores objetivo soporten esa funcion
// todavia. "toward: 'black'" = mas oscuro (hover en tema claro); "'white'"
// = mas claro (hover en tema oscuro) — mismo criterio que ya usa la
// paleta por defecto de globals.css (el acento se aclara en oscuro, se
// oscurece en claro).
function mix(hex: string, toward: 'black' | 'white', amount: number): string {
  const c = parseHex(hex);
  if (!c) return hex;
  const target = toward === 'black' ? 0 : 255;
  return toHex({
    r: c.r + (target - c.r) * amount,
    g: c.g + (target - c.g) * amount,
    b: c.b + (target - c.b) * amount,
  });
}

// Contraste WCAG simplificado: luminancia relativa del color de marca vs.
// blanco/"Azul Profundo" (el mismo texto oscuro que ya usa el resto de la
// app, ver globals.css) — elige el que de MEJOR lectura encima de ese
// color, para que el texto de un botón nunca quede invisible solo porque
// una institución eligió un color de marca claro (ej. un amarillo pastel).
function bestTextColor(hex: string): string {
  const c = parseHex(hex);
  if (!c) return '#ffffff';
  // Formula de luminancia relativa (WCAG 2.1), sobre el rango 0-1.
  const [r, g, b] = [c.r, c.g, c.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? '#0d1b2a' : '#ffffff';
}

export interface PrimaryPalette {
  primary: string;
  primaryHoverLight: string;
  primaryHoverDark: string;
  primaryForeground: string;
}

// Deriva TODO lo que globals.css necesita a partir del unico color que
// elige cada institucion — ver la nota grande en apps/web/app/layout.tsx
// sobre donde se inyecta esto.
export function derivePrimaryPalette(hex: string): PrimaryPalette | null {
  const parsed = parseHex(hex);
  if (!parsed) return null;
  const normalized = toHex(parsed);
  return {
    primary: normalized,
    primaryHoverLight: mix(normalized, 'black', 0.15),
    primaryHoverDark: mix(normalized, 'white', 0.25),
    primaryForeground: bestTextColor(normalized),
  };
}
