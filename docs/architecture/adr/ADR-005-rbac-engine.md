# ADR-005: Motor de RBAC/políticas

## Estado
Aceptado

## Contexto
El sistema de permisos debe soportar roles base del sistema, roles completamente personalizados por tenant, y alcance de asignación tanto a nivel de tenant completo como de curso específico (un mismo usuario con roles distintos en cursos distintos), evaluado en cada request con baja latencia.

## Alternativas consideradas

1. **Tablas de permisos custom + lógica de autorización escrita a mano** en cada endpoint.
2. **Open Policy Agent (OPA)**: motor de políticas ABAC general, típicamente desplegado como sidecar evaluando políticas Rego.
3. **Casbin**: librería de control de acceso embebible, con modelo RBAC con soporte nativo de "dominios" (útil para *multi-tenancy* y alcance por curso).

## Decisión
Se adopta **Casbin**, embebido dentro del Core API (NestJS), usando su modelo RBAC con dominios (`g2`), donde el dominio representa `tenant:{id}` o `course:{id}`.

Razones:
- El modelo de dominios de Casbin **mapea exactamente** el requisito "mismo usuario, roles distintos por curso": el alcance (`scope_course_id` nullable en `USER_ROLE`, ver [modelo de datos](../02-modelo-de-datos.md)) se traduce directamente en el parámetro `dom` de una consulta `enforce(usuario, dominio, recurso, acción)`.
- Corre **embebido en el proceso**, evaluando políticas cacheadas en memoria — sin la latencia de red de un sidecar HTTP como OPA, relevante porque el enforcement ocurre en *cada* request autenticado.
- OPA se descarta como elección principal: es más potente para políticas verdaderamente basadas en atributos dinámicos (horario, geolocalización, condiciones externas), pero ese nivel de expresividad no es necesario en el alcance actual (RBAC con alcance jerárquico tenant→curso cubre los requerimientos), y añade un componente operativo adicional (sidecar, lenguaje Rego separado del resto del stack) no justificado todavía. Queda documentado como opción de evolución si en fases futuras aparecen políticas condicionadas (ej. "solo durante la ventana de examen").
- Construir la lógica a mano se descarta porque, a medida que se agregan roles custom por tenant, la lógica de "¿qué puede hacer este usuario aquí?" se vuelve fácilmente inconsistente entre endpoints; un motor centralizado con un modelo declarativo (`model.conf`) hace la política auditable en un solo lugar.

## Consecuencias
- (+) Evaluación de permisos rápida (in-process) y consistente en todos los endpoints.
- (+) El modelo de dominios cubre alcance tenant/curso sin lógica ad-hoc adicional.
- (-) Las políticas Casbin deben mantenerse sincronizadas con las tablas relacionales `ROLE`/`PERMISSION`/`ROLE_PERMISSION` (fuente de verdad); se resuelve regenerando/invalidando el cache de políticas vía un *watcher* sobre Redis cada vez que un Admin de entidad modifica una matriz de permisos.
- (-) Requiere disciplina para no dejar que la lógica de negocio dependa de detalles internos de Casbin en vez de la fuente de verdad relacional (Casbin es motor de evaluación, no ORM de permisos).

## Referencias
Ver [03. Diseño RBAC](../03-rbac.md).
