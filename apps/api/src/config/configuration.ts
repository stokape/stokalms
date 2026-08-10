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
  // desde afuera (ej. al escanear un QR impreso en un certificado). La usa
  // el propio BACKEND, del lado del servidor, para construir enlaces
  // absolutos que van DENTRO de contenido generado (ver
  // certificate.service.ts, que arma la URL que el QR codifica) — el
  // FRONTEND nunca necesita esta variable (llama a la API desde SU PROPIO
  // servidor con "STOKA_API_URL", ver apps/web/lib/api.ts, jamas desde el
  // navegador — por eso ninguna variable de este proyecto lleva el
  // prefijo "NEXT_PUBLIC_", ver .env.example).
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
    // Tamaño máximo (en MB) de un archivo subido como recurso de lección
    // (video, PDF, paquete SCORM...) — ver resource.controller.ts. Sin este
    // límite, multer aceptaría cualquier tamaño y un archivo enorme podría
    // agotar la memoria del proceso (el MVP sube a memoria antes de
    // reenviar a MinIO/S3, ver la nota extensa en resource.controller.ts).
    maxUploadMb: number;
  };
  keycloak: {
    baseUrl: string;
    realm: string;
    clientId: string;
    clientSecret: string;
    // Cliente OIDC del FRONTEND (no el de este backend) — mismo "stoka-web"
    // que scripts/setup-keycloak.js ya crea. Lo necesita
    // keycloak-admin.service.ts para poder registrarle un redirect_uri
    // nuevo cuando se aprueba una institucion (ver la nota extensa ahi).
    webClientId: string;
  };
  // Origen PUBLICO del frontend (ej. "https://stokalms.com" en produccion,
  // "http://localhost:3000" en desarrollo) — MISMA variable, mismo valor,
  // que ya usa scripts/setup-keycloak.js (ver "WEB_ORIGIN" alli). La
  // necesita keycloak-admin.service.ts para saber con que protocolo/puerto
  // arma el redirect_uri de cada institucion (el HOST cambia por tenant,
  // el resto no).
  webOrigin: string;
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
  // Envio de correo (ver common/mail/mail.service.ts, usado por
  // automations.service.ts para los recordatorios) — SIN valores por
  // defecto reales a proposito: en desarrollo, sin estas variables
  // definidas, "host" queda vacio y MailService NO INTENTA enviar nada
  // (solo deja un aviso en el log) — ver la nota extensa alli sobre por
  // que "no enviar" es preferible a fallar la operacion que disparo el
  // correo (ej. terminar una matricula) por un problema de SMTP.
  mail: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    // Remitente que ve quien recibe el correo (ej. "Stoka LMS
    // <no-responder@stokalms.com>") — separado de "user" (la cuenta con la
    // que se autentica al servidor SMTP) porque muchos proveedores
    // (SendGrid, SES) autentican con una API key que no es, en si, una
    // direccion de correo real.
    from: string;
  };
  // "Funcionalidades de IA" (plan Pro, ver lib/pricing.ts y
  // common/ai/ai.service.ts) — mismo criterio que "mail" arriba: SIN
  // valores por defecto reales. Sin "apiKey" definida, AiService no
  // intenta llamar a ningun proveedor externo (devuelve "no configurado"
  // en vez de fallar) — construido, apagado por defecto, como se acordo.
  ai: {
    apiKey: string;
    // Compatible con la API de "chat completions" de OpenAI — muchos
    // proveedores (incluido OpenAI mismo) exponen ese mismo formato, asi
    // que cambiar de proveedor es, en la practica, solo cambiar esta URL
    // base y el modelo, sin tocar AiService.
    baseUrl: string;
    model: string;
  };
  // Origenes desde los que un NAVEGADOR puede llamar a esta API con
  // JavaScript (fetch/XHR) — ver main.ts, app.enableCors(). Hoy, en la
  // practica, NINGUN navegador llama a esta API directo: el frontend
  // (apps/web) siempre pasa por su propio servidor de Next.js (Server
  // Components/Actions), que no esta sujeto a CORS por ser una llamada
  // servidor-a-servidor, no del navegador (ver la nota extensa en
  // apps/web/lib/api.ts). Esta lista es DEFENSA EN PROFUNDIDAD: si algun
  // dia se agrega una llamada del lado del cliente, solo estos origenes
  // van a poder hacerla — cualquier otro sitio queda bloqueado por el
  // propio navegador, aunque alguien robara o reusara un token valido.
  corsAllowedOrigins: string[];
}

// NestJS invoca esta funcion UNA vez al iniciar y guarda el objeto resultante
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
    maxUploadMb: parseInt(process.env.STORAGE_MAX_UPLOAD_MB ?? '100', 10),
  },

  keycloak: {
    baseUrl: process.env.KEYCLOAK_BASE_URL ?? 'http://localhost:8080',
    realm: process.env.KEYCLOAK_REALM ?? 'stoka-dev',
    clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'stoka-api',
    clientSecret: process.env.KEYCLOAK_CLIENT_SECRET ?? '',
    webClientId: process.env.KEYCLOAK_WEB_CLIENT_ID ?? 'stoka-web',
  },
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',

  mail: {
    host: process.env.SMTP_HOST ?? '',
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.SMTP_FROM ?? 'Stoka LMS <no-responder@stokalms.com>',
  },

  ai: {
    apiKey: process.env.AI_API_KEY ?? '',
    baseUrl: process.env.AI_BASE_URL ?? 'https://api.openai.com/v1',
    model: process.env.AI_MODEL ?? 'gpt-4o-mini',
  },

  platformAdminEmails: (process.env.PLATFORM_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),

  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
});
