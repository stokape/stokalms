# ADR-004: Motor de base de datos

## Estado
Aceptado

## Contexto
El modelo de datos combina estructuras altamente relacionales (matrícula, gradebook, RBAC) con configuración flexible por tenant (branding, bandas de nota, campos dinámicos de certificado) y el requisito no funcional de aislamiento multi-tenant reforzado.

## Alternativas consideradas

1. **MySQL**: ampliamente soportado, pero soporte de JSON y de Row-Level Security nativo más limitado que PostgreSQL.
2. **MongoDB**: flexible para contenido no estructurado (lecciones, recursos), pero débil para las relaciones fuertemente normalizadas del gradebook y RBAC (ponderaciones, agregaciones consistentes, transacciones multi-documento más costosas).
3. **PostgreSQL**: relacional maduro, con `jsonb` para campos flexibles y **Row-Level Security nativo**.

## Decisión
Se adopta **PostgreSQL** como base de datos principal.

Razones:
- **Row-Level Security nativo** es el mecanismo elegido para reforzar el aislamiento multi-tenant (ver [ADR-001](ADR-001-multi-tenancy.md)); ni MySQL ni MongoDB ofrecen un equivalente igual de maduro.
- **`jsonb`** cubre la necesidad de campos de configuración por tenant (bandas de escala de nota, plantillas de certificado, configuración de rúbricas) sin sacrificar la integridad relacional del resto del modelo (matrícula, notas, permisos), que sí exige transacciones ACID fuertes (ej. recalcular una nota final no puede quedar en estado intermedio).
- Soporta múltiples esquemas dentro de la misma instancia, habilitando el modelo *bridge* (tenants silo como esquema dedicado en la misma instancia física, sin pasar necesariamente a una instancia completamente separada).
- Ecosistema de extensiones relevante (`pg_cron` para triggers de emisión de certificados, `pg_stat_statements` para diagnóstico de performance) y comunidad muy activa, alineado con la restricción de priorizar open source.

## Consecuencias
- (+) Un único motor cubre tanto el dato altamente relacional como la configuración flexible, evitando operar dos bases de datos distintas.
- (+) RLS reduce el riesgo de fuga de datos entre tenants a nivel de motor, no solo de aplicación.
- (-) Queries sobre campos `jsonb` complejos son menos eficientes que columnas tipadas; se mitiga limitando `jsonb` a configuración que no requiere joins/filtrado masivo (branding, plantillas), y usando columnas normales para todo lo que sí se consulta/agrega en volumen (notas, asistencia).

## Referencias
Ver [02. Modelo de datos](../02-modelo-de-datos.md), [ADR-001](ADR-001-multi-tenancy.md).
