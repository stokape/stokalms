# 4. Flujos críticos

## 4.1 Matrícula (individual y masiva)

```mermaid
sequenceDiagram
    participant COORD as Coordinador académico
    participant WEB as Web App
    participant API as Core API
    participant Q as Cola (BullMQ)
    participant W as Worker
    participant DB as PostgreSQL
    participant MAIL as Notificaciones

    alt Matrícula individual
        COORD->>WEB: Busca/crea estudiante y sección
        WEB->>API: POST /enrollments {userId, sectionId}
        API->>DB: valida capacidad de sección, RLS tenant
        API->>DB: INSERT enrollment
        API->>MAIL: encola notificación de bienvenida
        API-->>WEB: 201 Created
    else Matrícula masiva (CSV/Excel)
        COORD->>WEB: Sube archivo CSV/XLSX
        WEB->>API: POST /enrollments/bulk-import (multipart)
        API->>DB: guarda archivo en S3, crea job "import"
        API->>Q: encola ImportEnrollmentsJob
        API-->>WEB: 202 Accepted + jobId
        W->>Q: consume job
        W->>W: parsea filas, valida (email, sección, duplicados)
        loop por cada fila válida
            W->>DB: crea/vincula USER_TENANT + ENROLLMENT
        end
        W->>DB: guarda reporte de errores por fila
        W->>MAIL: notifica a estudiantes matriculados
        WEB->>API: GET /imports/{jobId}/status (polling o WebSocket)
        API-->>WEB: progreso + reporte descargable de errores
    end
```

Consideraciones:
- La importación masiva corre en un **worker asíncrono**, nunca en el request HTTP, porque un CSV de miles de filas (típico en matrícula de universidad) excede tiempos razonables de respuesta HTTP.
- Errores por fila (email inválido, sección llena, duplicado) se acumulan en un **reporte descargable** en vez de abortar todo el lote (importación *best-effort* con detalle de fallos).
- Integración con sistemas externos (SIS/ERP del tenant) reutiliza el mismo endpoint `bulk-import` vía webhook/API, o un conector dedicado en fases posteriores (ver [roadmap](06-roadmap.md)).

## 4.2 Ciclo de evaluación y calificación

```mermaid
sequenceDiagram
    participant DOC as Docente
    participant EST as Estudiante
    participant API as Core API
    participant DB as PostgreSQL
    participant CAS as Motor de calificación

    DOC->>API: POST /courses/{id}/assessments (tipo, preguntas, rúbrica, ponderación)
    API->>DB: crea ASSESSMENT + QUESTIONS + vincula GRADEBOOK_CATEGORY

    EST->>API: POST /assessments/{id}/submissions (intento N)
    API->>DB: valida max_attempts, ventana de tiempo
    API->>DB: crea SUBMISSION + SUBMISSION_ANSWER (por pregunta)

    alt Evaluación auto-calificable (opción múltiple, V/F, emparejamiento)
        API->>CAS: calcula score comparando correct_answer
        CAS-->>API: score parcial y total
        API->>DB: INSERT GRADE (published = config.auto_publish)
    else Evaluación manual (respuesta abierta, tarea, foro, rúbrica)
        API->>DB: SUBMISSION queda en estado "pending_review"
        DOC->>API: PATCH /submissions/{id}/grade (score por ítem, feedback, rúbrica)
        API->>DB: INSERT/UPDATE GRADE (published = false hasta publicar)
    end

    DOC->>API: POST /courses/{id}/gradebook/publish
    API->>DB: recalcula nota final por categoría ponderada, escala del tenant
    API->>DB: UPDATE grades SET published = true
    API->>MAIL: notifica publicación de notas
    EST->>API: GET /courses/{id}/grades (ve nota, feedback, historial de intentos)
```

Reglas de negocio clave:
- **Ponderación por categoría**: `nota_final_curso = Σ (promedio_categoria_i × weight_pct_i)`, con soporte de `drop_lowest` (descarta las N notas más bajas de una categoría, típico en "prácticas calificadas").
- **Política de recuperación**: configurable por curso (ej. "el examen de recuperación reemplaza la nota más baja del rubro Exámenes"), modelada como una regla adicional evaluada en el mismo paso de recálculo, no como caso especial hardcodeado.
- **Redondeo y escala**: aplicados en el último paso, usando `GRADING_SCALE` del curso (vigesimal/centesimal/literal + `decimal_rounding`), nunca en pasos intermedios, para evitar arrastre de error de redondeo.
- **Historial de intentos**: cada `SUBMISSION` es inmutable una vez enviada; un reintento crea una nueva fila con `attempt_number` incremental, preservando auditoría completa.

## 4.3 Emisión y verificación de certificados

```mermaid
sequenceDiagram
    participant SYS as Trigger (fin de curso / cron)
    participant API as Core API
    participant Q as Cola
    participant W as Worker de certificados
    participant S3 as Object Storage
    participant PUB as Público (verificador)

    SYS->>API: evalúa criterios por matrícula (nota mínima, % asistencia, módulos completos)
    API->>API: filtra ENROLLMENT que cumplen criterios y sin certificado emitido
    API->>Q: encola GenerateCertificateJob por cada matrícula elegible

    W->>Q: consume job
    W->>W: genera verification_code único (UUID corto + checksum)
    W->>W: renderiza CERTIFICATE_TEMPLATE (HTML) con campos dinámicos (nombre, curso, fecha, firmas, logo, colores) vía Playwright headless
    W->>W: genera QR apuntando a stokalms.com/verify/{verification_code}
    W->>S3: sube PDF final
    W->>API: INSERT CERTIFICATE (pdf_url, verification_code, issued_at)
    API->>API: notifica al estudiante (descarga disponible)

    PUB->>API: GET /verify/{verification_code}  (endpoint público, sin auth)
    API->>API: valida existencia, revoked=false
    API-->>PUB: datos públicos mínimos (nombre, curso, entidad, fecha, estado) — sin exponer notas ni datos sensibles
```

Consideraciones:
- Emisión desacoplada del flujo síncrono: se dispara por cron/evento (cierre de curso, cambio de estado de matrícula a "completed") y se procesa en background, porque generar cientos/miles de PDFs con render headless es costoso.
- **Revocación**: un Admin de entidad puede marcar `revoked = true` (ej. fraude académico detectado); el endpoint público refleja el estado inmediatamente — nunca se borra el registro, por trazabilidad.
- El endpoint de verificación es **público e intencionalmente minimalista**: expone solo lo necesario para validar autenticidad (no debe convertirse en una fuga de datos académicos completos).
