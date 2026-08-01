# ADR-006: Estilo de API (REST vs GraphQL)

## Estado
Aceptado

## Contexto
La API debe servir al frontend propio (Next.js), a integraciones de terceros (sistemas del tenant vía CSV/webhooks, futuras herramientas LTI) y eventualmente a un cliente móvil. Se requiere una interfaz predecible para integradores externos que no necesariamente comparten el mismo nivel de sofisticación técnica que el equipo interno.

## Alternativas consideradas

1. **GraphQL first**: un único endpoint, el cliente pide exactamente los campos que necesita, fuerte para pantallas de dashboard/analítica con formas de datos variables.
2. **REST first**: endpoints por recurso, contratos explícitos versionados.
3. **Híbrido**: REST como interfaz pública/de integración, GraphQL como capa de agregación interna para el frontend.

## Decisión
Se adopta **REST como interfaz principal** para todos los endpoints de negocio (académico, matrícula, evaluaciones, gradebook, certificados, RBAC), dejando la puerta abierta a añadir una **capa GraphQL de agregación (BFF)** en fase posterior, exclusivamente para pantallas de analítica que combinen muchas entidades (ej. panel de riesgo de deserción).

Razones:
- **Integradores externos** (sistemas del tenant, futuras integraciones LTI/SIS) tienen expectativas y tooling más estandarizado alrededor de REST (documentación OpenAPI, Postman, rate limiting por endpoint) que alrededor de GraphQL, y el requisito explícito es que terceros con distinto nivel técnico puedan integrarse.
- **Cacheable por HTTP estándar** (CDN, `ETag`) de forma directa, relevante para endpoints de alto volumen y baja variabilidad como catálogo de cursos o el endpoint público de verificación de certificados.
- **Rate limiting y versionado por endpoint** son más simples de razonar y de operar en el API Gateway (Kong) con REST que con un único endpoint GraphQL donde el costo de una query no es uniforme.
- GraphQL puro se descarta como elección inicial: su ventaja principal (evitar *over-fetching* en pantallas complejas) no compensa, en esta etapa, la complejidad adicional de autorización por campo (relevante dado el RBAC granular) y de rate limiting por complejidad de query.
- Se conserva GraphQL como adición futura, no como alternativa mutuamente excluyente: cuando existan suficientes pantallas de analítica agregada (fase 2/3), una capa BFF GraphQL puede convivir sobre los mismos servicios REST sin reescribirlos.

## Consecuencias
- (+) Contratos explícitos y versionados, más simples de documentar para integradores externos.
- (+) Cacheo HTTP estándar aprovechable en CDN para endpoints de lectura frecuente.
- (-) El frontend interno puede necesitar múltiples llamadas para ensamblar pantallas complejas (ej. dashboard de docente); se mitiga con endpoints de agregación específicos (`/reports/...`) en vez de forzar al cliente a componer N llamadas, sin llegar a adoptar GraphQL completo todavía.

## Referencias
Ver [05. API design](../05-api-design.md).
