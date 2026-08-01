# ADR-001: Estrategia de multi-tenancy

## Estado
Aceptado

## Contexto
La plataforma debe soportar desde academias de 50 usuarios hasta universidades de 50,000+, con aislamiento de datos entre entidades educativas (tenants) como requisito no negociable, y costo operativo que debe mantenerse bajo para los tenants pequeños (que serán mayoría numérica).

## Alternativas consideradas

1. **Silo puro** (una base de datos o esquema por tenant desde el inicio).
   - Ventaja: aislamiento físico máximo, backups/restores independientes por tenant.
   - Descartada como default: con miles de academias pequeñas, cada una con su propia BD, el costo operativo (N conexiones, N migraciones, N backups) crece linealmente y de forma insostenible para tenants que pagan poco.

2. **Pool puro** (todas las tablas compartidas, discriminador `tenant_id`, sin refuerzo adicional).
   - Ventaja: costo operativo mínimo, escalabilidad excelente.
   - Descartada como único modelo: depende enteramente de que *cada* query de aplicación incluya correctamente el filtro `tenant_id`; un solo `WHERE` olvidado en cientos de endpoints es una fuga de datos entre entidades educativas, inaceptable dado el carácter sensible de notas y datos personales de estudiantes (Ley N° 29733 / GDPR).

3. **Pool + PostgreSQL Row-Level Security (RLS)** como mecanismo reforzado a nivel de motor de base de datos.

4. **Híbrido/Bridge**: pool+RLS por defecto, con opción de aislar un tenant específico en esquema o base de datos dedicada.

## Decisión
Se adopta el modelo **híbrido (opción 4)**: **pool con RLS activado en PostgreSQL** como configuración por defecto para todos los tenants, con la capacidad de **migrar un tenant individual a esquema o base de datos dedicada** cuando:
- El tenant supera un umbral de volumen que justifica aislamiento físico (referencia: universidades grandes, 50,000+ usuarios), o
- El contrato del tenant exige aislamiento físico por razones regulatorias o de auditoría propias.

RLS se implementa fijando `SET LOCAL app.current_tenant` al inicio de cada transacción (resuelto desde el JWT/subdominio verificado), y cada tabla de negocio tiene una policy que compara `tenant_id` contra ese valor de sesión. Esto convierte el aislamiento en una garantía del motor de base de datos, no solo una disciplina de código de aplicación.

## Consecuencias
- (+) Costo operativo bajo para la mayoría de tenants (pequeños/medianos comparten infraestructura).
- (+) Aislamiento verificable incluso ante bugs de aplicación (defensa en profundidad).
- (+) Camino de escalamiento claro para tenants grandes sin rediseñar el modelo de datos (mismo esquema, distinta ubicación física).
- (-) Mayor complejidad inicial de configuración (policies RLS por tabla, gestión de la sesión `app.current_tenant` en el pool de conexiones del ORM).
- (-) La migración de un tenant de pool a silo requiere un proceso de migración de datos (ETL) que debe diseñarse y probarse con antelación a la primera venta Enterprise.

## Referencias
Ver [01. Arquitectura de alto nivel §1.4](../01-arquitectura-alto-nivel.md#14-estrategia-multi-tenant), [02. Modelo de datos](../02-modelo-de-datos.md).
