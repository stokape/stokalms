# Manual para Docentes, Coordinadores académicos y Administradores

Esta guía explica qué puedes hacer en Stoka LMS si tu rol es **Docente**, **Coordinador académico** o
**Administrador de entidad**. Si todavía no iniciaste sesión ninguna vez, primero sigue la guía
[Primeros pasos](primeros-pasos.md).

## Qué puede hacer cada rol

No los tres roles ven exactamente las mismas opciones. Esta tabla resume qué está disponible para
cada uno HOY en la plataforma (según tu institución, el administrador puede haberte asignado más de
un rol a la vez):

| Acción | Docente | Coordinador académico | Administrador de entidad |
|---|:---:|:---:|:---:|
| Crear un Periodo académico, un Curso o una Sección nueva | No | Sí | Sí |
| Ver los cursos y sus secciones | Sí | Sí | Sí |
| Ver la lista de matriculados de una sección (certificado, avance y anotaciones incluidos) | Sí | Sí | Sí |
| Matricular estudiantes (una por una o en lote por CSV), marcar una matrícula como completada | No¹ | Sí | Sí |
| Retirar a un estudiante (con un archivo de sustento opcional) | No¹ | Sí | Sí |
| Ver y subir/editar módulos, lecciones, archivos y enlaces de un curso | Sí | Sí² | Sí |
| Ver, crear evaluaciones/preguntas y calificar respuestas abiertas | Sí | No | Sí |
| Tomar asistencia de una sección | Sí | No³ | Sí |
| Ver el "Avance" de un alumno (lecciones vistas, evaluaciones rendidas, asistencia, nota parcial) | No | Sí | Sí |
| Agregar anotaciones de desempeño por alumno | Sí | No | Sí |
| Editar el perfil (contacto/residencia) de un alumno | No | Sí | Sí |
| Ver las notas finales de un curso | Sí | Sí | Sí |
| Emitir un certificado | No⁴ | Sí | Sí |
| Revocar un certificado | No | Sí | Sí |
| Ver el catálogo de plantillas de certificado | Sí | Sí | Sí |
| Crear una plantilla de certificado nueva | No | Sí | Sí |
| Cambiar el nombre, logo y fondo de la institución | No | No | Sí |
| Asignar o quitar roles a otras personas | No | No | Sí |

¹ Si eres Docente y necesitas matricular o retirar a alguien, pídele a un Coordinador académico o
Administrador que lo haga — ves la lista de matriculados de tus secciones, pero los formularios de
matricular/retirar no aparecen para tu rol.

² El Coordinador académico puede crear/editar/borrar módulos, lecciones y recursos igual que un
Docente — pensado como "contingencia": permite dar de alta un curso completo (contenido incluido)
incluso antes de que haya un Docente asignado, o completar lo que todavía falte.

³ El Coordinador académico VE el registro de asistencia (dentro de "Avance"), pero no la toma — marcar
presente/ausente/tarde/justificado en el día a día es tarea del Docente.

⁴ Un Docente ve, en la lista de matriculados de sus secciones, quién ya obtuvo su certificado — pero no
lo emite: eso queda en manos del Coordinador académico o el Administrador.

El menú de arriba solo muestra los enlaces que tu rol puede usar — si no ves "Plantillas de
certificado", "Configuración de marca" o "Usuarios y roles", es porque tu rol no los necesita, no un
error. Igualmente, si intentas algo que tu rol no permite (por ejemplo, escribiendo la dirección a
mano), la plataforma te va a mostrar un mensaje claro de "no tienes permiso" en lugar de dejarte
continuar.

## Crear un Periodo académico, un Curso y una Sección

*(Coordinador académico y Administrador de entidad)*

Antes de matricular a nadie, tiene que existir el Periodo académico, después el Curso, y por último
al menos una Sección — en ese orden:

