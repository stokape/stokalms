// ============================================================================
// file-validation.ts — Allowlist de tipos de archivo aceptados + verificación
// de "magic bytes" (los primeros bytes reales del archivo, no el
// Content-Type que declara el cliente en el formulario multipart, que
// cualquiera puede escribir lo que quiera). Ver la auditoría de seguridad,
// hallazgo F-03 / SECURITY-03: antes, los 4 endpoints de subida (recursos de
// lección, adjuntos de matrícula, foto de perfil, logo/fondo institucional)
// solo limitaban el TAMAÑO del archivo, nunca el tipo — cualquiera con
// permiso de subir contenido podía alojar un .html/.svg con script embebido,
// un ejecutable, o cualquier otra cosa.
//
// DOS CAPAS, a propósito:
//   1) "fileFilter" de Multer (ver *.controller.ts) — rechaza temprano según
//      el Content-Type DECLARADO, antes de terminar de leer el archivo.
//      Barata, pero un atacante puede mentir en ese header.
//   2) "verifyMagicBytes" (esta funcion) — se llama en el SERVICIO, ya con
//      el buffer completo en memoria, y confirma que el contenido REAL
//      coincide con algún formato de la allowlist correspondiente. Esta es
//      la que de verdad importa: un archivo que declare "image/png" pero
//      cuyos primeros bytes sean los de un ejecutable se rechaza aca.
//
// Deliberadamente SIN una librería de sniffing de terceros (ej. "file-type"):
// esa misma librería tiene una CVE de denegación de servicio activa (ver la
// auditoría, sección Dependencias) — una allowlist chica y explícita de los
// formatos que esta plataforma realmente necesita es más simple de razonar
// y no depende de codigo de terceros para una decision de seguridad.
// ============================================================================

import { BadRequestException } from '@nestjs/common';

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

// Recursos de lección: video, PDF, paquetes SCORM (.zip), imágenes y los
// formatos de oficina que un Docente sube como material (ver
// inferResourceType en resource.service.ts, que ya distinguía estos MISMOS
// mimetypes para elegir el ícono — esta es la version que ademas RECHAZA
// cualquier otro).
export const RESOURCE_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

// Sustentos de matrícula (ej. carta de retiro, certificado médico): PDF,
// imágenes (una foto del documento) y los formatos de oficina más comunes
// — nunca video/SCORM, que no tiene sentido como "sustento".
export const ATTACHMENT_MIME_TYPES = [
  ...IMAGE_MIME_TYPES,
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

type MimeAllowlist = readonly string[];

// "fileFilter" de Multer: se ejecuta ANTES de terminar de recibir el
// archivo, contra el Content-Type que el cliente declaró en el formulario.
// Es la primera barrera (barata, pero spoofeable) — ver verifyMagicBytes
// para la que de verdad importa.
export function mimeAllowlistFilter(allowed: MimeAllowlist) {
  return (
    _req: unknown,
    file: { mimetype: string },
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!allowed.includes(file.mimetype)) {
      callback(
        new BadRequestException(
          `Tipo de archivo no permitido ("${file.mimetype}"). Tipos aceptados: ${allowed.join(', ')}.`,
        ),
        false,
      );
      return;
    }
    callback(null, true);
  };
}

// Firmas ("magic bytes") de los formatos que esta plataforma acepta —
// suficientes para las categorías de RESOURCE_MIME_TYPES/ATTACHMENT_MIME_TYPES
// de arriba. "text/csv" queda deliberadamente afuera: texto plano no tiene
// bytes mágicos que verificar (cualquier secuencia de texto es "válida"),
// así que para ese único tipo se sigue confiando en el Content-Type
// declarado + la extension — limitación conocida y aceptable dado que un
// CSV no es un formato con riesgo de ejecución.
const MAGIC_SIGNATURES: Array<{ mimeTypes: string[]; matches: (buf: Buffer) => boolean }> = [
  { mimeTypes: ['image/jpeg'], matches: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mimeTypes: ['image/png'],
    matches: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  { mimeTypes: ['image/gif'], matches: (b) => b.length >= 4 && b.subarray(0, 4).toString('ascii') === 'GIF8' },
  {
    mimeTypes: ['image/webp'],
    matches: (b) =>
      b.length >= 12 &&
      b.subarray(0, 4).toString('ascii') === 'RIFF' &&
      b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
  { mimeTypes: ['application/pdf'], matches: (b) => b.length >= 4 && b.subarray(0, 4).toString('ascii') === '%PDF' },
  {
    // ZIP crudo (SCORM, .zip) y todos los formatos "Office Open XML"
    // modernos (.docx/.pptx/.xlsx) — son contenedores ZIP por dentro.
    mimeTypes: [
      'application/zip',
      'application/x-zip-compressed',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    matches: (b) =>
      b.length >= 4 &&
      b[0] === 0x50 && b[1] === 0x4b &&
      ((b[2] === 0x03 && b[3] === 0x04) || (b[2] === 0x05 && b[3] === 0x06) || (b[2] === 0x07 && b[3] === 0x08)),
  },
  {
    // Formato "OLE Compound File" — los .doc/.xls/.ppt viejos (pre-2007).
    mimeTypes: ['application/msword', 'application/vnd.ms-powerpoint', 'application/vnd.ms-excel'],
    matches: (b) =>
      b.length >= 8 &&
      b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0 &&
      b[4] === 0xa1 && b[5] === 0xb1 && b[6] === 0x1a && b[7] === 0xe1,
  },
  {
    // MP4/MOV: la caja "ftyp" empieza en el byte 4, no en el 0.
    mimeTypes: ['video/mp4'],
    matches: (b) => b.length >= 8 && b.subarray(4, 8).toString('ascii') === 'ftyp',
  },
  {
    // WebM/Matroska: firma EBML.
    mimeTypes: ['video/webm'],
    matches: (b) => b.length >= 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
  },
];

// Confirma que el CONTENIDO real del archivo (no lo que el cliente dijo que
// era) coincide con el mimetype declarado. Lanza BadRequestException si no
// coincide con ninguna firma conocida para ese mimetype — incluye el caso
// de un mimetype que ni siquiera está en MAGIC_SIGNATURES (ej. "text/csv"),
// donde se deja pasar sin verificar contenido (ver la nota arriba).
export function verifyMagicBytes(buffer: Buffer, declaredMimeType: string): void {
  const signature = MAGIC_SIGNATURES.find((s) => s.mimeTypes.includes(declaredMimeType));
  if (!signature) {
    // No tenemos una firma para este mimetype (ej. text/csv) — no es un
    // formato con riesgo de contenido ejecutable, se deja pasar.
    return;
  }
  if (!signature.matches(buffer)) {
    throw new BadRequestException(
      `El contenido del archivo no coincide con el tipo declarado ("${declaredMimeType}"). ` +
        'Puede estar corrupto o el tipo fue falseado.',
    );
  }
}
