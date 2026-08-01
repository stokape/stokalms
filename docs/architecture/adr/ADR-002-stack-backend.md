# ADR-002: Framework de backend

## Estado
Aceptado

## Contexto
Se requiere un backend que soporte: lógica de negocio académica compleja (gradebook ponderado, prerequisitos, RBAC granular), procesamiento asíncrono (importaciones masivas, generación de certificados), y buena velocidad de desarrollo para un equipo que también construye el frontend en React/TypeScript.

## Alternativas consideradas

1. **Django + Django REST Framework (Python)**: ecosistema maduro, admin panel gratis, buena librería SCORM/xAPI en Python.
2. **Laravel (PHP)**: ecosistema fuerte en EdTech (Moodle es PHP), curva de aprendizaje baja, buen soporte de colas (Laravel Queues).
3. **NestJS (Node.js/TypeScript)**: arquitectura modular con decoradores, tipado compartido con el frontend Next.js, buen soporte de async/colas (BullMQ nativo).

## Decisión
Se adopta **NestJS sobre Node.js con TypeScript**.

Razones:
- **Tipado end-to-end**: los mismos tipos (DTOs, contratos de API) se comparten entre frontend Next.js y backend sin duplicar definiciones ni depender de generación de clientes desde OpenAPI como paso intermedio obligatorio.
- **Modularidad nativa**: los "módulos" de NestJS (decorador `@Module`) mapean naturalmente a los módulos de negocio del LMS (Académico, Evaluaciones, Gradebook, RBAC, Certificados) y a los *feature flags* por tenant — activar/desactivar un módulo de NestJS por tenant es una operación de composición, no un `if` disperso en el código.
- **Guards/Interceptors** encajan directamente con el modelo de RBAC (Casbin) y con la resolución de tenant (interceptor que fija `SET LOCAL app.current_tenant` antes de cada handler).
- Django se descarta como decisión principal porque partir el lenguaje entre frontend y backend añade fricción de contratos (aunque su ORM y admin panel son atractivos, no compensan la pérdida de tipado compartido para un equipo que ya construye en TypeScript).
- Laravel se descarta porque, si bien el ecosistema EdTech en PHP es fuerte (Moodle), el equipo objetivo y el mercado de talento para mantenimiento a largo plazo se alinea mejor con TypeScript/Node, y la reutilización de contratos con el frontend pesa más que la tradición del dominio.

## Consecuencias
- (+) Un solo lenguaje (TypeScript) en todo el stack de aplicación, reduce contexto de cambio para el equipo.
- (+) Arquitectura modular facilita extraer un módulo (ej. Certificados) a servicio independiente si el crecimiento lo justifica, sin reescritura completa.
- (-) Ecosistema de librerías EdTech específicas (SCORM, LTI) es más maduro en Java/PHP/Python que en Node; se mitiga usando librerías open source existentes (`scorm-again`, clientes LTI 1.3 para Node) en vez de reimplementar los estándares.

## Referencias
Ver [01. Arquitectura de alto nivel §1.2-1.3](../01-arquitectura-alto-nivel.md).
