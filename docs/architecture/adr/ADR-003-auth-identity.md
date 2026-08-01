# ADR-003: Identidad, autenticación y SSO

## Estado
Aceptado

## Contexto
Se requiere login propio (email/password), SSO con Google/Microsoft, y SSO institucional vía SAML/OIDC configurable **por el propio tenant sin intervención del proveedor** — un requisito explícito de universidades e institutos que ya tienen su propio directorio (Google Workspace, Microsoft Entra ID, ADFS).

## Alternativas consideradas

1. **Construir autenticación propia** (passport.js + tablas de usuarios/sesiones custom).
2. **Auth0 / servicio SaaS de identidad gestionado**.
3. **Keycloak** (open source, autoalojado o gestionado).

## Decisión
Se adopta **Keycloak** como *Identity Provider* central de la plataforma.

Razones:
- Soporta **múltiples realms**, lo que mapea naturalmente a "cada tenant puede tener su propia configuración de identidad" (proveedores de login habilitados, políticas de contraseña, federación SAML/OIDC propia) sin que el proveedor de la plataforma tenga que tocar código para dar de alta el SSO de una nueva universidad.
- SAML y OIDC son de primera clase — cumple el requisito de SSO institucional self-service: un Admin de entidad sube la metadata de su IdP desde el panel y Keycloak la registra dinámicamente vía su API de administración.
- Es open source con comunidad activa (alineado con la restricción de priorizar tecnologías sin costo de licenciamiento), evitando el costo por usuario activo mensual (MAU) que cobran Auth0/servicios equivalentes — relevante porque el modelo de negocio incluye tenants de 50,000+ usuarios donde el costo por MAU se vuelve prohibitivo.
- Construir autenticación propia se descarta: reimplementar SSO empresarial (SAML metadata, refresh token rotation, MFA) de forma segura es un esfuerzo considerable y un vector de riesgo alto para un dominio (datos de estudiantes/notas) que exige tratamiento cuidadoso.

## Consecuencias
- (+) SSO institucional autoservicio real, sin tickets de soporte al proveedor.
- (+) Sin costo por usuario activo, favorece el caso de tenants grandes.
- (-) Keycloak es un componente adicional que operar (aunque su imagen Docker oficial y modo cluster están bien documentados); se mitiga desplegándolo gestionado (ej. como servicio administrado en el clúster K8s con HA desde el inicio de la fase de crecimiento).
- (-) Requiere una capa delgada en el Core API para mapear `realm` de Keycloak ↔ `tenant_id` interno y sincronizar roles resumidos en el JWT.

## Referencias
Ver [05. API design §5.3](../05-api-design.md#53-autenticación-y-autorización).
