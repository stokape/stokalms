// ============================================================================
// configuration.ts — Lectura centralizada de variables de entorno.
//
// En vez de que cada archivo del proyecto llame directamente a
// "process.env.ALGO" (dificil de rastrear y sin valores por defecto claros),
// TODA variable de entorno pasa por esta funcion una sola vez. El modulo
// @nestjs/config (registrado en app.module.ts) la expone luego a traves de
// ConfigService, que es lo que el resto del backend usa para leer config.
//
// Relacion con el resto del proyecto:
// - Lee las mismas variables documentadas en ".env.example" (raiz del repo).
// - Los valores de "database", "redis" y "storage" configuran los servicios
//   definidos en docker-compose.yml (Postgres, Redis, MinIO) en desarrollo.
// - "keycloak" configura la conexion al servidor de identidad (ver
//   docs/architecture/adr/ADR-003-auth-identity.md), usado por el modulo de
//   autenticacion que se construira en un proximo paso.
// ============================================================================

export interface AppConfig {
  env: string;
  port: number;
  platformRootDomain: string;
  // URL publica y absoluta desde la que se puede llamar a ESTA misma API
  // desde afuera (ej. al escanear un QR impreso en un certificado). Es
  // deliberadamente distinta de "NEXT_PUBLIC_API_URL" (que lee el
  // FRONTEND): esta la usa el propio BACKEND, del lado del servidor, para
  // construir enlaces absolutos que van DENTRO de contenido generado (ver
  // certificate.service.ts, que arma la URL que el QR codifica).
  apiPublicUrl: string;
  database: {
    // Usuario administrador (superusuario): solo lo usa el CLI de Prisma
    // para migraciones, nunca el backend en tiempo de ejecucion.
    url: string;
    // Usuario restringido, SIN privilegios de superusuario: es el que usa
    // PrismaService (ver src/prisma/prisma.service.ts) para que las
    // politicas de Row-Level Security realmente se apliquen. Ver el
    // comentario extenso sobre esto en apps/api/prisma/rls-policies.sql.
    runtimeUrl: string;
  };
  redis: {
    url: string;
  };
  storage: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKey: string;
    secretKey: string;
    forcePathStyle: boolean;
  };
  keycloak: {
    baseUrl: string;
    realm: string;
    clientId: string;
    clientSecret: string;
  };
  // Lista fija de emails con permiso de "administrador de PLATAFORMA": la
  // unica persona que puede aprobar/rechazar solicitudes de alta de una
  // institucion nueva (ver platform-admin.guard.ts). Es una simplificacion
  // deliberada del MVP — este rol NO vive en ningun tenant (por definicion,
  // aprueba instituciones que todavia no existen), asi que no encaja en el
  // modelo de permisos por tenant (Casbin + dominios "tenant:<id>"). Si en
  // el futuro hace falta administrar varias personas de plataforma con
  // distintos niveles de acceso, ese es el momento de modelar un dominio
  // Casbin "platform" de verdad en vez de esta lista fija.
  platformAdminEmails: string[];
}

// NestJS invoca esta funcion UNA vez al arrancar y guarda el objeto resultante
// en memoria; de ahi en adelante, cualquier servicio lo consulta con
// "configService.get<AppConfig>('...')" en vez de leer process.env de nuevo.
export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '3001', 10),
  platformRootDomain: process.env.PLATFORM_ROOT_DOMAIN ?? 'stokalms.local',
  apiPublicUrl: process.env.API_PUBLIC_URL ?? `http://localhost:${process.env.API_PORT ?? '3001'}/api/v1`,

  database: {
    url: process.env.DATABASE_URL ?? '',
    runtimeUrl: process.env.RUNTIME_DATABASE_URL ?? '',
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },

  storage: {
    endpoint: process.env.STORAGE_ENDPOINT ?? 'http://localhost:9000',
    region: process.env.STORAGE_REGION ?? 'us-east-1',
    bucket: process.env.STORAGE_BUCKET ?? 'stoka-lms-dev',
    accessKey: process.env.STORAGE_ACCESS_KEY ?? '',
    secretKey: process.env.STORAGE_SECRET_KEY ?? '',
    // "true"/"false" llega como texto desde el .env; lo convertimos a boolean real.
    forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE === 'true',
  },

  keycloak: {
    baseUrl: process.env.KEYCLOAK_BASE_URL ?? 'http://localhost:8080',
    realm: process.env.KEYCLOAK_REALM ?? 'stoka-dev',
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'stoka-api',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? '',
  },

  platformAdminEmails: (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
});
