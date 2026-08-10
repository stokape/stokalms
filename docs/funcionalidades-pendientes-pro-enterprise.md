# Funcionalidades pendientes (planes Pro/Enterprise)

Estado: **descartadas temporalmente** (2026-08-09) — no se empezaron a construir. Este documento existe para retomarlas más adelante sin tener que rehacer el análisis.

Contexto: en agosto de 2026 se auditó la página de precios (`apps/web/lib/pricing.ts` / `apps/web/app/dictionaries/precios.ts`) contra el código real y se encontraron ~21 características anunciadas que no existían. De esas, 15 se construyeron de verdad (dashboard, reportes + exportación, gestión avanzada de usuarios, cohortes, automatizaciones básicas y avanzadas, analítica avanzada y empresarial, reportes personalizados, IA (apagada por defecto), migración de información, seguridad avanzada — auditoría + exigir 2FA). Las 6 de abajo se sacaron de la página de precios porque no tienen nada real detrás todavía.

Cada entrada tiene: qué se ofrecía, el objetivo real, un ejemplo concreto, y — lo más importante — la razón técnica por la que se descartó esta vez (para no repetir la misma discusión).

---

## 1. API de integración (plan Pro)

**Objetivo**: acceso programático (API key por tenant, con scopes limitados) para que sistemas externos lean/escriban datos sin un usuario humano de por medio.

**Ejemplo**: RRHH matricula automáticamente a cada empleado nuevo en "Inducción"; un ERP académico consulta cada noche avances y certificados emitidos.

**Por qué se descartó ahora**: hoy toda autenticación es JWT de usuario vía Keycloak (`apps/api/src/auth/jwt.strategy.ts`) — no existe ningún concepto de "API key de servicio" ni tabla que las guarde. Implicaría: un modelo `ApiKey` (tenant, scopes, hash de la key, fecha de expiración), una nueva estrategia de autenticación en NestJS que conviva con la de JWT, y decidir el modelo de scopes sobre el catálogo de permisos ya existente (`role`/`permission`, ver `docs/architecture/03-rbac.md`). No es difícil, pero es superficie nueva de seguridad que merece su propio diseño, no una tarde.

---

## 2. Integraciones externas (plan Pro)

**Objetivo**: conectar con herramientas de terceros ya instaladas en la institución (calendario, videollamadas, chat), sin sacar al usuario de su flujo habitual.

**Ejemplo**: botón "Agregar a Google Calendar/Outlook" en cada sesión; webhook a Slack/Teams al publicar una evaluación o emitir un certificado; enlace de Zoom/Meet autogenerado al crear una clase en vivo.

**Por qué se descartó ahora**: depende de la #1 (necesita salir hacia afuera vía webhooks, o autenticarse contra APIs de terceros con OAuth de cada proveedor) y de credenciales/aprobación de cada integración (Google, Microsoft, Zoom exigen registrar la app y pasar revisión en algunos casos). Es la típica "integración por proveedor", cada una es su propio mini-proyecto.

---

## 3. SSO (plan Enterprise)

**Objetivo**: que la institución use su propio proveedor de identidad corporativo (Azure AD, Google Workspace, Okta) en vez de cuentas sueltas del Keycloak de Stoka.

**Ejemplo**: login con la cuenta de Microsoft 365 del empleado, sin password aparte; al desactivarlo en Azure AD, pierde acceso a Stoka automáticamente.

**Por qué se descartó ahora — es la más grande de las 6**: Keycloak, tal como está desplegado (`scripts/setup-keycloak.js`), es **un solo realm compartido por todas las instituciones** (`stoka-dev` en desarrollo). Un Identity Provider externo se configura *por realm* en Keycloak, no por tenant dentro de un realm compartido — así que SSO real requiere primero migrar a **un realm de Keycloak por tenant** (o al menos por tenant Enterprise), lo cual es un cambio de arquitectura de autenticación, no una función más. Ver la nota ya dejada en `apps/api/src/modules/security/security.service.ts` sobre la misma limitación aplicada a políticas de contraseña/sesión. Encarar esto en serio implica: decidir aprovisionamiento de realms (¿uno por tenant desde el alta? ¿on-demand?), migrar `KEYCLOAK_REALM` de variable global a dato por tenant en toda la capa de auth, y probablemente un ADR nuevo (ver `docs/architecture/adr/`).

---

## 4. API completa (plan Enterprise)

**Objetivo**: versión sin límites de la #1 — todas las entidades, no solo lectura/matrícula, con mayor cuota de uso.

**Ejemplo**: reconstruir el portal de alumno propio consumiendo 100% la API; automatizar la creación completa de cursos/secciones/docentes desde el sistema académico central del cliente.

**Por qué se descartó ahora**: es la #1 sin techo — mismo prerequisito (no hay API keys de servicio todavía), más definir rate limits diferenciados por plan (hoy `ThrottlerModule` es un límite global fijo, ver `app.module.ts`) y qué endpoints quedan fuera de alcance incluso para Enterprise (ej. los de plataforma, `platform-tenants`).

---

## 5. Integraciones empresariales (plan Enterprise)

**Objetivo**: conectores pre-armados con sistemas de misión crítica (HRIS, ERP, LDAP corporativo) — no herramientas sueltas como la #2.

**Ejemplo**: conector con Workday/SAP SuccessFactors para sincronizar empleados y capacitación obligatoria; sincronización de estructura organizacional para automatizar cohortes.

**Por qué se descartó ahora**: cada conector es, en la práctica, un proyecto de integración a medida con un proveedor específico (formato de datos, autenticación, mapeo de campos propios). No hay un "MVP genérico" razonable — hay que elegir el primer proveedor a soportar cuando aparezca un cliente real que lo pida.

---

## 6. Integraciones personalizadas (plan Enterprise)

**Objetivo**: desarrollo a medida cuando el cliente tiene un sistema propietario/legado que ningún conector estándar cubre.

**Ejemplo**: conectar con una nómina interna hecha a medida sin API moderna; sincronizar certificados con un ente regulador específico del sector del cliente.

**Por qué se descartó ahora**: por definición es trabajo de consultoría por cliente, no una función de producto — no hay nada genérico que construir de antemano. Se factura y ejecuta cuando aparece el cliente concreto, no antes.

---

## Orden sugerido si se retoman

1. **API de integración** (#1) — habilita las demás (#2, #4, #5, #6 dependen de tener API keys de servicio).
2. **SSO** (#3) — separado de las demás, pero es el cambio de arquitectura más grande (realm por tenant); conviene encararlo cuando haya un cliente Enterprise real pidiéndolo, con un ADR dedicado antes de tocar código.
3. **Integraciones externas** (#2) y **API completa** (#4) — una vez exista #1.
4. **Integraciones empresariales/personalizadas** (#5, #6) — a demanda, cliente por cliente.

## Referencia

Ver también la conversación donde se decidió esto (auditoría de precios, agosto 2026) y `apps/web/lib/pricing.ts`/`apps/web/app/dictionaries/precios.ts`, que ya NO anuncian estas 6 características.
