// ============================================================================
// certificate-renderer.service.ts — Convierte una plantilla HTML + datos de
// un certificado en un PDF final, con su codigo QR de verificacion
// incrustado. Ver docs/architecture/04-flujos-criticos.md, seccion 4.3.
//
// SIMPLIFICACION DELIBERADA DEL MVP frente a lo documentado alli: el flujo
// completo describe una COLA (BullMQ) + un WORKER separado que consume los
// jobs de generacion de forma asincrona, para no bloquear la respuesta HTTP
// mientras se renderiza un PDF (que puede tardar uno o dos segundos). Aqui,
// certificate.service.ts llama a este renderer DIRECTAMENTE, dentro del
// mismo request que emite el certificado — funcionalmente correcto para el
// volumen de un MVP (emitir certificados no es una operacion de alta
// frecuencia), pero sin la cola todavia. Introducir BullMQ + un proceso
// worker separado es trabajo de infraestructura genuino (una cola nueva,
// un segundo proceso desplegado aparte, reintentos, manejo de fallos a
// mitad de camino) que se deja para cuando el volumen real lo justifique
// (ver README.md, seccion "Que sigue").
// ============================================================================

import { Injectable } from '@nestjs/common';
import { chromium } from 'playwright';
import * as QRCode from 'qrcode';

export interface CertificateRenderData {
  studentName: string;
  courseTitle: string;
  issueDate: Date;
  verificationCode: string;
  verificationUrl: string;
}

@Injectable()
export class CertificateRendererService {
  // Reemplaza los placeholders "{{campo}}" de la plantilla por los datos
  // reales del certificado. Es un "replace" literal, NO un motor de
  // plantillas (Handlebars, EJS, etc.): alcanza para el set fijo de campos
  // que hoy se ofrece (ver create-certificate-template.dto.ts) y evita
  // sumar una dependencia nueva solo para sustituir 5 valores. Si en el
  // futuro las plantillas necesitan logica condicional (ej. "si tiene
  // mencion honorifica, mostrar tal texto"), ESE es el momento de migrar a
  // un motor de plantillas de verdad.
  async render(htmlTemplate: string, data: CertificateRenderData): Promise<Buffer> {
    const qrDataUri = await QRCode.toDataURL(data.verificationUrl, { width: 200, margin: 1 });

    const formattedDate = data.issueDate.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const html = htmlTemplate
      .replaceAll('{{studentName}}', escapeHtml(data.studentName))
      .replaceAll('{{courseTitle}}', escapeHtml(data.courseTitle))
      .replaceAll('{{issueDate}}', formattedDate)
      .replaceAll('{{verificationCode}}', data.verificationCode)
      .replaceAll('{{qrCode}}', `<img src="${qrDataUri}" alt="Codigo QR de verificacion" />`);

    // Un browser Chromium por certificado: mas simple y aislado que
    // mantener una instancia compartida entre requests (que traeria
    // problemas de concurrencia si dos emisiones caen al mismo tiempo). El
    // costo de arrancar Chromium (~200-400ms) es aceptable mientras la
    // emision sea sincrona dentro del request (ver la nota de arriba sobre
    // la cola pendiente) — si eso cambia, este es el lugar a optimizar
    // primero (browser compartido + pool de paginas).
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle' });
      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true, landscape: true });
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }
}

// El nombre del estudiante y del curso vienen de la base de datos, no de un
// input HTTP directo del atacante, pero igual son texto libre que un
// Administrador de entidad podria escribir con caracteres especiales al
// crear un curso — escaparlos antes de insertarlos en HTML evita que un
// nombre como "<script>..." termine ejecutandose dentro del PDF renderizado.
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
