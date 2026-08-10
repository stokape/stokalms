# Resolución de problemas

Guía rápida para los problemas más comunes al usar Stoka LMS. No necesitas conocimientos técnicos
para seguirla. Si después de probar lo de aquí el problema sigue, contacta primero al **coordinador
académico o administrador de tu institución** — ellos son quienes pueden revisar tu cuenta, tu
matrícula y tus permisos. Si el problema parece del sistema en general (la plataforma no carga para
nadie), ellos van a saber a quién avisar del lado técnico.

## No puedo iniciar sesión

- **"Usuario o contraseña incorrectos"**: revisa que estés escribiendo bien tu email (sin espacios) y
  la contraseña, con mayúsculas y minúsculas exactas. Las contraseñas distinguen mayúsculas de
  minúsculas.
- **Olvidé mi contraseña**: hoy la plataforma no tiene un botón de "olvidé mi contraseña" que te la
  restablezca sola. Pídele al administrador de tu institución que te asigne una contraseña nueva.
- **"Este dominio no corresponde a ninguna institución registrada"**: probablemente estés entrando por
  una dirección (URL) que no es la de tu institución. Confirma con tu coordinador cuál es la dirección
  correcta.
- La pantalla de acceso nunca aparece, o tarda muchísimo: puede ser un problema de conexión a
  internet, o que el sistema esté temporalmente fuera de servicio — prueba de nuevo en unos minutos y,
  si sigue igual, avisa a tu institución.

## Entré, pero no veo ningún curso ni matrícula

- Si eres estudiante y "Mis matrículas" aparece vacío: todavía no te matricularon en ningún curso.
  Pídele al coordinador académico que revise tu matrícula.
- Si eres docente o coordinador y "Cursos" aparece vacío: puede que tu institución todavía no haya
  cargado ningún curso, o que tu cuenta no tenga el rol correcto asignado — consulta con el
  administrador de tu institución.

## La pantalla dice "No tienes el permiso... en este contexto" (o algo parecido)

Este mensaje significa que tu rol actual no tiene autorización para esa acción específica — es una
protección a propósito, no un error del sistema. Por ejemplo:

- Un Estudiante no puede matricular a otros estudiantes ni emitir certificados: eso lo hace el
  personal académico.
- Un Docente no puede revocar certificados ni crear plantillas nuevas: eso lo hace un Coordinador
  académico o Administrador.

Si crees que SÍ deberías poder hacer esa acción, pídele al administrador de tu institución que revise
qué rol tienes asignado.

## No puedo emitir un certificado

- **"Esta matrícula está en estado... no 'completed'"**: solo se pueden emitir certificados para
  matrículas marcadas como **Completado**. Marca primero al estudiante como completado en la sección
  correspondiente (ver el [manual de personal académico](manual-personal-academico.md)).
- **"Esta matrícula ya tiene un certificado vigente"**: esa persona ya tiene un certificado activo para
  ese curso. Si necesitas emitir uno nuevo (por ejemplo, corregir un error), primero hay que
  **revocar** el certificado anterior.

## El código de verificación de un certificado dice "no encontrado"

- Revisa que copiaste el código completo, sin espacios extra al principio o al final.
- Si escaneaste un código QR y da error, puede que la imagen esté dañada o incompleta — pídele a la
  persona que emitió el certificado que te confirme el código exacto, o que te reenvíe el PDF.
- Si el certificado dice "Revocado" en vez de "no encontrado", significa que existe pero ya no es
  válido — no es un error de tu parte, contacta a la institución que lo emitió si tienes dudas.

## No puedo descargar el PDF de un certificado

El enlace de descarga es temporal (por seguridad, deja de funcionar después de un tiempo). Vuelve a la
página de certificados de esa matrícula y haz clic de nuevo en "Descargar PDF" para generar un enlace
nuevo.

## Inscribí mi institución y no recibo respuesta

La solicitud de alta (ver [Inscribir tu institución](inscribir-tu-institucion.md)) no se aprueba sola
ni al instante — alguien la tiene que revisar a mano, así que puede tardar. Si pasó bastante tiempo sin
noticias, revisa que el email de contacto que dejaste esté bien escrito, y si tienes otro medio de
contacto con Stoka LMS, escribe por ahí para confirmar que la solicitud llegó.

## "El subdominio ya está en uso" al inscribir mi institución

Otra institución ya eligió ese mismo subdominio (o ya hay otra solicitud pendiente con él). Vuelve a
[Inscribir tu institución](inscribir-tu-institucion.md) y elige una variante (por ejemplo, agregando la
ciudad o una sigla).

## Sube un CSV de matrícula masiva y algunas filas quedaron con error

Es normal: el resto del archivo se procesa igual, aunque alguna fila tenga un problema. Revisa el
detalle que aparece debajo del mensaje de éxito — dice exactamente qué fila falló y por qué (email mal
escrito, esa persona ya estaba matriculada, o la sección ya no tiene cupo). Corrige solo esas filas y
vuelve a subir un archivo nuevo con ellas.

## La sesión se cierra sola / me pide iniciar sesión de nuevo sin avisar

Por seguridad, la sesión tiene un tiempo límite. Si pasó bastante tiempo sin usar la plataforma, es
normal que te pida iniciar sesión de nuevo — solo repite los pasos de
[Primeros pasos](primeros-pasos.md).

## Veo un mensaje de error que parece técnico (menciona "backend", "servidor" o un código como "500")

Esto normalmente significa que el sistema tiene un problema temporario de conexión, no algo que
hiciste mal tú. Anota (o haz una captura de pantalla de) el mensaje completo y avísale a quien
administra técnicamente tu instalación de Stoka LMS — esa información les ayuda a resolverlo más
rápido.
