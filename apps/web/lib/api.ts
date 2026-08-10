// ============================================================================
// lib/api.ts — Punto UNICO por el que cualquier pagina del frontend llama
// al backend (Core API). Centralizar esto evita que cada pagina repita la
// misma logica de "armar la URL, poner el header Authorization, revisar si
// la respuesta vino mal" con pequeñas diferencias entre si.
//
// Relacion con el resto del proyecto:
// - Usa "auth()" (ver ../auth.ts) para leer el access_token que Keycloak
//   entrego al iniciar sesion — el MISMO token que
//   apps/api/src/auth/jwt.strategy.ts valida en el backend.
// - STOKA_API_URL (ver .env.example de esta app) es la URL base del
//   backend NestJS; en desarrollo local, "http://localhost:3001/api/v1".
// ============================================================================

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/auth';

const API_URL = process.env.STOKA_API_URL ?? 'http://localhost:3001/api/v1';

// El backend resuelve a que INSTITUCION pertenece un request mirando el
// header "Host" (ver tenant-context.middleware.ts) — pero aca, quien
// llama al backend no es el navegador de la persona, es este mismo
// servidor de Next.js, hacia una URL FIJA (STOKA_API_URL). Sin esto,
// "Host" siempre seria "localhost:3001" (o el dominio del backend en
// produccion), sin importar que subdominio de institucion este visitando
// alguien en su navegador — CUALQUIER personalizacion por tenant (marca
// del home, etc.) veria siempre el mismo tenant.
//
// La solucion: leer el Host que SI vio Next.js al recibir el request
// original del navegador (headers() de next/headers, disponible tanto en
// Server Components como en Server Actions) y reenviarlo en un header
// aparte, "X-Tenant-Host", que el backend prioriza sobre su propio "Host"
// (ver la nota extensa en tenant-context.middleware.ts).
async function getTenantHostHeader(): Promise<Record<string, string>> {
  const incomingHost = (await headers()).get('host');
  return incomingHost ? { 'X-Tenant-Host': incomingHost } : {};
}

// El backend (ver common/filters/prisma-exception.filter.ts y los
// "throw new NotFoundException(...)" etc. de cada servicio) siempre
// responde los errores como JSON con un campo "message" en español, ya
// pensado para mostrarse tal cual a una persona — por eso esta clase solo
// necesita guardar ese mensaje, sin traducirlo ni reinterpretarlo.
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

// Toda pagina protegida empieza llamando a esto (fuera de cualquier
// try/catch: "redirect()" de Next.js funciona lanzando un error especial
// por dentro, que un try/catch alrededor lo tomaria por error y rompería
// la redireccion).
export async function requireAccessToken(): Promise<string> {
  const session = await auth();
  // "session.error" viene de auth.ts (refreshAccessToken): el refresh_token
  // ya no sirvio, asi que el accessToken que quedo en la sesion es viejo a
  // proposito — usarlo solo produciria un 401 confuso ("Unauthorized") en
  // vez de mandar derecho a iniciar sesion de nuevo.
  if (!session?.accessToken || session.error) {
    redirect('/');
  }
  return session.accessToken;
}

export async function apiFetch<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(await getTenantHostHeader()),
      ...init.headers,
    },
    // Cada respuesta depende de QUIEN la pide (tenant + permisos del
    // usuario) — nunca debe quedar cacheada y servirsela por error a otra
    // persona en un request posterior.
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}) as { message?: string });
    throw new ApiError(
      body.message ?? `El backend respondio con un error inesperado (${response.status}).`,
      response.status,
    );
  }

  return parseJsonBody<T>(response);
}

// Version SIN token, para las (pocas) llamadas publicas del frontend: la
// verificacion de certificados (GET /verify/:codigo) y el registro/consulta
// de marca de una institucion (POST /tenant-registration-requests,
// GET /tenant/public) — endpoints que el backend expone sin autenticacion
// a proposito, ver la nota en cada uno.
export async function apiFetchPublic<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(await getTenantHostHeader()), ...init.headers },
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}) as { message?: string });
    throw new ApiError(
      body.message ?? `El backend respondio con un error inesperado (${response.status}).`,
      response.status,
    );
  }
  return parseJsonBody<T>(response);
}

