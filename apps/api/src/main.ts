// ============================================================================
// main.ts — Punto de entrada del backend (Core API).
//
// Este es el PRIMER archivo que se ejecuta cuando arrancamos el backend
// (con "npm run dev" dentro de apps/api). Su unico trabajo es:
//   1) Construir la aplicacion NestJS a partir de AppModule (el "modulo raiz",
//      ver ./app.module.ts, que a su vez importa todos los demas modulos).
//   2) Configurar cosas globales de HTTP (prefijo de rutas, validacion).
//   3) Poner el servidor a escuchar en un puerto.
//
// Relacion con el resto del proyecto:
// - AppModule (./app.module.ts) es quien realmente "arma" la aplicacion:
//   aqui solo la arrancamos.
// - El puerto y el prefijo de la API salen de ./config/configuration.ts,
//   que a su vez lee las variables de entorno definidas en ".env"
//   (plantilla documentada en la raiz del proyecto: .env.example).
// ============================================================================

import 'reflect-metadata';
// NestJS usa decoradores (@Module, @Injectable, @Controller) que dependen de
// "reflect-metadata" para leer, en tiempo de ejecucion, que tipos tiene cada
// clase. Debe importarse UNA sola vez, lo mas arriba posible del arranque.

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  // NestFactory.create construye la aplicacion completa: lee AppModule,
  // resuelve todos los modulos/controladores/servicios que este importa
  // (de forma recursiva) y arma el arbol de inyeccion de dependencias.
  const app = await NestFactory.create(AppModule);

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

  // Puerto en el que el proceso de Node.js escucha conexiones HTTP.
  // process.env.API_PORT viene de ".env" (ver .env.example); si no esta
  // definida, usamos 3001 como valor por defecto para desarrollo local.
  const port = process.env.API_PORT ?? 3001;
  await app.listen(port);

  // Mensaje visible en la terminal al arrancar, util para confirmar que
  // efectivamente esta corriendo y en que puerto.
  // eslint-disable-next-line no-console
  console.log(`[stoka-api] Escuchando en http://localhost:${port}/api/v1`);
}

bootstrap();
