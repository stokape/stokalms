# Stoka LMS explicado sin tecnicismos

## Para quién es este documento

Este documento explica **lo mismo que la documentación técnica de arquitectura** (carpeta `docs/architecture/`), pero sin jerga de programación. Está pensado para directores de instituto, coordinadores académicos, dueños de academias, personal administrativo o cualquier persona que necesite entender **qué va a poder hacer la plataforma, cómo funciona por dentro en términos simples, y qué tan segura y confiable es** — sin necesidad de saber qué es una base de datos o una API.

Usaremos ejemplos con instituciones y personas inventadas: el **Instituto San Martín** (mediano, 3,000 estudiantes) y la **Academia TechFuturo** (pequeña, 80 estudiantes), junto con personas como María (estudiante), el profesor Carlos, y Gabriela (coordinadora académica).

Al final hay un **glosario** que traduce cada término técnico a lenguaje simple, por si en algún momento hablas con el equipo de desarrollo y quieres entender de qué están hablando.

---

## 1. La idea central: un edificio con muchos inquilinos

Imagina un **centro comercial**. El edificio es uno solo — misma estructura, mismos ascensores, misma seguridad en la entrada — pero cada tienda dentro tiene su propia vitrina, su propia decoración, su propio personal y sus propias cajas registradoras. Un cliente que entra a la tienda A nunca ve el inventario ni las ventas de la tienda B, aunque ambas compartan el mismo edificio.

Stoka LMS funciona igual: es **una sola plataforma**, pero cada institución educativa (cada "inquilino", en inglés *tenant*) tiene:
- Su propio nombre, logo y colores.
- Sus propios cursos, estudiantes, docentes y calificaciones — **totalmente invisibles** para cualquier otra institución.
- Su propia dirección web, por ejemplo `sanmartin.stokalms.com` o incluso `campus.institutosanmartin.edu.pe` si la institución ya tiene su propio dominio.
- Su propia configuración: idioma, escala de notas, husos horarios, plantillas de certificado.

**¿Por qué construirlo así y no una plataforma separada para cada institución?** Porque así el mantenimiento, las mejoras de seguridad y las nuevas funciones se hacen **una sola vez** y benefician a todos los inquilinos al mismo tiempo — igual que cuando el centro comercial arregla el aire acondicionado, todas las tiendas se benefician sin que cada una tenga que instalar el suyo.

Para instituciones muy grandes (universidades de más de 50,000 estudiantes) o que por contrato necesiten mayor separación física de sus datos, existe la opción de darles **su propia "bodega" separada dentro del mismo edificio** (una base de datos dedicada) — como una tienda ancla de un centro comercial que tiene su propio almacén aparte, aunque siga compartiendo el edificio y la seguridad general.

---

## 2. Cómo se organiza el contenido académico

Cada institución arma su oferta educativa en capas, de lo más general a lo más específico:

```
Periodo académico (ej. "2026 - Semestre I")
  └─ Curso (ej. "Contabilidad Básica")
       └─ Sección (ej. "Sección A - Turno Mañana", con horario y cupo máximo)
            └─ Módulo (ej. "Módulo 3: Estados Financieros")
                 └─ Lección (ej. "Lección 1: El Balance General")
                      └─ Recursos (un video, un PDF, un enlace, un archivo SCORM)
```

**Ejemplo**: la Academia TechFuturo crea el periodo "2026 - Ciclo II", dentro de él el curso "Diseño Gráfico Nivel 1", con dos secciones (mañana y tarde). Dentro del curso arma 5 módulos; el módulo 2 no se desbloquea hasta que el estudiante completa el módulo 1 — esto se llama **prerequisito** y sirve para forzar una ruta de aprendizaje ordenada, muy útil en cursos de capacitación técnica donde un tema depende del anterior.

Los recursos pueden ser: videos, documentos PDF, enlaces externos, documentos de Office, o paquetes **SCORM** (un formato estándar de contenido interactivo que se compra o se produce con herramientas como Articulate o iSpring, y que "simplemente funciona" dentro de cualquier LMS compatible, incluido el nuestro).

---

## 3. Cómo entran los estudiantes: matrícula

Hay dos formas de matricular estudiantes:

**Matrícula individual**: la coordinadora Gabriela busca al estudiante (o lo crea si es nuevo) y lo asigna a una sección con un par de clics. Ideal para altas puntuales durante el ciclo.

