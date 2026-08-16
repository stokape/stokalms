// ============================================================================
// sample-templates.ts — Galería de diseños de certificado listos para usar.
// Antes, quien creaba una plantilla solo tenía un bloque de HTML de ejemplo
// (mínimo, sin diseño real) para copiar y modificar a mano — alguien sin
// conocimientos de HTML/CSS no tenía forma de saber cómo se vería el
// resultado sin publicar una plantilla y emitir un certificado de prueba.
//
// Estas muestras son HTML completo y autocontenido (mismos placeholders que
// reemplaza certificate-renderer.service.ts, ver PLANTILLA_DE_EJEMPLO en
// page.tsx) pensado para poder VERSE tal cual en el <iframe sandbox=""> de
// la vista previa, y para poder usarse como punto de partida real con solo
// hacer clic en "Usar esta plantilla" — no son solo capturas de pantalla.
//
// Deliberadamente solo 2 (antes habia 5: se sacaron "Minimalista",
// "Profesional" y "Elegante" por pedido explicito, para no dejar una fila
// suelta de 2 en la grilla de 3 columnas de page.tsx — ver el ajuste a
// "sm:grid-cols-2" ahi mismo). Ninguna de las 2 que quedan usa el logo real
// de la institucion ({{institutionLogo}}/{{institutionName}}) — ese
// placeholder solo aparecia en las que se sacaron.
// ============================================================================

export interface SampleTemplate {
  key: string;
  label: string;
  description: string;
  html: string;
}

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    key: 'clasico',
    label: 'Clásico',
    description: 'Borde doble dorado, tipografía serif — el diseño tradicional de diploma.',
    html: `<html>
<head>
<style>
  body { margin: 0; font-family: Georgia, 'Times New Roman', serif; background: #faf6ec; }
  .marco { margin: 18px; padding: 50px 60px; border: 3px double #b8860b; text-align: center; }
  .kicker { letter-spacing: 4px; font-size: 13px; color: #b8860b; text-transform: uppercase; }
  h1 { margin: 10px 0 30px; font-size: 34px; color: #2b2b2b; }
  .otorga { font-size: 14px; color: #555; }
  .nombre { margin: 8px 0 26px; font-size: 30px; color: #1a1a1a; border-bottom: 1px solid #b8860b; display: inline-block; padding-bottom: 6px; }
  .curso { font-size: 18px; color: #333; margin-bottom: 30px; }
  .curso strong { color: #b8860b; }
  .pie { display: flex; justify-content: space-between; align-items: center; margin-top: 40px; font-size: 12px; color: #777; }
</style>
</head>
<body>
  <div class="marco">
    <div class="kicker">Certificado de Finalización</div>
    <h1>Se otorga el presente certificado a</h1>
    <div class="otorga">por haber completado exitosamente</div>
    <div class="nombre">{{studentName}}</div>
    <div class="curso">el curso <strong>{{courseTitle}}</strong></div>
    <div class="pie">
      <span>Emitido el {{issueDate}}</span>
      <span>{{qrCode}}</span>
      <span>Código: {{verificationCode}}</span>
    </div>
  </div>
</body>
</html>`,
  },
  {
    key: 'moderno',
    label: 'Moderno',
    description: 'Banda de color sólido, tipografía sans-serif en negrita — look corporativo.',
    html: `<html>
<head>
<style>
  body { margin: 0; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background: #ffffff; color: #1a1a2e; }
  .banda { background: #4f46e5; color: #ffffff; padding: 28px 50px; }
  .banda .kicker { font-size: 12px; letter-spacing: 3px; text-transform: uppercase; opacity: 0.85; }
  .banda h1 { margin: 6px 0 0; font-size: 28px; }
  .cuerpo { padding: 40px 50px; }
  .otorga { font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }
  .nombre { margin: 6px 0 20px; font-size: 32px; font-weight: 700; color: #4f46e5; }
  .curso { font-size: 17px; margin-bottom: 30px; }
  .pie { display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #e5e7eb; padding-top: 18px; font-size: 12px; color: #6b7280; }
</style>
</head>
<body>
  <div class="banda">
    <div class="kicker">Certificado de Finalización</div>
    <h1>{{courseTitle}}</h1>
  </div>
  <div class="cuerpo">
    <div class="otorga">Otorgado a</div>
    <div class="nombre">{{studentName}}</div>
    <div class="curso">por completar satisfactoriamente el curso, evaluado el {{issueDate}}.</div>
    <div class="pie">
      <span>Verificación: {{verificationCode}}</span>
      <span>{{qrCode}}</span>
    </div>
  </div>
</body>
</html>`,
  },
];
