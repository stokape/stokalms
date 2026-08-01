# Stoka LMS — Arquitectura y plan de implementación

Diseño de arquitectura para una plataforma LMS SaaS multi-tenant (referencia funcional: Canvas LMS), dirigida a institutos, universidades, centros de capacitación y academias.

## Índice de entregables

1. [Arquitectura de alto nivel](01-arquitectura-alto-nivel.md) — componentes, stack tecnológico, estrategia multi-tenant.
2. [Modelo de datos](02-modelo-de-datos.md) — entidades principales, relaciones, aislamiento por tenant.
3. [Diseño RBAC](03-rbac.md) — roles, permisos granulares, personalización por tenant.
4. [Flujos críticos](04-flujos-criticos.md) — matrícula, evaluación/calificación, certificados.
5. [API design](05-api-design.md) — convenciones REST, versionado, autenticación, contratos.
6. [Roadmap de implementación](06-roadmap.md) — MVP y fases posteriores, priorización.
7. [Infraestructura y despliegue](07-infraestructura.md) — cloud, CI/CD, costos, DR.

## Decisiones de arquitectura (ADRs)

- [ADR-001: Estrategia multi-tenant](adr/ADR-001-multi-tenancy.md)
- [ADR-002: Framework de backend](adr/ADR-002-stack-backend.md)
- [ADR-003: Identidad, autenticación y SSO](adr/ADR-003-auth-identity.md)
- [ADR-004: Motor de base de datos](adr/ADR-004-base-datos.md)
- [ADR-005: Motor de RBAC/políticas](adr/ADR-005-rbac-engine.md)
- [ADR-006: Estilo de API (REST vs GraphQL)](adr/ADR-006-api-style.md)

## Principios rectores

- **Open source primero**: cada pieza del stack tiene alternativa gestionada (cloud) y alternativa autoalojada, para no atar el proyecto a licenciamiento propietario.
- **Self-service real**: ninguna configuración de tenant (branding, escalas de nota, roles, plantillas) requiere intervención del proveedor ni despliegue de código.
- **i18n desde el día uno**: todo texto de UI, notificación y certificado pasa por un sistema de traducción (es por defecto), nunca hardcodeado.
- **Aislamiento de datos verificable**: cada acceso a datos de un tenant pasa por un mecanismo de aislamiento reforzado a nivel de base de datos, no solo a nivel de aplicación.
