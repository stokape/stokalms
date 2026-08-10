// ============================================================================
// create-certificate-template.dto.ts — Body de
// "POST /api/v1/certificate-templates".
//
// Una plantilla es configuracion de TENANT (no de curso ni de certificado
// individual): cada institucion define las suyas una vez (con su propio
// logo, colores, textos legales) y las reutiliza para emitir certificados a
// distintos estudiantes/cursos (ver CertificateTemplate en schema.prisma).
// ============================================================================

import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCertificateTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string; // Ej. "Certificado de finalizacion estandar".

  // HTML completo de la plantilla, con placeholders de texto simple (NO un
  // motor de plantillas como Handlebars: certificate-renderer.service.ts
  // los reemplaza con un "replace" literal, ver el comentario alli sobre por
  // que esto es una simplificacion deliberada del MVP) que
  // certificate.service.ts reemplaza antes de convertir a PDF:
  //   {{studentName}}   -> nombre completo del estudiante
  //   {{courseTitle}}   -> nombre del curso
  //   {{issueDate}}     -> fecha de emision (formato largo en español)
  //   {{verificationCode}} -> codigo de verificacion
  //   {{qrCode}}        -> <img> con el QR de verificacion, ya como data URI
  //   {{institutionName}} -> nombre de la institucion (tenant activo)
  //   {{institutionLogo}} -> <img> con el logo de la institucion (ver
  //                          configuracion-marca), o vacio si todavia no
  //                          cargo ninguno — nunca un icono de imagen rota
  @IsString()
  @IsNotEmpty()
  htmlTemplate: string;

  // Lista informativa de que placeholders usa ESTA plantilla, pensada para
  // que un futuro editor visual en el panel sepa que variables ofrecer sin
  // tener que parsear el HTML (ver el campo homonimo en schema.prisma).
  @IsOptional()
  @IsArray()
  dynamicFields?: string[];
}