1. Haz clic en **"Periodos académicos"**, en el menú de arriba. Completa un **nombre** (ej. "2026 -
   Semestre I") y sus fechas de **inicio** y **fin**, y haz clic en **"Crear periodo"**.
2. Haz clic en **"Cursos"** → **"Crear curso"**. Elige el periodo que acabas de crear, completa un
   **código** (ej. "CONT-101") y un **nombre**. La escala de notas y la plantilla de certificado son
   opcionales aquí — se pueden asignar después, desde el detalle del curso.
3. Entra al curso recién creado y haz clic en **"Crear sección"**. Completa un nombre (ej. "Sección A
   - Turno Mañana") y, si quieres, un cupo máximo (déjalo en 0 para "sin límite").

Recién con al menos una sección creada vas a poder matricular estudiantes ahí (ver más abajo).

## Ver los cursos de tu institución

1. Haz clic en **"Cursos"**, en el menú de arriba.
2. Vas a ver la lista de todos los cursos con su código y su nombre.
3. Haz clic en cualquier curso para ver el detalle: sus secciones (si tu rol lo permite) y el enlace
   a sus notas finales.

## Ver y subir el contenido de un curso

*(Docente, Coordinador académico y Administrador de entidad)*

Un Coordinador académico tiene acceso completo a esta pantalla igual que un Docente — pensado como
"contingencia": permite armar un curso completo (módulos, lecciones, archivos) incluso antes de que
haya un Docente asignado, o completar lo que todavía falte. Las evaluaciones, en cambio, siguen siendo
exclusivas del Docente (y del Administrador).

El contenido de un curso se organiza en **Módulos**, y cada módulo tiene **Lecciones**; dentro de cada
lección puedes agregar **Recursos** (archivos o enlaces).

1. Entra al detalle de un curso y haz clic en **"Ver contenido del curso"**.
2. Completa **"Crear un módulo nuevo"** (ej. "Módulo 1 - Introducción") y haz clic en **"Crear"**.
3. Entra al módulo y crea una **lección** (título y, si quieres, el texto de la lección).
4. Dentro de la lección vas a encontrar dos formularios:
   - **"Subir un archivo"**: elige un **PDF**, **Word**, **Excel**, **PowerPoint**, una **imagen**
     (JPG/PNG), un **video**, o un paquete **SCORM** comprimido en `.zip` — la plataforma detecta el
     tipo automáticamente y no hace falta convertir nada a otro formato antes de subirlo.
   - **"Agregar un enlace"**: para una clase en vivo (Zoom, Meet) o un video externo (YouTube):
     completa un título y la dirección web (URL).

Los archivos y enlaces que subas quedan disponibles para cualquiera matriculado en el curso, con un
enlace de descarga/visualización directo.

Un módulo también puede agrupar sus propias **tareas y evaluaciones** — al entrar a un módulo vas a
ver, además de sus lecciones, la sección "Tareas y evaluaciones de este módulo" con un enlace para
crear una evaluación nueva ya ubicada ahí (en vez de quedar "suelta" a nivel del curso).

### Editar un módulo, una lección o un recurso ya creado

Ya no hace falta borrar y volver a crear algo para corregirlo:

- En la lista de módulos (o de lecciones dentro de un módulo), al lado de cada uno vas a ver un campo
  de texto con su nombre actual y un botón **"Guardar"** — cambia el texto y haz clic para renombrarlo.
- Dentro de una lección, el texto y el título tienen su propio formulario de edición arriba de todo,
  con un botón **"Guardar cambios"**.
- Cada recurso (archivo o enlace) tiene, debajo, un formulario para corregir su **título**,
  **descripción** y, si es un enlace externo, su **URL** — haz clic en **"Guardar"** al lado de cada
  uno. Un archivo subido (video, PDF, SCORM) se puede renombrar así, pero no "reemplazar" el archivo en
  sí: para eso hay que borrarlo y subir uno nuevo.

## Ver y gestionar la matrícula de una sección

1. Entra a **Cursos** → elige un curso → elige una sección.
2. Vas a ver la lista de estudiantes matriculados, con su estado (**Activo**, **Retirado** o
   **Completado**), si ya tienen un **certificado vigente** ("Vigente" o "Sin emitir", al lado de un
   enlace para ver el detalle), y un enlace **"Ver"** en la columna "Anotaciones" para leer o agregar
   observaciones de desempeño sobre ese alumno.

*(Coordinador académico y Administrador de entidad, además de lo anterior:)*

3. Columnas extra que solo ve tu rol:
   - **"Avance"**: enlace **"Ver"** con las lecciones vistas, evaluaciones rendidas, asistencia y nota
     parcial de ese alumno.
   - **"Perfil"**: enlace **"Editar"** para corregir el teléfono, dirección, departamento, provincia o
     distrito de ese alumno (ver la sección más abajo).
4. Para cambiar el estado de un estudiante, usá los enlaces de la columna "Acciones":
   - **"Marcar completado"** cuando el estudiante terminó el curso (esto es lo que después habilita
     emitir su certificado).
   - **"Retirar"** si el estudiante deja el curso antes de terminarlo — opcionalmente, elige un archivo
     (ej. una carta de retiro escaneada) justo antes de hacer clic en "Retirar", y queda guardado como
     sustento. Puedes ver o agregar sustentos más tarde con el enlace **"Ver sustentos"** de esa misma
     fila, aunque no estés retirando a nadie en ese momento.
5. Para matricular a alguien nuevo, completa el formulario **"Matricular estudiante"** al final de la
   página:
   - Escribe su **email**.
   - Si es la primera vez que esa persona aparece en la plataforma, escribe también su **nombre
     completo** (si ya tiene cuenta, no hace falta — la plataforma va a usar el nombre que ya tiene
     registrado).
   - Haz clic en **"Matricular"**.

Una matrícula nunca se borra del todo: "retirar" a alguien solo cambia su estado, para que la
institución conserve el historial completo de quién estuvo matriculado alguna vez.

### Matricular varios estudiantes a la vez (CSV)

Si tienes una lista grande (por ejemplo, todo un salón), no hace falta cargarlos uno por uno:

1. En la misma pantalla de la sección, bajá hasta **"Matricular varios a la vez (CSV)"**.
2. Preparé un archivo de texto con dos columnas separadas por coma, una fila por estudiante:
   ```
   email,nombre completo
   ana.perez@ejemplo.com,Ana Pérez
   luis.gomez@ejemplo.com,Luis Gómez
   ```
   (el nombre completo solo hace falta para quien todavía no tiene cuenta en la plataforma).
3. Elige el archivo y haz clic en **"Subir CSV"**.
4. Al terminar, vas a ver cuántos se matricularon correctamente. Si alguna fila tuvo un problema (un
   email mal escrito, alguien ya matriculado, la sección sin cupo), esa fila en particular se informa
   aparte — el resto del archivo se procesa igual, no se pierde por un solo error.

## Tomar asistencia de una sección

*(Docente y Administrador de entidad)*

1. Entra a la sección correspondiente y haz clic en **"Tomar asistencia"**, arriba de todo.
2. Por defecto se muestra la fecha de hoy — para revisar u corregir otro día, cambia la fecha y haz
   clic en **"Ver"**.
3. Vas a ver un select por cada alumno **activo** de la sección, con las opciones **Presente**,
   **Ausente**, **Tarde** o **Justificado**.
4. Elige el estado de cada uno y haz clic en **"Guardar asistencia"** — se guarda toda la sección de
   una sola vez.

Volver a guardar la misma fecha corrige lo que ya habías marcado ese día, en vez de duplicarlo.

## Agregar anotaciones de desempeño

*(Docente y Administrador de entidad)*

A diferencia de una nota, una anotación no califica nada — es un comentario de seguimiento libre sobre
cómo viene un alumno (por ejemplo, "mejoró mucho su participación" o "no entregó la tarea 3").

1. Entra a la sección correspondiente y haz clic en **"Ver"**, en la columna "Anotaciones", al lado
   del alumno que te interesa.
2. Vas a ver todas las anotaciones anteriores, con quién las escribió y cuándo.
3. Escribe una nueva en el cuadro de texto de abajo y haz clic en **"Agregar anotación"**.

Cualquier anotación se puede borrar con el enlace **"Eliminar"**, si ya no hace falta conservarla.

## Ver el avance de un alumno

*(Coordinador académico y Administrador de entidad)*

1. Entra a la sección correspondiente y haz clic en **"Ver"**, en la columna "Avance".
2. Vas a ver cuatro datos de un vistazo:
   - **Lecciones vistas**: cuántas de las lecciones del curso ya abrió, sobre el total.
   - **Evaluaciones rendidas**: cuántas evaluaciones ya entregó, sobre el total del curso.
   - **Asistencia**: cuántas clases marcadas como presente/tarde tiene, sobre el total de clases con
     asistencia tomada.
   - **Nota parcial**: su nota calculada con lo que ya está calificado hasta el momento (no hace falta
     esperar a que termine el curso ni a que se "publiquen" las notas).

Si algún dato dice "no disponible", es porque todavía no hay suficiente información para calcularlo
(por ejemplo, el curso no tiene escala de notas asignada, o todavía no se tomó asistencia).

## Editar el perfil de un alumno

*(Coordinador académico y Administrador de entidad)*

1. Entra a la sección correspondiente y haz clic en **"Editar"**, en la columna "Perfil".
2. Vas a poder corregir su **nombre**, **apellido**, **número de contacto**, **dirección**,
   **departamento**, **provincia** y **distrito**.
3. Haz clic en **"Guardar cambios"**.

El propio alumno ve estos mismos datos (de solo lectura) en su "Mi perfil" — si algo está mal, ahora ya
no hace falta corregirlo a mano en la base de datos.

Como Coordinador académico o Administrador, tu propio **"Mi perfil"** también te deja corregir estos
mismos datos (no solo la foto) — el mismo permiso que te deja editar el de cualquier alumno aplica
también sobre ti mismo.

## Ver las notas finales de un curso

1. Haz clic en **"Notas"**, en el menú de arriba, para ver todos los cursos de un vistazo (o entra al
   detalle de un curso y haz clic en **"Ver notas finales del curso"** — llegas al mismo lugar).
2. Si tu institución tiene varios periodos académicos, puedes elegir uno en **"Periodo académico"** para
   acotar la lista de cursos (déjalo en "Todos" para ver todos los periodos juntos).
3. Elige el curso que te interesa.
4. Vas a ver una tabla con cada estudiante, su **sección** y su nota final, ya calculada según la
   escala y las categorías de calificación de ese curso. Si el curso tiene más de una sección, aparece
   un selector de **"Sección"** arriba de la tabla para ver solo una a la vez.

Si algún estudiante no aparece en la tabla, o ves una advertencia de que le falta alguna categoría,
significa que todavía no tiene calificaciones registradas en esa parte del curso — revisalo con el
docente correspondiente.

## Crear una evaluación, agregar preguntas y calificar

*(Docente y Administrador de entidad)*

1. Entra al detalle de un curso y haz clic en **"Ver evaluaciones"**.
2. Si el curso todavía no tiene ninguna **categoría de notas** (ej. "Exámenes", "Tareas"), la pantalla
   te va a pedir crear una primero — define un nombre y qué porcentaje pesa en la nota final.
3. Completa **"Crear una evaluación nueva"**: tipo (examen, tarea, foro o rúbrica), categoría, puntaje
   máximo y cuántos intentos permite. Marca la casilla de publicación automática si quieres que la nota
   quede visible para el estudiante apenas se corrija, sin esperar a "publicar notas" del curso.
4. Entra a la evaluación recién creada y agrega preguntas con **"Agregar una pregunta"**: elige el tipo
   (opción múltiple, verdadero/falso, emparejamiento o respuesta abierta) y completa solo los campos
   que correspondan a ese tipo — para opción múltiple, una opción por línea y cuáles son las correctas;
   para emparejamiento, los elementos de cada columna y qué línea de la izquierda va con cuál de la
   derecha.
5. Cuando un estudiante entrega, las preguntas de opción múltiple, verdadero/falso y emparejamiento se
   corrigen **solas**. Las de **respuesta abierta** aparecen en la sección **"Entregas"**, al final de
   la pantalla, con un formulario para ponerles un puntaje y un comentario opcional.

## Emitir un certificado

*(Coordinador académico y Administrador de entidad)*

Solo se puede emitir un certificado para una matrícula que ya esté en estado **Completado**, y para un
curso que ya tenga una **plantilla de certificado asignada** (ver la nota más abajo).

1. Entra a la sección correspondiente y busca al estudiante en la tabla de matriculados.
2. Haz clic en el estado del certificado ("Vigente" o "Sin emitir"), en la columna "Certificado".
3. Si todavía no tiene ningún certificado vigente, vas a ver el botón **"Emitir certificado"** — haz
   clic ahí. Ya no hace falta elegir una plantilla en este paso: se usa automáticamente la que tenga
   asignada el curso.
4. El certificado se genera al instante, con un código de verificación único y un PDF descargable.

Si el curso todavía no tiene ninguna plantilla asignada, la plataforma te va a avisar — ve al
detalle del curso (ver "Crear un Periodo académico, un Curso y una Sección", más arriba) y asígnale
una desde ahí.

Si el estudiante ya tiene un certificado vigente para esa matrícula, la plataforma no te va a dejar
emitir otro — primero hay que revocar el anterior.

Un Docente entra a esta misma pantalla y ve el mismo estado ("Vigente"/"Sin emitir") y el PDF si ya
existe, pero no ve el formulario de emisión — eso queda para Coordinador académico o Administrador.

## Revocar un certificado

*(Coordinador académico y Administrador de entidad)*

1. Entra a los certificados de la matrícula correspondiente (ver el paso anterior).
2. Al lado del certificado vigente que quieres anular, haz clic en **"Revocar"**.
3. El certificado pasa a estado "Revocado" — sigue existiendo (para que se pueda seguir consultando su
   historial), pero cualquiera que lo verifique va a ver que ya no es válido.

## Crear una plantilla de certificado

*(Coordinador académico y Administrador de entidad)*

Una plantilla es el diseño (formato) que van a tener los certificados de tu institución: qué texto,
colores y datos van a aparecer.

1. Haz clic en **"Plantillas de certificado"**, en el menú de arriba.
2. Completa el formulario **"Crear plantilla"**:
   - **Nombre de la plantilla**: un nombre para identificarla (ej. "Certificado de finalización
     estándar").
   - **Diseño**: el formato del certificado. La plataforma ya trae un ejemplo precargado que puedes
     editar. Los siguientes textos especiales se reemplazan automáticamente por los datos reales de
     cada estudiante al emitir su certificado — no los borres, solo movelos o dales estilo si hace
     falta:
     - `{{studentName}}` → el nombre del estudiante.
     - `{{courseTitle}}` → el nombre del curso.
     - `{{issueDate}}` → la fecha de emisión.
     - `{{verificationCode}}` → el código de verificación único.
     - `{{qrCode}}` → el código QR de verificación.
3. Haz clic en **"Crear plantilla"**.

Si tu institución necesita un diseño más elaborado (con logo, colores institucionales, firmas
digitalizadas), ese diseño se escribe en HTML — pídele ayuda a quien administra técnicamente tu
instalación de Stoka LMS para armarlo la primera vez.

Crear la plantilla es solo el primer paso — todavía hace falta **asignarla a cada curso** que la vaya a
usar (un curso, una plantilla fija; ver "Crear un Periodo académico, un Curso y una Sección", más
arriba, y el formulario de "Asignar" en el detalle de cada curso) antes de poder emitir certificados
para él.

## Personalizar el nombre, logo y fondo de tu institución

*(Administrador de entidad)*

1. Haz clic en **"Configuración de marca"**, en el menú de arriba.
2. Arriba de todo, completa el **nombre** de la institución y, si quieres, un **color de fondo** de
   respaldo (por ejemplo, "#0f172a" — se usa solo mientras no subas una imagen de fondo) y haz clic en
   **"Guardar nombre y color"**.
3. Más abajo, elige un archivo de imagen y haz clic en **"Subir logo"** — no hace falta ninguna
   dirección web, se sube directo desde tu computadora, igual que la foto de perfil.
4. Haz lo mismo en **"Imagen de fondo"** si quieres una foto de fondo en vez de (o además del) color.
   La imagen de fondo, si existe, siempre se ve por encima del color.

Estos datos son lo primero que ve cualquier persona que entre a la dirección web de tu institución,
antes de iniciar sesión — abre la página de inicio en otra pestaña después de guardar para ver cómo
quedó.

## Asignar roles a otras personas

*(Administrador de entidad)*

1. Haz clic en **"Usuarios y roles"**, en el menú de arriba.
2. Vas a ver a todas las personas que ya forman parte de tu institución (se agregan solas la primera
   vez que se matriculan en un curso o inician sesión), con los roles que tiene cada una.
3. Para darle un rol nuevo a alguien, elígelo en el desplegable de esa persona — opcionalmente, puedes
   acotarlo a un solo curso (por ejemplo, un Docente que solo debería tener ese permiso en SU curso) —
   y haz clic en **"Asignar rol"**.
4. Para quitarle un rol, haz clic en **"Quitar"** al lado del rol correspondiente.

Los cambios quedan vigentes al instante — la persona no necesita cerrar sesión ni esperar nada.

## Ver y actualizar tu perfil

1. Haz clic en **"Mi perfil"**, en el menú de arriba.
2. Vas a ver tu nombre, apellido, email, número de contacto, dirección, departamento, provincia,
   distrito y la fecha en la que te uniste a la institución — son de **solo lectura** desde aquí.
3. Lo único que puedes cambiar tú mismo es tu **foto**: elige una imagen y haz clic en **"Subir
   foto"**.

## Si no encuentras una pantalla que esperabas

Hoy la plataforma todavía no tiene, en pantalla, cómo crear cursos o períodos académicos nuevos — esas
partes las gestiona quien administra técnicamente tu instalación de Stoka LMS.

Para cualquier otro problema, revisa la guía [Resolución de problemas](resolucion-de-problemas.md).