**Matrícula masiva**: cuando empieza un nuevo ciclo y hay que matricular a 500 estudiantes de golpe, Gabriela simplemente **sube un archivo de Excel o CSV** con columnas como *nombre, email, sección*. El sistema:
1. Revisa el archivo fila por fila.
2. Matricula a todos los que están correctos.
3. Genera un **reporte de errores** descargable con las filas que fallaron (por ejemplo, "fila 45: la sección ya no tiene cupo", "fila 78: ese email ya está matriculado en esa sección") — así Gabriela corrige solo esas filas puntuales en vez de que todo el proceso falle por un solo error.
4. Cada estudiante matriculado recibe automáticamente un correo de bienvenida.

Este mismo mecanismo se puede conectar más adelante con el sistema propio de matrícula que ya tenga la institución (su ERP académico), para que la matrícula masiva se alimente automáticamente sin subir el archivo a mano.

---

## 4. Evaluaciones y calificaciones — ejemplo completo

Sigamos al profesor Carlos, que dicta "Contabilidad Básica" en el Instituto San Martín.

### 4.1 Creando una evaluación
Carlos crea un examen de opción múltiple con 20 preguntas (cada una vale 1 punto), y por separado una tarea de entrega de archivo (un caso práctico) que él calificará manualmente sobre 20 puntos con una rúbrica.

### 4.2 El libro de calificaciones (gradebook)
Antes de eso, Carlos configuró cómo se pondera cada tipo de evaluación en su curso:

| Categoría | Peso en la nota final |
|---|---|
| Exámenes | 50% |
| Tareas | 30% |
| Participación en foros | 20% |

También activó una regla: *"se descarta la nota más baja de la categoría Tareas"* — común cuando hay varias tareas a lo largo del ciclo y se quiere ser flexible con un mal día del estudiante.

La institución, además, definió su propia **escala de notas** (esto lo hace una sola vez el Admin del instituto, no cada profesor): en el Instituto San Martín se califica sobre 20 (escala *vigesimal*, como es común en Perú), con un decimal de redondeo. La Academia TechFuturo, en cambio, eligió calificar sobre 100 (*centesimal*). Cada institución ve y usa su propia escala sin afectar a las demás.

### 4.3 María rinde el examen
María, estudiante, responde el examen de opción múltiple. Como es de opción múltiple, el sistema **corrige automáticamente** apenas ella entrega, comparando sus respuestas contra las correctas, y le muestra su nota al instante (si Carlos configuró publicación automática) o la deja pendiente hasta que Carlos revise el resto del curso.

Para la tarea de entrega de archivo, María sube su documento. Como es de calificación manual, queda "pendiente de revisión" — Carlos entra días después, la lee, le pone nota por cada criterio de la rúbrica y escribe retroalimentación en texto.

### 4.4 Publicar notas
Cuando Carlos termina de calificar todo el bloque, presiona **"Publicar notas"**. En ese momento el sistema:
1. Toma todas las notas de exámenes de María, descarta ninguna (no aplica la regla ahí), promedia y pesa 50%.
2. Toma sus notas de tareas, descarta la más baja, promedia y pesa 30%.
3. Toma su participación en foros, pesa 20%.
4. Suma todo, aplica la escala vigesimal del instituto con un decimal de redondeo.
5. María ve su nota final del curso, con el detalle de cómo se calculó cada parte — nunca una nota "misteriosa" sin explicación.

Si María repite un examen (por una política de recuperación que Carlos configuró), el sistema **guarda el historial completo de todos sus intentos**, no borra el anterior — importante para trazabilidad y para resolver reclamos.

---

## 5. Certificados automáticos y verificables

Cuando María termina el curso "Contabilidad Básica" cumpliendo los criterios que el instituto definió (por ejemplo: nota final mínima de 14/20, y al menos 80% de asistencia), el sistema **genera su certificado automáticamente**, sin que nadie tenga que acordarse de hacerlo manualmente uno por uno.

### Cómo se ve el certificado
El Instituto San Martín diseñó su propia plantilla de certificado desde el panel de administración (sin pedirle nada a un programador): subió su logo, eligió sus colores institucionales, escribió el texto ("Por haber culminado satisfactoriamente..."), y definió qué firma va (la del director académico). Los datos de cada estudiante (nombre, curso, fecha, nota si aplica) se rellenan automáticamente en esa plantilla.

