// ============================================================================
// health.controller.ts — Endpoint de verificacion de salud del servicio.
//
// Un "health check" es un endpoint simple que responde "estoy vivo" sin
// tocar la base de datos ni ninguna dependencia externa. Sirve para que:
//   - Docker/Kubernetes sepan si deben reiniciar el contenedor (ver el
//     "healthcheck" de servicios en docker-compose.yml, mismo concepto).
//   - El equipo confirme rapido que "npm run dev" realmente levanto el server.
//
// Relacion con el resto del proyecto:
// - Es el primer modulo de negocio que registramos en app.module.ts, a modo
//   de prueba de que el prefijo global "/api/v1" (definido en main.ts) y el
//   arranque completo funcionan de punta a punta.
// ============================================================================

import { Controller, Get } from '@nestjs/common';

// @Controller('health') define que este controlador responde en la ruta
// "/health". Sumado al prefijo global "api/v1" (main.ts), la ruta final
// disponible es: GET http://localhost:3001/api/v1/health
@Controller('health')
export class HealthController {
  // @Get() sin argumentos = responde al metodo HTTP GET sobre la ruta base
  // del controlador ("/health", sin nada adicional despues).
  @Get()
  check() {
    // Devolvemos un objeto plano; NestJS lo serializa automaticamente a JSON.
    return {
      status: 'ok',
      service: 'stoka-api',
      timestamp: new Date().toISOString(),
    };
  }
}