// Version para SUBIR ARCHIVOS (multipart/form-data), usada por las pantallas
// de contenido de curso (ver content/actions.ts). A proposito NO fija
// "Content-Type" a mano: si se lo pusieramos como "multipart/form-data" a
// secas, faltaria el "boundary" que separa cada campo dentro del body, y el
// backend (FileInterceptor de Nest/multer) no podria parsear nada — fetch
// arma ese header completo, con el boundary correcto, SOLO si se lo deja
// que lo decida solo a partir del objeto FormData.
export async function apiFetchUpload<T>(
  accessToken: string,
  path: string,
  formData: FormData,
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(await getTenantHostHeader()),
    },
    body: formData,
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}) as { message?: string });
    throw new ApiError(
      body.message ?? `El backend respondio con un error inesperado (${response.status}).`,
      response.status,
    );
  }

  return parseJsonBody<T>(response);
}

// GET /tenant/public (ver tenant.controller.ts) devuelve el cuerpo
// LITERALMENTE VACIO (no la palabra "null") cuando no hay ningun tenant
// resuelto por el Host del request — "response.json()" directo rompe con
// un body vacio, por eso todo el parseo de JSON pasa por aca: si no hay
// texto, se interpreta como "sin datos" en vez de fallar.
async function parseJsonBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

// Helper para las Server Actions de formularios (ver .../actions.ts en cada
// pantalla): convierte cualquier error en un mensaje de texto listo para
// mostrar, sin importar si vino del backend (ApiError) o fue un fallo de
// red/inesperado.
export function toErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Ocurrio un error inesperado. Intenta de nuevo.';
}

// ============================================================================
// Permisos del usuario actual — para OCULTAR botones/enlaces que su rol no
// puede usar (ver auth.controller.ts, "GET /auth/me" y "GET /auth/permissions").
//
// Antes, cada pantalla mostraba SIEMPRE los formularios de crear/eliminar y
// dejaba que el 403 del backend los bloqueara — aceptable para probar una
// pantalla a la vez, pero confuso para una persona real (un Estudiante veia
// botones de "Crear módulo" o el enlace "Configuración de marca" que nunca
// iban a funcionar). El backend sigue siendo la autoridad real (estas
// funciones NUNCA reemplazan los guards del backend, solo evitan mostrar
// controles inutiles).
// ============================================================================

export type Permissions = Set<string>;

// Version TENANT-WIDE (sin curso especifico) — para decidir que enlaces de
// navegacion mostrar (ver app/(app)/layout.tsx). Devuelve un Set vacio si
// falla (nunca bloquea la pagina por esto: sin permisos, simplemente no se
// muestra nada que dependa de ellos).
export async function getPermissions(accessToken: string): Promise<Permissions> {
  try {
    const me = await apiFetch<{ permissions: string[] }>(accessToken, '/auth/me');
    return new Set(me.permissions);
  } catch {
    return new Set();
  }
}

// Version ACOTADA A UN CURSO: un Docente puede tener un rol asignado SOLO
// para un curso puntual (ver docs/architecture/03-rbac.md, seccion 3.4) —
// las pantallas anidadas bajo un curso (modulos, evaluaciones, secciones)
// necesitan esta version para no ocultar controles que SI deberian verse.
export async function getCoursePermissions(
  accessToken: string,
  courseId: string,
): Promise<Permissions> {
  try {
    const { permissions } = await apiFetch<{ permissions: string[] }>(
      accessToken,
      `/auth/permissions?courseId=${courseId}`,
    );
    return new Set(permissions);
  } catch {
    return new Set();
  }
}

export function can(permissions: Permissions, resource: string, action: string): boolean {
  return permissions.has(`${resource}:${action}`);
}
