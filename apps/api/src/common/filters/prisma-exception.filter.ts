// ============================================================================
// prisma-exception.filter.ts — Traduce errores de Prisma a respuestas HTTP
// claras, en UN SOLO LUGAR para toda la aplicacion.
//
// POR QUE EXISTE: Prisma lanza sus propios tipos de error (con un "codigo",
// ej. "P2003") cuando algo falla a nivel de base de datos — por ejemplo,
// intentar borrar un Periodo academico que todavia tiene Cursos asociados
// (ver los "onDelete: Restrict" agregados en schema.prisma tras detectar,
// probando de verdad, que el comportamiento por defecto -Cascade- borraba
// en silencio datos academicos reales). Sin este filtro, NestJS no sabe que
// hacer con ese error y responde un generico "500 Internal Server Error",
// sin explicar nada — igual de malo para quien consume la API que para
// quien la esta depurando.
//
// Un "Exception Filter" en NestJS es un lugar CENTRAL donde interceptar
// errores no capturados y decidir que respuesta HTTP mandar. Se registra
// UNA vez (ver main.ts) y aplica a TODOS los controladores — asi ningun
// servicio de negocio futuro (Enrollment, Assessment, Certificate...)
// necesita repetir try/catch para este mismo problema.
//
// Formato de respuesta: sigue el mismo estilo "Problem Details" descrito en
// docs/architecture/05-api-design.md, seccion 5.2.
// ============================================================================

import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Cada "codigo" de Prisma (ver https://pris.ly/d/prisma-schema-errors)
    // corresponde a un tipo de problema distinto; se traduce cada uno al
    // HttpException de NestJS que mejor lo representa, y se reutiliza el
    // manejo de respuesta estandar de NestJS para armar el body final.
    const translated = this.translate(exception);

    this.logger.warn(
      `Prisma ${exception.code} traducido a HTTP ${translated.getStatus()}: ${exception.message.split('\n').pop()}`,
    );

    response.status(translated.getStatus()).json(translated.getResponse());
  }

  private translate(exception: Prisma.PrismaClientKnownRequestError): HttpException {
    switch (exception.code) {
      // P2003: violacion de llave foranea. Es EXACTAMENTE lo que dispara un
      // "onDelete: Restrict" cuando existen filas hijas — ver la nota
      // extensa sobre esto en schema.prisma, modelo Course (campo "term").
      case 'P2003':
        return new ConflictException(
          'No se puede completar la operacion porque existen otros registros que dependen de este (por ejemplo, un periodo con cursos, o un curso con secciones). Elimina o reasigna esos registros primero.',
        );

      // P2025: Prisma no encontro la fila que se le pidio actualizar/borrar
      // (ej. alguien ya la habia borrado en otra pestaña un segundo antes).
      case 'P2025':
        return new NotFoundException('El registro que intentas modificar ya no existe.');

      // P2002: violacion de restriccion UNIQUE (ej. dos cursos con el mismo
      // "code" dentro del mismo tenant, si se agregara esa regla a futuro).
      case 'P2002': {
        const fields = (exception.meta?.target as string[] | undefined)?.join(', ');
        return new ConflictException(
          `Ya existe un registro con ese valor${fields ? ` (${fields})` : ''}.`,
        );
      }

      default:
        // Codigo de Prisma que todavia no mapeamos explicitamente: se deja
        // como 500, pero al menos queda en el log CUAL fue el codigo real,
        // para poder agregarle su propio "case" mas adelante en vez de
        // adivinar a partir de un mensaje generico.
        this.logger.error(`Codigo de Prisma sin traducir: ${exception.code}`);
        return new HttpException('Error interno al procesar la solicitud.', 500);
    }
  }
}
