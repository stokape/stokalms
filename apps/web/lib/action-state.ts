// ============================================================================
// action-state.ts — Tipo de retorno comun para las Server Actions que ANTES
// llamaban a redirect() (ver la nota extensa en periodos/actions.ts sobre por
// que eso rompe headers()/cookies() en produccion). Reemplazo:
//
//   - La accion NUNCA llama a redirect(). Devuelve { error, redirectTo? }.
//   - "error": para mostrar arriba del formulario via useActionState, sin
//     navegar a ningun lado (ej. periodos: "no se puede borrar, tiene cursos").
//   - "redirectTo": SOLO cuando la operacion tenia que llevar a otra pantalla
//     (ej. crear un curso -> ir a /cursos/<id>). La navegacion la hace el
//     CLIENTE con useRouter().push(...) (ver useActionRedirect abajo) -- eso
//     SI es un request real del navegador, con headers/cookies correctos, a
//     diferencia de redirect() dentro de la Server Action.
// ============================================================================

export type ActionState = { error: string | null; redirectTo?: string };

export const INITIAL_ACTION_STATE: ActionState = { error: null };
