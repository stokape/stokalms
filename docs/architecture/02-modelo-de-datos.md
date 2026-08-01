# 2. Modelo de datos

Todas las tablas de negocio (excepto catálogos globales del proveedor) incluyen `tenant_id` como discriminador y quedan sujetas a Row-Level Security (ver [01](01-arquitectura-alto-nivel.md#14-estrategia-multi-tenant)).

## 2.1 Diagrama entidad-relación (núcleo)

```mermaid
erDiagram
    TENANT ||--o{ TENANT_DOMAIN : tiene
    TENANT ||--o{ USER_TENANT : agrupa
    TENANT ||--o{ ROLE : define
    TENANT ||--o{ TERM : configura
    TENANT ||--o{ GRADING_SCALE : configura
    TENANT ||--o{ CERTIFICATE_TEMPLATE : configura
    TENANT ||--o{ TENANT_FEATURE : habilita

    USER ||--o{ USER_TENANT : pertenece
    USER_TENANT ||--o{ USER_ROLE : tiene
    ROLE ||--o{ ROLE_PERMISSION : otorga
    PERMISSION ||--o{ ROLE_PERMISSION : usado_en

    TERM ||--o{ COURSE : contiene
    COURSE ||--o{ SECTION : tiene
    COURSE ||--o{ MODULE : organiza
    MODULE ||--o{ LESSON : contiene
    LESSON ||--o{ RESOURCE : incluye
    MODULE ||--o{ MODULE_PREREQUISITE : requiere

    SECTION ||--o{ ENROLLMENT : matricula
    USER ||--o{ ENROLLMENT : se_matricula
    ENROLLMENT }o--|| USER_ROLE : usa_rol_en_curso

    COURSE ||--o{ ASSESSMENT : define
    ASSESSMENT ||--o{ QUESTION : contiene
    ASSESSMENT ||--o{ SUBMISSION : recibe
    SUBMISSION ||--o{ SUBMISSION_ANSWER : contiene
    SUBMISSION ||--o| GRADE : produce

    COURSE ||--o{ GRADEBOOK_CATEGORY : agrupa
    GRADEBOOK_CATEGORY ||--o{ ASSESSMENT : pondera
    GRADING_SCALE ||--o{ COURSE : aplica_a

    ENROLLMENT ||--o{ ATTENDANCE_RECORD : registra
    ENROLLMENT ||--o{ CERTIFICATE : puede_generar
    CERTIFICATE_TEMPLATE ||--o{ CERTIFICATE : usa

    USER ||--o{ AUDIT_LOG : genera

    TENANT {
        uuid id PK
        string name
        string plan
        jsonb branding
        string default_locale
        string timezone
        timestamptz created_at
    }
    USER {
        uuid id PK
        string email
        string password_hash
        string global_status
        jsonb profile
    }
    USER_TENANT {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        string status
    }
    ROLE {
        uuid id PK
        uuid tenant_id FK "null = rol base del sistema"
        string name
        boolean is_system_role
    }
    PERMISSION {
        uuid id PK
        string resource
        string action
    }
    USER_ROLE {
        uuid id PK
        uuid user_tenant_id FK
        uuid role_id FK
        uuid scope_course_id FK "nullable: alcance a nivel de curso"
    }
    TERM {
        uuid id PK
        uuid tenant_id FK
        string name
        date start_date
        date end_date
    }
    COURSE {
        uuid id PK
        uuid tenant_id FK
        uuid term_id FK
        string code
        string title
        uuid grading_scale_id FK
    }
    SECTION {
        uuid id PK
        uuid course_id FK
        string name
        jsonb schedule
        int capacity
    }
    MODULE {
        uuid id PK
        uuid course_id FK
        string title
        int order
    }
    LESSON {
        uuid id PK
        uuid module_id FK
        string title
        text content
    }
    RESOURCE {
        uuid id PK
        uuid lesson_id FK
        string type "video|pdf|scorm|link|doc"
        string storage_url
        jsonb metadata
    }
    ENROLLMENT {
        uuid id PK
        uuid section_id FK
        uuid user_id FK
        string status "active|dropped|completed"
        timestamptz enrolled_at
    }
    ASSESSMENT {
        uuid id PK
        uuid course_id FK
        uuid gradebook_category_id FK
        string type "exam|assignment|forum|rubric"
        jsonb config
        numeric max_points
        int max_attempts
    }
    QUESTION {
        uuid id PK
        uuid assessment_id FK
        string type "mcq|open|tf|matching"
        jsonb body
        jsonb correct_answer
        numeric points
    }
    SUBMISSION {
        uuid id PK
        uuid assessment_id FK
        uuid user_id FK
        int attempt_number
        timestamptz submitted_at
        string status
    }
    SUBMISSION_ANSWER {
        uuid id PK
        uuid submission_id FK
        uuid question_id FK
        jsonb answer
        numeric score
        text feedback
    }
    GRADE {
        uuid id PK
        uuid submission_id FK
        numeric raw_score
        numeric final_score
        string letter_grade
        boolean published
    }
    GRADEBOOK_CATEGORY {
        uuid id PK
        uuid course_id FK
        string name
        numeric weight_pct
        int drop_lowest
    }
    GRADING_SCALE {
        uuid id PK
        uuid tenant_id FK
        string name
        string type "vigesimal|centesimal|literal"
        jsonb bands
        int decimal_rounding
    }
    ATTENDANCE_RECORD {
        uuid id PK
        uuid enrollment_id FK
        date session_date
        string status "present|absent|late|excused"
        string method "manual|qr"
    }
    CERTIFICATE_TEMPLATE {
        uuid id PK
        uuid tenant_id FK
        string name
        text html_template
        jsonb dynamic_fields
    }
    CERTIFICATE {
        uuid id PK
        uuid tenant_id FK
        uuid enrollment_id FK
        uuid template_id FK
        string verification_code UK
        string pdf_url
        timestamptz issued_at
        boolean revoked
    }
    TENANT_FEATURE {
        uuid id PK
        uuid tenant_id FK
        string feature_key
        boolean enabled
        jsonb config
    }
    AUDIT_LOG {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        string action
        jsonb payload
        timestamptz created_at
    }
```

## 2.2 Notas de diseño relevantes

- **`USER` es global, `USER_TENANT` es la membresía**: una misma persona (mismo email/identidad) puede pertenecer a varios tenants (ej. un docente que dicta en dos institutos distintos) sin duplicar cuentas. La tabla `USER_TENANT` es la que carga `tenant_id` y por tanto queda sujeta a RLS; `USER` vive en un esquema "global" fuera de RLS por tenant (accesible solo por el Core API para resolución de identidad, nunca expuesto tal cual vía API a un tenant).
- **`USER_ROLE.scope_course_id` nullable** resuelve el requerimiento "mismo usuario con roles distintos en cursos distintos": un rol puede asignarse a nivel de tenant completo (`scope_course_id = null`, ej. Admin de entidad) o acotado a un curso/sección específico (ej. Docente en el curso X, Estudiante en el curso Y).
- **`GRADING_SCALE` y `CERTIFICATE_TEMPLATE` son de tenant, no globales**: cada entidad educativa define sus propias escalas (vigesimal/centesimal/literal) y plantillas, sin tocar código ni pedir soporte.
- **`CERTIFICATE.verification_code` es único globalmente** (no solo por tenant) porque la URL/QR pública de verificación (`stokalms.com/verify/{code}`) no lleva contexto de tenant en la ruta.
- **Campos `jsonb`** (`branding`, `config`, `bands`, `dynamic_fields`, `payload`) se usan deliberadamente para configuración específica de tenant que cambia de forma más ágil que el esquema relacional (colores de marca, bandas de nota, campos dinámicos de certificado), evitando migraciones por cada nueva opción de personalización.
- **`AUDIT_LOG`** registra acciones sensibles (cambios de nota, emisión/revocación de certificado, cambios de permisos, exportaciones) — requerido por la Ley N° 29733 (Perú) y equivalentes (GDPR) para trazabilidad de tratamiento de datos personales.