### Verificación de autenticidad
Cada certificado lleva un **código QR único**. Si una empresa contratante quiere confirmar que el certificado de María es real y no fue falsificado en Photoshop, simplemente escanea el QR con su celular. Esto abre una página pública (sin necesidad de usuario ni contraseña) que muestra: nombre del estudiante, curso, institución, fecha de emisión, y si el certificado sigue vigente o fue anulado. **No muestra la nota ni ningún otro dato sensible** — solo lo mínimo necesario para confirmar que es auténtico.

Si más adelante se detecta una irregularidad (por ejemplo, un caso de fraude académico comprobado), el instituto puede **anular** el certificado desde el panel; nunca se borra el registro, pero la página de verificación pasa a mostrar "certificado anulado" — así queda todo trazado, nunca desaparece la evidencia.

Todos los certificados emitidos quedan en un **historial** consultable por la institución en cualquier momento, exportable en PDF.

---

## 6. Quién puede hacer qué: roles y permisos

Piensa en esto como un **llavero con distintas llaves**: cada persona recibe solo las llaves que necesita para su trabajo, ni una más.

| Rol | Qué puede hacer (ejemplos) |
|---|---|
| **Super Admin** (el proveedor de la plataforma) | Da de alta nuevas instituciones, resuelve problemas técnicos graves. No entra a ver las notas ni el contenido de ninguna institución en el día a día |
| **Administrador de la institución** | Configura el logo y colores, define la escala de notas, crea usuarios, decide qué funciones están activas, crea roles nuevos a la medida |
| **Coordinador académico** | Crea periodos y cursos, matricula estudiantes (individual y masivamente), ve reportes de todos los cursos |
| **Docente** | Crea contenido y evaluaciones de sus cursos, califica, publica notas, genera certificados de sus estudiantes |
| **Estudiante** | Ve el contenido de los cursos en los que está matriculado, entrega evaluaciones, ve sus propias notas y certificados |
| **Padre/Apoderado** (opcional) | Solo puede *ver* el progreso, notas y asistencia de su hijo/pupilo — no puede editar nada |
| **Auditor/Invitado** | Acceso de solo lectura, útil para procesos de acreditación externa |

### Ejemplo de un caso especial que el sistema resuelve bien
El profesor Carlos también está matriculado como **estudiante** en un curso de actualización docente que dicta el propio instituto. El sistema le permite tener el rol de "Docente" en su curso de Contabilidad y el rol de "Estudiante" en el curso de actualización, **al mismo tiempo, sin conflicto** — porque los permisos no son "una etiqueta fija para la persona", sino "qué puede hacer esta persona, en este curso específico".

### Personalización de roles por institución
La Academia TechFuturo es pequeña y quiere que sus docentes también puedan matricular estudiantes directamente (una tarea que en el Instituto San Martín solo hace la coordinación). Sin pedirle nada a un programador, el Admin de TechFuturo entra al panel, edita el rol "Docente" y le agrega el permiso "matricular estudiantes". Cada institución ajusta la lupa de responsabilidades a su propia realidad organizativa.

---

## 7. Cada institución se ve y se configura a su manera

Sin tocar una sola línea de código, cada Admin de institución puede, desde un panel de configuración:

- **Branding**: subir su logo, elegir sus colores institucionales, y usar su propio subdominio (`academia.stokalms.com`) o incluso su propio dominio si ya tiene uno (`campus.miacademia.edu.pe`).
- **Estructura académica propia**: nombres de sus periodos ("Semestre", "Ciclo", "Trimestre" — cada institución le llama distinto), su escala de notas, su idioma preferido, su zona horaria.
- **Encender o apagar funciones** según el plan contratado: por ejemplo, la Academia TechFuturo (plan básico) no tiene activado el módulo de asistencia con QR, mientras que el Instituto San Martín (plan superior) sí.
- **Plantillas de notificaciones por correo y de certificados**, editables visualmente, sin depender de un desarrollador.

---

## 8. Funcionalidades complementarias

- **Notificaciones**: por correo, y más adelante también push (avisos en el celular) y dentro de la propia plataforma. Ejemplo: María recibe un correo cuando Carlos publica las notas del examen.
- **Mensajería interna**: un canal directo docente-estudiante dentro de la plataforma, sin depender de WhatsApp o correo personal.
- **Asistencia**: se puede tomar lista manualmente, o (en fases posteriores) escaneando un código QR que el docente proyecta al inicio de la clase.
- **Calendario académico**: integra automáticamente las fechas de entrega de tareas y exámenes, para que estudiantes y docentes vean todo en un solo lugar.
- **Panel de analíticas**: le muestra a un coordinador, por ejemplo, qué estudiantes llevan varias semanas sin entrar a la plataforma (señal de posible abandono), para poder intervenir a tiempo.
- **Videoconferencia**: enlaces a Zoom o Google Meet integrados dentro del curso; en fases posteriores, la propia plataforma podrá crear la reunión automáticamente.
- **Inicio de sesión institucional (SSO)**: si el Instituto San Martín ya usa Google Workspace o Microsoft para todos sus correos, sus estudiantes y docentes pueden entrar a Stoka LMS con esa misma cuenta, sin crear una contraseña nueva — y esto lo configura el propio instituto, no requiere que el proveedor de la plataforma intervenga.

