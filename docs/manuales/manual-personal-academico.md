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
| Matricular estudiantes (una por una o en lote por CSV), retirarlos, marcar una matrícula como completada | No¹ | Sí | Sí |
| Ver y subir contenido de un curso (módulos, lecciones, archivos, enlaces) | Sí | No² | Sí |
| Ver, crear evaluaciones/preguntas y calificar respuestas abiertas | Sí | No² | Sí |
| Ver las notas finales de un curso | Sí | Sí | Sí |
| Emitir un certificado | Sí | Sí | Sí |
| Revocar un certificado | No | Sí | Sí |
| Ver el catálogo de plantillas de certificado | Sí | Sí | Sí |
| Crear una plantilla de certificado nueva | No | Sí | Sí |
| Cambiar el nombre, logo y fondo de la institución | No | No | Sí |
| Asignar o quitar roles a otras personas | No | No | Sí |

¹ Si sos Docente y necesitás matricular o retirar a alguien, pedile a un Coordinador académico o
Administrador que lo haga — hoy esa pantalla no está disponible para el rol Docente.

² El contenido y las evaluaciones de un curso las gestiona quien lo dicta (Docente) o un Administrador
de entidad — un Coordinador académico no tiene acceso a esas dos pantallas en absoluto (ni para ver).

Si intentás algo que tu rol no permite, la plataforma te va a mostrar un mensaje claro de "no tienes
permiso" en lugar de dejarte continuar — no es un error del sistema, es una protección a propósito.

## Ver los cursos de tu institución

1. Hacé clic en **"Cursos"**, en el menú de arriba.
2. Vas a ver la lista de todos los cursos con su código y su nombre.
3. Hacé clic en cualquier curso para ver el detalle: sus secciones (si tu rol lo permite) y el enlace
   a sus notas finales.

## Ver y subir el contenido de un curso

*(Docente y Administrador de entidad)*

El contenido de un curso se organiza en **Módulos**, y cada módulo tiene **Lecciones**; dentro de cada
lección podés agregar **Recursos** (archivos o enlaces).

1. Entrá al detalle de un curso y hacé clic en **"Ver contenido del curso"**.
2. Completá **"Crear un módulo nuevo"** (ej. "Módulo 1 - Introducción") y hacé clic en **"Crear"**.
3. Entrá al módulo y creá una **lección** (título y, si querés, el texto de la lección).
4. Dentro de la lección vas a encontrar dos formularios:
   - **"Subir un archivo"**: elegí un video, PDF o un paquete SCORM comprimido en `.zip` — la
     plataforma detecta el tipo automáticamente.
   - **"Agregar un enlace"**: para una clase en vivo (Zoom, Meet) o un video externo (YouTube):
     completá un título y la dirección web (URL).

Los archivos y enlaces que subas quedan disponibles para cualquiera matriculado en el curso, con un
enlace de descarga/visualización directo.

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

### Matricular varios estudiantes a la vez (CSV)

Si tenés una lista grande (por ejemplo, todo un salón), no hace falta cargarlos uno por uno:

1. En la misma pantalla de la sección, bajá hasta **"Matricular varios a la vez (CSV)"**.
2. Preparé un archivo de texto con dos columnas separadas por coma, una fila por estudiante:
   ```
   email,nombre completo
   ana.perez@ejemplo.com,Ana Pérez
   luis.gomez@ejemplo.com,Luis Gómez
   ```
   (el nombre completo solo hace falta para quien todavía no tiene cuenta en la plataforma).
3. Elegí el archivo y hacé clic en **"Subir CSV"**.
4. Al terminar, vas a ver cuántos se matricularon correctamente. Si alguna fila tuvo un problema (un
   email mal escrito, alguien ya matriculado, la sección sin cupo), esa fila en particular se informa
   aparte — el resto del archivo se procesa igual, no se pierde por un solo error.

## Ver las notas finales de un curso

1. Entrá al detalle de un curso.
2. Hacé clic en **"Ver notas finales del curso"**.
3. Vas a ver una tabla con cada estudiante y su nota final, ya calculada según la escala y las
   categorías de calificación de ese curso.

Si algún estudiante no aparece en la tabla, o ves una advertencia de que le falta alguna categoría,
significa que todavía no tiene calificaciones registradas en esa parte del curso — revisalo con el
docente correspondiente.

## Crear una evaluación, agregar preguntas y calificar

*(Docente y Administrador de entidad)*

1. Entrá al detalle de un curso y hacé clic en **"Ver evaluaciones"**.
2. Si el curso todavía no tiene ninguna **categoría de notas** (ej. "Exámenes", "Tareas"), la pantalla
   te va a pedir crear una primero — definí un nombre y qué porcentaje pesa en la nota final.
3. Completá **"Crear una evaluación nueva"**: tipo (examen, tarea, foro o rúbrica), categoría, puntaje
   máximo y cuántos intentos permite. Marcá la casilla de publicación automática si querés que la nota
   quede visible para el estudiante apenas se corrija, sin esperar a "publicar notas" del curso.
4. Entrá a la evaluación recién creada y agregá preguntas con **"Agregar una pregunta"**: elegí el tipo
   (opción múltiple, verdadero/falso, emparejamiento o respuesta abierta) y completá solo los campos
   que correspondan a ese tipo — para opción múltiple, una opción por línea y cuáles son las correctas;
   para emparejamiento, los elementos de cada columna y qué línea de la izquierda va con cuál de la
   derecha.
5. Cuando un estudiante entrega, las preguntas de opción múltiple, verdadero/falso y emparejamiento se
   corrigen **solas**. Las de **respuesta abierta** aparecen en la sección **"Entregas"**, al final de
   la pantalla, con un formulario para ponerles un puntaje y un comentario opcional.

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

## Asignar roles a otras personas

*(Administrador de entidad)*

1. Hacé clic en **"Usuarios y roles"**, en el menú de arriba.
2. Vas a ver a todas las personas que ya forman parte de tu institución (se agregan solas la primera
   vez que se matriculan en un curso o inician sesión), con los roles que tiene cada una.
3. Para darle un rol nuevo a alguien, elegilo en el desplegable de esa persona — opcionalmente, podés
   acotarlo a un solo curso (por ejemplo, un Docente que solo debería tener ese permiso en SU curso) —
   y hacé clic en **"Asignar rol"**.
4. Para quitarle un rol, hacé clic en **"Quitar"** al lado del rol correspondiente.

Los cambios quedan vigentes al instante — la persona no necesita cerrar sesión ni esperar nada.

## Si no encontrás una pantalla que esperabas

Hoy la plataforma todavía no tiene, en pantalla, cómo crear cursos o períodos académicos nuevos — esas
partes las gestiona quien administra técnicamente tu instalación de Stoka LMS.

Para cualquier otro problema, revisá la guía [Resolución de problemas](resolucion-de-problemas.md).
