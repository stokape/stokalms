// ============================================================================
// main.ts — Punto de entrada del backend (Core API).
//
// Este es el PRIMER archivo que se ejecuta cuando iniciamos el backend
// (con "npm run dev" dentro de apps/api). Su unico trabajo es:
//   1) Construir la aplicacion NestJS a partir de AppModule (el "modulo raiz",
//      ver ./app.module.ts, que a su vez importa todos los demas modulos).
//   2) Configurar cosas globales de HTTP (prefijo de rutas, validacion).
//   3) Poner el servidor a escuchar en un puerto.
//
// Relacion con el resto del proyecto:
// - AppModule (./app.module.ts) es quien realmente "arma" la aplicacion:
//   aqui solo la iniciamos.
// - El puerto y el prefijo de la API salen de ./config/configuration.ts,
//   que a su vez lee las variables de entorno definidas en ".env"
//   (plantilla documentada en la raiz del proyecto: .env.example).
// ============================================================================

import 'reflect-metadata';
// NestJS usa decoradores (@Module, @Injectable, @Controller) que dependen de
// "reflect-metadata" para leer, en tiempo de ejecucion, que tipos tiene cada
// clase. Debe importarse UNA sola vez, lo mas arriba posible del inicio.

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import type { AppConfig } from './config/configuration';

async function bootstrap() {
  // NestFactory.create construye la aplicacion completa: lee AppModule,
  // resuelve todos los modulos/controladores/servicios que este importa
  // (de forma recursiva) y arma el arbol de inyeccion de dependencias.
  const app = await NestFactory.create(AppModule);

  // Cabeceras HTTP de seguridad de base (X-Content-Type-Options,
  // X-DNS-Prefetch-Control, Strict-Transport-Security, etc.) — helmet trae
  // los valores por defecto recomendados por OWASP para una API JSON. El
  // CSP "de verdad" (el que importa contra XSS) va del lado de apps/web
  // (ver next.config.ts): es ahi donde se renderiza HTML de verdad;
  // esta API solo devuelve JSON, asi que el CSP por defecto de helmet aca
  // es inofensivo pero redundante — se deja igual por si algun endpoint
  // llega a servir HTML/SVG en el futuro (ej. una vista previa).
  app.use(helmet());

  // CORS explicito: solo los origenes de configuration.ts
  // ("corsAllowedOrigins", ver CORS_ALLOWED_ORIGINS en .env) pueden llamar
  // a esta API desde JavaScript de navegador. "credentials: true" porque
  // en el futuro un llamado asi necesitaria mandar cookies/Authorization;
  // sin la lista explicita de origenes, "credentials: true" con "*" ni
  // siquiera es valido (el propio navegador lo rechaza) — hay que elegir
  // uno u otro, nunca los dos juntos con comodin.
  const config = app.get(ConfigService);
  app.enableCors({
    origin: config.get<AppConfig['corsAllowedOrigins']>('corsAllowedOrigins'),
    credentials: true,
  });

  // "trust proxy": en produccion este proceso corre DETRAS de un reverse
  // proxy (Caddy/Traefik/nginx, ver la nota de infraestructura en
  // tenant-domain.service.ts) — sin esto, Express ve como IP de origen la
  // del proxy (siempre la MISMA) para TODO el trafico, y el rate limiting
  // por IP (ver ThrottlerModule en app.module.ts) terminaria compartiendo
  // un unico balde entre todos los usuarios reales en vez de uno por
  // persona. "1" = confiar en un solo salto de proxy (el X-Forwarded-For
  // que agrega nuestro propio proxy), no en cualquier cabecera que mande
  // el cliente directamente.
  if (process.env.NODE_ENV === 'production') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  // Prefijo comun para todas las rutas HTTP: en vez de responder en
  // "/courses", la API responde en "/api/v1/courses" (ver el contrato de
  // endpoints documentado en docs/architecture/05-api-design.md, seccion 5.2
  // "Convenciones"). El "v1" fija el versionado de la API desde el dia uno.
  app.setGlobalPrefix('api/v1');

  // ValidationPipe revisa AUTOMATICAMENTE el cuerpo (body) de cada request
  // entrante contra las reglas declaradas en los DTOs (Data Transfer Objects)
  // de cada modulo (los crearemos en los proximos pasos, ej. CreateCourseDto).
  // Si el body no cumple las reglas, corta la ejecucion y responde 400 antes
  // de que el codigo de negocio llegue a ejecutarse.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina del body cualquier campo que NO este declarado en el DTO
                       // (evita que alguien "cuele" campos no esperados, ej. tenantId falso).
      forbidNonWhitelisted: true, // En vez de solo ignorar campos extra, rechaza el request
                                  // completo si vienen campos no declarados (mas estricto y seguro).
      transform: true, // Convierte automaticamente tipos primitivos (ej. un string "5" del
                       // query param se transforma en el numero 5 si el DTO espera un number).
    }),
  );

  // Traduce errores de Prisma (ej. violacion de llave foranea al intentar
  // borrar un registro que todavia tiene datos dependientes) a respuestas
  // HTTP claras (409, 404...) en vez del generico 500 que NestJS daria por
  // defecto. Ver common/filters/prisma-exception.filter.ts para el detalle
  // completo, incluyendo el caso real que lo motivo.
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Puerto en el que el proceso de Node.js escucha conexiones HTTP.
  // process.env.API_PORT viene de ".env" (ver .env.example); si no esta
  // definida, usamos 3001 como valor por defecto para desarrollo local.
  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);

  // Mensaje visible en la terminal al iniciar, util para confirmar que
  // efectivamente esta corriendo y en que puerto.
  console.log(`[stoka-api] Escuchando en http://localhost:${port}/api/v1`);
}

bootstrap();