---

## 9. Qué tan segura y confiable es la plataforma

Explicado sin jerga:

- **La información viaja cifrada**: es como enviar una carta dentro de un sobre sellado en vez de una postal abierta — nadie que intercepte el tráfico en el camino puede leer los datos.
- **La información se guarda cifrada**: incluso si alguien accediera físicamente a los discos donde vive la base de datos, no podría leer la información sin la llave de cifrado.
- **Cada acción sensible queda registrada**: si alguien cambia una nota, emite o anula un certificado, o modifica permisos, queda un registro de quién lo hizo y cuándo — como las cámaras de seguridad de un banco, pero para acciones dentro del sistema.
- **Cumplimiento de protección de datos personales**: la plataforma está diseñada pensando en la Ley N° 29733 de Protección de Datos Personales (Perú) y en estándares equivalentes como el GDPR europeo, incluyendo el derecho de una persona a pedir que se le muestren o eliminen sus datos.
- **Copias de seguridad (backups)**: es como si cada cierto tiempo se sacara una fotocopia completa de todos los archivos y se guardara en un lugar distinto — así, si algo falla gravemente en el sistema principal, se puede reconstruir todo desde esa copia. Estas copias se prueban periódicamente para confirmar que realmente funcionan cuando se necesitan, no solo que existen.
- **Disponibilidad del 99.9%**: en términos prácticos, esto significa que la plataforma podría estar fuera de servicio, en el peor de los casos, **menos de 9 horas al año** — el objetivo es que eso ocurra rara vez y de forma planificada (mantenimiento) en vez de caídas sorpresivas.
- **Accesibilidad**: la plataforma se construye siguiendo pautas internacionales (WCAG 2.1 AA) para que también puedan usarla personas con discapacidad visual, auditiva o motriz — por ejemplo, que un lector de pantalla pueda leer en voz alta el contenido a un estudiante con discapacidad visual.

---

## 10. Cómo se usa: celular, tablet o computadora

La plataforma se diseña para verse y funcionar bien en cualquier dispositivo, sin necesidad de instalar una aplicación desde una tienda de aplicaciones: se puede **"instalar" directamente desde el navegador** (esto se llama PWA) y queda como un ícono más en el celular, funcionando de forma similar a una app nativa. Una aplicación móvil "de verdad" (para las tiendas de Apple y Google) queda contemplada como mejora en una fase posterior, para cuando se necesiten funciones que solo una app nativa puede dar bien, como notificaciones push más ricas o uso parcial sin conexión a internet.

---

## 11. Plan de construcción: qué se entrega primero y qué después

Construir esta plataforma es como construir una casa: primero los cimientos y la estructura habitable, después las comodidades adicionales, y al final los acabados de lujo. No tendría sentido instalar aire acondicionado antes de tener paredes.

### Fase 1 — Lo esencial para operar (MVP)
Con esto, una institución **ya puede operar de principio a fin sin ayuda técnica**:
- Crear periodos, cursos, secciones, módulos y contenido.
- Matricular estudiantes (uno por uno o en lote con Excel).
- Crear exámenes y tareas, calificar, publicar notas con su propia escala.
- Emitir certificados automáticos con QR de verificación.
- Configurar su logo, colores, idioma y roles básicos.
- Recibir notificaciones por correo.
- Un asistente guiado de primeros pasos, para no depender de que alguien del equipo técnico les explique cómo empezar.

*Es como mudarse a una casa ya habitable: tiene paredes, techo, agua y luz — se puede vivir ahí, aunque falten algunos detalles.*

### Fase 2 — Más comodidad e integración con el resto del ecosistema de la institución
- Roles y permisos totalmente a la medida (crear roles nuevos, no solo editar los existentes).
- Rúbricas más avanzadas, foros calificables, más tipos de pregunta.
- Mensajería interna, calendario académico, asistencia con QR.
- Notificaciones push (avisos en el celular) además del correo.
- Reportes básicos de progreso y participación.
- Inicio de sesión con la cuenta institucional (SSO) de Google o Microsoft, configurable por la propia institución.
- Editor visual de plantillas de certificado y notificaciones.

