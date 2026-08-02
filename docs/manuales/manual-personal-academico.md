# Manual para Docentes, Coordinadores académicos y Administradores

Esta guía explica qué podés hacer en Stoka LMS si tu rol es **Docente**, **Coordinador académico** o
**Administrador de entidad**. Si todavía no iniciaste sesión ninguna vez, primero seguí la guía
[Primeros pasos](primeros-pasos.md).

## Qué puede hacer cada rol

No los tres roles ven exactamente las mismas opciones. Esta tabla resume qué está disponible para
cada uno HOY en la plataforma (según tu institución, el administrador puede haberte asignado más de
un rol a la vez):

| Acción | Docente | Coordinador académico | Administrador de entidad |
|---|:---:|:---:|:---:|
| Ver los cursos y sus secciones | Sí | Sí | Sí |
| Matricular estudiantes, retirarlos, marcar una matrícula como completada | No¹ | Sí | Sí |
| Ver las notas finales de un curso | Sí | Sí | Sí |
| Emitir un certificado | Sí | Sí | Sí |
| Revocar un certificado | No | Sí | Sí |
| Ver el catálogo de plantillas de certificado | Sí | Sí | Sí |
| Crear una plantilla de certificado nueva | No | Sí | Sí |
| Cambiar el nombre, logo y fondo de la institución | No | No | Sí |

¹ Si sos Docente y necesitás matricular o retirar a alguien, pedile a un Coordinador académico o
Administrador que lo haga — hoy esa pantalla no está disponible para el rol Docente.

Si intentás algo que tu rol no permite, la plataforma te va a mostrar un mensaje claro de "no tienes
permiso" en lugar de dejarte continuar — no es un error del sistema, es una protección a propósito.

## Ver los cursos de tu institución

1. Hacé clic en **"Cursos"**, en el menú de arriba.
2. Vas a ver la lista de todos los cursos con su código y su nombre.
3. Hacé clic en cualquier curso para ver el detalle: sus secciones (si tu rol lo permite) y el enlace
   a sus notas finales.

## Gestionar la matrícula de una sección

*(Coordinador académico y Administrador de entidad)*

1. Entrá a **Cursos** → elegí un curso → elegí una sección.
2. Vas a ver la lista de estudiantes matriculados, con su estado (**Activo**, **Retirado** o
   **Completado**).
3. Para cambiar el estado de un estudiante, usá los enlaces de la columna "Acciones":
   - **"Marcar completado"** cuando el estudiante terminó el curso (esto es lo que después habilita
     emitir su certificado).
   - **"Retirar"** si el estudiante deja el curso antes de terminarlo.
4. Para matricular a alguien nuevo, completá el formulario **"Matricular estudiante"** al final de la
   página:
   - Escribí su **email**.
   - Si es la primera vez que esa persona aparece en la plataforma, escribí también su **nombre
     completo** (si ya tiene cuenta, no hace falta — la plataforma va a usar el nombre que ya tiene
     registrado).
   - Hacé clic en **"Matricular"**.

Una matrícula nunca se borra del todo: "retirar" a alguien solo cambia su estado, para que la
institución conserve el historial completo de quién estuvo matriculado alguna vez.

## Ver las notas finales de un curso

1. Entrá al detalle de un curso.
2. Hacé clic en **"Ver notas finales del curso"**.
3. Vas a ver una tabla con cada estudiante y su nota final, ya calculada según la escala y las
   categorías de calificación de ese curso.

Si algún estudiante no aparece en la tabla, o ves una advertencia de que le falta alguna categoría,
significa que todavía no tiene calificaciones registradas en esa parte del curso — revisalo con el
docente correspondiente.

## Emitir un certificado

Solo se puede emitir un certificado para una matrícula que ya esté en estado **Completado**.

1. Entrá a la sección correspondiente y buscá al estudiante en la tabla de matriculados.
2. Hacé clic en **"Ver"**, en la columna "Certificados".
3. Si todavía no tiene ningún certificado vigente, vas a ver el formulario **"Emitir un nuevo
   certificado"**: elegí una plantilla de la lista y hacé clic en **"Emitir certificado"**.
4. El certificado se genera al instante, con un código de verificación único y un PDF descargable.

Si el estudiante ya tiene un certificado vigente para esa matrícula, la plataforma no te va a dejar
emitir otro — primero hay que revocar el anterior.

## Revocar un certificado

*(Coordinador académico y Administrador de entidad)*

1. Entrá a los certificados de la matrícula correspondiente (ver el paso anterior).
2. Al lado del certificado vigente que querés anular, hacé clic en **"Revocar"**.
3. El certificado pasa a estado "Revocado" — sigue existiendo (para que se pueda seguir consultando su
   historial), pero cualquiera que lo verifique va a ver que ya no es válido.

## Crear una plantilla de certificado

*(Coordinador académico y Administrador de entidad)*

Una plantilla es el diseño (formato) que van a tener los certificados de tu institución: qué texto,
colores y datos van a aparecer.

1. Hacé clic en **"Plantillas de certificado"**, en el menú de arriba.
2. Completá el formulario **"Crear plantilla"**:
   - **Nombre de la plantilla**: un nombre para identificarla (ej. "Certificado de finalización
     estándar").
   - **Diseño**: el formato del certificado. La plataforma ya trae un ejemplo precargado que podés
     editar. Los siguientes textos especiales se reemplazan automáticamente por los datos reales de
     cada estudiante al emitir su certificado — no los borres, solo movelos o dales estilo si hace
     falta:
     - `{{studentName}}` → el nombre del estudiante.
     - `{{courseTitle}}` → el nombre del curso.
     - `{{issueDate}}` → la fecha de emisión.
     - `{{verificationCode}}` → el código de verificación único.
     - `{{qrCode}}` → el código QR de verificación.
3. Hacé clic en **"Crear plantilla"**.

Si tu institución necesita un diseño más elaborado (con logo, colores institucionales, firmas
digitalizadas), ese diseño se escribe en HTML — pedile ayuda a quien administra técnicamente tu
instalación de Stoka LMS para armarlo la primera vez.

## Personalizar el nombre, logo y fondo de tu institución

*(Administrador de entidad)*

1. Hacé clic en **"Configuración de marca"**, en el menú de arriba.
2. Ahí podés cambiar:
   - El **nombre** de la institución.
   - La **URL del logo** (una dirección web donde esté guardada la imagen).
   - Un **color de fondo** (por ejemplo, "#0f172a") o una **URL de imagen de fondo**.
3. Hacé clic en **"Guardar cambios"**.

Estos datos son lo primero que ve cualquier persona que entre a la dirección web de tu institución,
antes de iniciar sesión — abrí la página de inicio en otra pestaña después de guardar para ver cómo
quedó.

## Si no encontrás una pantalla que esperabas

Hoy la plataforma todavía no tiene, en pantalla, cómo crear cursos o períodos académicos nuevos, cómo
armar el contenido de un curso (lecciones, materiales), ni cómo crear preguntas de examen o calificar
una entrega manualmente — esas partes están en construcción y, mientras tanto, las gestiona quien
administra técnicamente tu instalación de Stoka LMS.

Para cualquier otro problema, revisá la guía [Resolución de problemas](resolucion-de-problemas.md).
