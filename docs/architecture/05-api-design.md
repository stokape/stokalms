# 5. API design

## 5.1 Estilo: REST first

Se elige **REST como interfaz principal**, con posibilidad de añadir una capa **GraphQL de agregación (BFF)** en fases posteriores para pantallas de analítica/dashboard que necesiten combinar muchas entidades en una sola consulta. Justificación en [ADR-006](adr/ADR-006-api-style.md).

## 5.2 Convenciones

- **Base URL**: `https://api.stokalms.com/api/v1/...` — el tenant se resuelve por **subdominio del origen de la request** (`academia.stokalms.com`) o por dominio custom registrado, nunca por parámetro de query (evita errores de omitirlo y referencias cruzadas accidentales entre tenants).
- **Versionado**: en el path (`/api/v1`). Breaking changes solo en versión nueva; se sostienen mínimo 12 meses de superposición entre versiones con aviso a integradores (LTI, SIS externos).
- **Formato**: JSON, `camelCase` en payloads, fechas en ISO 8601 UTC, paginación por cursor (`?cursor=...&limit=...`) en colecciones grandes (matrícula, envíos, logs de auditoría).
- **Errores**: formato uniforme tipo *Problem Details* (RFC 9457):
```json
{
  "type": "https://stokalms.com/errors/enrollment-capacity-exceeded",
  "title": "La sección alcanzó su capacidad máxima",
  "status": 409,
  "instance": "/api/v1/enrollments",
  "traceId": "b1f6..."
}
```
- **Idempotencia**: endpoints de creación críticos (matrícula masiva, emisión de certificados) aceptan header `Idempotency-Key` para permitir reintentos seguros desde el cliente.
- **Rate limiting**: por tenant y por plan comercial, aplicado en el API Gateway (Kong), con headers `X-RateLimit-*` estándar.

## 5.3 Autenticación y autorización

- **OIDC/OAuth2** vía Keycloak como *Authorization Server*. Flujo `authorization_code + PKCE` para la SPA, `client_credentials` para integraciones servidor-a-servidor (SIS externos).
- **Access token**: JWT de corta duración (15 min), claims: `sub` (userId), `tenant_id`, `roles` (resumen, no la matriz completa), `scope`.
- **Refresh token**: rotación en cada uso, revocable desde el panel de administración (cierre de sesión remoto).
- **SSO institucional**: Keycloak federa contra SAML/OIDC del tenant (Google Workspace, Microsoft Entra ID, ADFS) — el tenant configura su *Identity Provider* propio desde el panel, sin intervención del proveedor (self-service, con validación guiada de metadata SAML/OIDC).
- **LTI 1.3**: flujo de *OIDC launch* estándar, separado del login de usuarios finales, para herramientas externas embebidas dentro de un curso.
- **Endpoint público de verificación de certificados**: sin autenticación, protegido solo por rate limiting (para prevenir scraping masivo de códigos).

## 5.4 Contratos de endpoints principales (resumen)

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/token` | Intercambio de código OIDC por tokens (proxy a Keycloak) |
| `GET` | `/tenants/me` | Configuración del tenant activo (branding, features, escalas) |
| `PATCH` | `/tenants/me/branding` | Actualiza logo/colores/dominio (Admin de entidad) |
| `GET/POST` | `/terms` | Periodos académicos |
| `GET/POST` | `/courses` | Cursos (filtrable por término, sede) |
| `POST` | `/courses/{id}/modules` | Crea módulo con prerequisitos (`prerequisiteModuleIds`) |
| `POST` | `/enrollments` | Matrícula individual |
| `POST` | `/enrollments/bulk-import` | Matrícula masiva (multipart, retorna `jobId`) |
| `GET` | `/imports/{jobId}` | Estado y reporte de una importación |
| `POST` | `/courses/{id}/assessments` | Crea evaluación (examen/tarea/foro/rúbrica) |
| `POST` | `/assessments/{id}/submissions` | Envío de intento del estudiante |
| `PATCH` | `/submissions/{id}/grade` | Calificación manual + feedback |
| `POST` | `/courses/{id}/gradebook/publish` | Publica notas recalculadas del curso |
| `GET` | `/courses/{id}/grades` | Libro de calificaciones (según rol: propio o completo) |
| `GET/POST` | `/roles` | Roles custom del tenant y su matriz de permisos |
| `POST` | `/certificates/issue` | Emisión manual/forzada (además del disparo automático) |
| `GET` | `/verify/{verificationCode}` | **Público**: valida autenticidad de un certificado |
| `GET` | `/reports/course/{id}/performance` | Reporte de rendimiento por curso |
| `GET` | `/reports/students/at-risk` | Panel de riesgo de deserción (fase 2+) |

## 5.5 Ejemplo de contrato: publicación de notas

```
POST /api/v1/courses/{courseId}/gradebook/publish
Authorization: Bearer <jwt>
```

Respuesta `200 OK`:
```json
{
  "courseId": "c-123",
  "publishedAt": "2026-07-31T18:00:00Z",
  "studentsAffected": 42,
  "gradingScale": { "type": "vigesimal", "decimalRounding": 1 },
  "warnings": [
    { "enrollmentId": "e-987", "message": "Categoría 'Tareas' sin calificaciones registradas, se excluyó del promedio ponderado" }
  ]
}
```
