// ============================================================================
// gradebook.util.ts — Funciones puras (sin base de datos ni HTTP) de calculo
// de notas. Se separan del resto de los servicios porque son la parte del
// modulo con MAS logica de negocio "matematica" y se benefician de quedar
// aisladas y faciles de razonar sin de por medio Prisma/NestJS.
// ============================================================================

// ---------------------------------------------------------------------------
// scoreAnswer: compara la respuesta de un estudiante contra la respuesta
// correcta de una pregunta, y devuelve el PUNTAJE obtenido.
//
// Devuelve "null" (en vez de un numero) cuando la pregunta NO se puede
// auto-calificar (tipo "open": respuesta abierta, ver
// docs/architecture/03-rbac.md y 02-modelo-de-datos.md, QUESTION.type) —
// ese "null" es la señal que usa submission.service.ts para saber que la
// entrega debe quedar "pending_review" hasta que un docente la califique
// a mano (ver assessment-grading.service.ts).
//
// Para los tipos SI auto-calificables (mcq/tf/matching), la comparacion es
// "todo o nada": o la respuesta coincide EXACTAMENTE con "correctAnswer" (se
// otorgan todos los puntos de la pregunta) o no coincide (cero puntos). No
// hay puntaje parcial en esta primera version — coincide con lo descrito en
// docs/architecture/04-flujos-criticos.md, seccion 4.2 ("corrige
// automaticamente, comparando sus respuestas contra las correctas").
// ---------------------------------------------------------------------------
export function scoreAnswer(
  question: { type: string; correctAnswer: unknown; points: number },
  answer: unknown,
): number | null {
  if (question.type === 'open') {
    return null;
  }

  return deepEqual(question.correctAnswer, answer) ? question.points : 0;
}

// Comparacion estructural profunda de dos valores JSON (objetos, arrays,
// primitivos). Se implementa a mano, en vez de traer una libreria externa,
// porque JSON.stringify NO sirve para esto: dos objetos con las mismas
// claves en DISTINTO ORDEN (ej. {a:1,b:2} vs {b:2,a:1}, algo comun si la
// respuesta del estudiante se arma en el frontend con Object.keys en otro
// orden) producirian strings distintos y la comparacion fallaria
// incorrectamente. deepEqual compara por CONTENIDO, no por serializacion.
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a as object).sort();
    const keysB = Object.keys(b as object).sort();
    if (keysA.length !== keysB.length || keysA.some((k, i) => k !== keysB[i])) return false;
    return keysA.every((key) =>
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    );
  }

  return false;
}

// ---------------------------------------------------------------------------
// roundTo: redondea "value" a "decimals" decimales. Se centraliza aqui
// (en vez de usar Math.round(value * 10) / 10 disperso en el codigo) porque
// el redondeo de NOTAS es una regla de negocio configurable por tenant
// (GradingScale.decimalRounding, ver docs/guia-para-no-tecnicos.md, seccion
// 4.2) y conviene tener un unico lugar que la aplique siempre de la misma
// manera.
// ---------------------------------------------------------------------------
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

// ---------------------------------------------------------------------------
// applyGradingScale: convierte un porcentaje (0-100) a la nota final segun
// el TIPO de escala del tenant (ver docs/architecture/02-modelo-de-datos.md,
// GRADING_SCALE):
//   - vigesimal:  0-100%  -> 0-20 puntos.
//   - centesimal: 0-100%  -> se queda igual (0-100 puntos).
//   - literal:    0-100%  -> se busca en "bands" que letra corresponde,
//                            ademas de guardar el porcentaje crudo como
//                            "finalScore" (Grade.letterGrade guarda la letra
//                            por separado, ver schema.prisma, modelo Grade).
//
// "bands" (solo para type="literal") tiene la forma
// { "90-100": "A", "80-89": "B", ... } — un rango de porcentaje (como
// texto "min-max") mapeado a una letra.
// ---------------------------------------------------------------------------
export function applyGradingScale(
  percentage: number,
  scale: { type: string; decimalRounding: number; bands: unknown },
): { finalScore: number; letterGrade: string | null } {
  if (scale.type === 'vigesimal') {
    return { finalScore: roundTo((percentage / 100) * 20, scale.decimalRounding), letterGrade: null };
  }

  if (scale.type === 'literal') {
    const bands = (scale.bands ?? {}) as Record<string, string>;
    const letter =
      Object.entries(bands).find(([range]) => {
        const [min, max] = range.split('-').map(Number);
        return percentage >= min && percentage <= max;
      })?.[1] ?? null;
    return { finalScore: roundTo(percentage, scale.decimalRounding), letterGrade: letter };
  }

  // "centesimal" (o cualquier tipo no reconocido): se deja el porcentaje tal cual.
  return { finalScore: roundTo(percentage, scale.decimalRounding), letterGrade: null };
}
