// ============================================================================
// route.ts — Expone la configuracion de auth.ts como rutas HTTP reales.
//
// El nombre de carpeta "[...nextauth]" (con corchetes y "...") es una ruta
// "catch-all" de Next.js: captura CUALQUIER sub-ruta bajo /api/auth/, por
// ejemplo /api/auth/signin, /api/auth/callback/keycloak, /api/auth/signout,
// etc. NextAuth.js internamente decide que hacer segun cual de esas
// sub-rutas se llamo — nosotros no escribimos esa logica, solo la
// conectamos re-exportando "handlers" desde ../../../../auth.ts.
// ============================================================================

import { handlers } from '@/auth';

export const { GET, POST } = handlers;