*Es como agregar closets a medida, mejores acabados y conectar la casa a la red de gas de la ciudad en vez de usar balones.*

### Fase 3 — Escala y funciones avanzadas
- Compatibilidad completa con contenido comprado a terceros en formato SCORM/xAPI (cursos interactivos producidos con herramientas externas).
- Analítica predictiva: alertas automáticas de riesgo de abandono antes de que sea evidente.
- Creación automática de reuniones de videoconferencia desde el curso.
- Aplicación móvil nativa.
- Opción de "bodega separada" (aislamiento físico de datos) para universidades muy grandes.
- Plantillas y estructuras de curso reutilizables entre instituciones (opcional).

*Es la fase de la piscina, el jardín paisajístico y la domótica — mejoras valiosas, pero que solo tienen sentido cuando la casa ya está construida y habitada.*

**¿Por qué en este orden?** Porque cada fase se paga con lo aprendido de la anterior: no tiene sentido invertir en analítica predictiva de abandono (fase 3) si todavía no hay instituciones usando el sistema día a día para generar los datos que esa analítica necesita.

---

## 12. Costos aproximados

Los costos varían según cuántos estudiantes y docentes tenga la institución, y cuánto contenido pesado (sobre todo video) suba:

| Tamaño de institución | Ejemplo | Costo aproximado de infraestructura al mes |
|---|---|---|
| Pequeña | Academia con ~50 usuarios | US$ 5 – 15 (comparte infraestructura con otras academias pequeñas, como comparten los gastos comunes de un edificio) |
| Mediana | Instituto con 2,000 – 5,000 usuarios | US$ 150 – 300 |
| Grande | Universidad con 50,000+ usuarios | US$ 1,500 – 3,500 (recursos dedicados, como tener su propio piso completo en el edificio) |

Estos son montos de referencia para planificar, no una cotización cerrada — el factor que más los mueve hacia arriba es la cantidad de **video** que se suba (los videos pesan mucho más que texto o PDFs), por lo que en instituciones con mucho contenido en video se recomienda usar un servicio externo especializado en vez de asumir ese costo directamente.

---

## Glosario: de técnico a simple

| Término técnico | En palabras simples |
|---|---|
| Tenant / inquilino | Cada institución educativa que usa la plataforma, con sus datos separados de las demás |
| Multi-tenant | Una sola plataforma compartida, usada por muchas instituciones sin que se mezclen sus datos |
| RBAC / roles y permisos | El "llavero" que define qué puede hacer cada tipo de usuario |
| Base de datos | El archivador central donde vive toda la información (cursos, notas, usuarios) |
| Row-Level Security (RLS) | Una cerradura extra en el archivador que impide, incluso por error, que una institución vea los archivos de otra |
| API | El "mesero" que lleva pedidos entre la pantalla que ves y el archivador de datos, y trae la respuesta de vuelta |
| Cache (caché) | Una libreta de apuntes rápidos con lo que se consulta más seguido, para no ir cada vez al archivador completo |
| Cola de trabajos / worker | La ventanilla especial del banco para trámites que toman tiempo (como generar 500 certificados), para que no se trabe la ventanilla normal |
| SCORM / xAPI | Un formato estándar para "empaquetar" cursos interactivos comprados a terceros, para que funcionen en cualquier plataforma compatible |
| SSO (inicio de sesión único) | Entrar a la plataforma con la misma cuenta de correo institucional que ya usas, sin crear otra contraseña |
| LTI | Un "enchufe estándar" para conectar herramientas educativas externas dentro de un curso |
| Backup | Copia de seguridad de toda la información, guardada aparte por si algo falla |
| Disponibilidad 99.9% | Objetivo de que el sistema esté funcionando prácticamente todo el tiempo, con muy pocas interrupciones al año |
| Feature flag | El interruptor que enciende o apaga una función específica para una institución, según su plan contratado |
| PWA | Una versión de la plataforma que se puede "instalar" desde el navegador como si fuera una app, sin pasar por una tienda de aplicaciones |
| WCAG / accesibilidad | El conjunto de reglas que aseguran que personas con alguna discapacidad también puedan usar la plataforma sin problema |

---

*Este documento acompaña a la documentación técnica completa en [`docs/architecture/`](architecture/README.md), que detalla cómo se implementa cada uno de estos conceptos a nivel de sistema.*
