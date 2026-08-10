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
// "Profesional" y "Elegante" son las 2 que ademas usan el logo REAL de la
// institucion ({{institutionLogo}}/{{institutionName}}, ver la nota en
// create-certificate-template.dto.ts) — en esta vista previa generica (sin
// un tenant real detras) ese placeholder se ve tal cual entre llaves, igual
// que ya pasa con {{qrCode}} en el resto de las muestras (ver la nota en
// [templateId]/page.tsx: "se reemplazan por los datos reales recien al
// emitir un certificado de verdad"). El sello dorado de "Profesional" es
// puro SVG en linea (sin placeholder, no depende de ningun dato) — se
// incluye o se borra a mano segun se quiera, que es justamente la idea de
// que sea "libre a eleccion" de quien arma la plantilla.
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
  {
    key: 'minimalista',
    label: 'Minimalista',
    description: 'Mucho espacio en blanco, línea fina, versalitas — diseño discreto y elegante.',
    html: `<html>
<head>
<style>
  body { margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif; background: #ffffff; color: #111; }
  .marco { margin: 40px; padding: 60px; border: 1px solid #111; text-align: center; }
  .kicker { font-size: 11px; letter-spacing: 5px; text-transform: uppercase; color: #888; }
  h1 { margin: 26px 0 4px; font-size: 26px; font-weight: 300; letter-spacing: 1px; }
  .linea { width: 60px; height: 1px; background: #111; margin: 24px auto; }
  .nombre { font-size: 26px; font-weight: 600; margin-bottom: 26px; }
  .curso { font-size: 14px; color: #444; margin-bottom: 40px; }
  .pie { font-size: 10px; letter-spacing: 1px; color: #999; text-transform: uppercase; }
  .pie div { margin-top: 6px; }
</style>
</head>
<body>
  <div class="marco">
    <div class="kicker">Certificado</div>
    <h1>{{courseTitle}}</h1>
    <div class="linea"></div>
    <div class="nombre">{{studentName}}</div>
    <div class="curso">Completó el curso satisfactoriamente</div>
    <div class="pie">
      <div>{{issueDate}} &middot; Código {{verificationCode}}</div>
      <div>{{qrCode}}</div>
    </div>
  </div>
</body>
</html>`,
  },
  {
    key: 'profesional',
    label: 'Profesional (con sello)',
    description:
      'Marco verde institucional, logo de la institución y sello dorado de autenticidad — el sello es opcional, se puede borrar del HTML si no se quiere.',
    html: `<html>
<head>
<style>
  body { margin: 0; font-family: Georgia, 'Times New Roman', serif; background: #f7f3e8; color: #1f2a1f; }
  .frame { position: relative; margin: 16px; padding: 40px 55px 34px; border: 10px solid #2f5233; }
  .frame::before { content: ''; position: absolute; inset: 6px; border: 1px solid #2f5233; pointer-events: none; }
  .corner { position: absolute; width: 12px; height: 12px; border-radius: 50%; background: #c9a227; box-shadow: 0 0 0 2px #2f5233; }
  .corner.tl { top: -1px; left: -1px; } .corner.tr { top: -1px; right: -1px; }
  .corner.bl { bottom: -1px; left: -1px; } .corner.br { bottom: -1px; right: -1px; }
  .encabezado { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 18px; }
  .logo-slot { height: 34px; display: flex; align-items: center; }
  .logo-slot img { height: 34px; width: auto; object-fit: contain; }
  .inst-name { font-size: 11px; letter-spacing: 2.5px; text-transform: uppercase; color: #2f5233; }
  h1 { margin: 0 0 22px; font-size: 27px; letter-spacing: 1px; color: #2f5233; text-align: center; }
  .otorga { font-size: 13px; color: #5b6b5b; text-align: center; }
  .nombre { margin: 8px auto 22px; font-size: 28px; color: #14201a; text-align: center; border-bottom: 1px solid #c9a227; display: table; padding-bottom: 6px; }
  .curso { font-size: 14px; color: #3d4a3d; text-align: center; max-width: 480px; margin: 0 auto 26px; line-height: 1.5; }
  .curso strong { color: #2f5233; }
  .pies { display: flex; justify-content: center; gap: 14px; margin-bottom: 24px; }
  .pies span { background: #2f5233; color: #fff; font-size: 11px; padding: 7px 16px; border-radius: 999px; }
  .sello { display: flex; justify-content: center; }
  .verificar { position: absolute; right: 22px; bottom: 16px; text-align: center; }
  .verificar img { width: 46px; height: 46px; display: block; }
  .verificar span { display: block; font-size: 8px; letter-spacing: 1px; color: #5b6b5b; text-transform: uppercase; margin-top: 2px; }
</style>
</head>
<body>
  <div class="frame">
    <span class="corner tl"></span><span class="corner tr"></span>
    <span class="corner bl"></span><span class="corner br"></span>

    <div class="encabezado">
      <span class="logo-slot">{{institutionLogo}}</span>
      <span class="inst-name">{{institutionName}}</span>
    </div>

    <h1>Certificado de Capacitación</h1>
    <div class="otorga">Se extiende el presente certificado a</div>
    <div class="nombre">{{studentName}}</div>
    <div class="curso">Por aprobar satisfactoriamente el curso <strong>{{courseTitle}}</strong>, cumpliendo con los criterios de evaluación establecidos.</div>

    <div class="pies">
      <span>Emitido el {{issueDate}}</span>
      <span>Certificación: {{verificationCode}}</span>
    </div>

    <!-- Sello de autenticidad: 100% SVG en linea, sin depender de ningun
         dato — libre a eleccion de quien arma la plantilla, se puede
         borrar este bloque entero (o copiarlo a otra plantilla) sin que
         nada mas se rompa. -->
    <div class="sello">
      <svg viewBox="0 0 140 140" width="86" height="86" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f7d774" />
            <stop offset="55%" stop-color="#caa23a" />
            <stop offset="100%" stop-color="#8a6d1f" />
          </linearGradient>
          <path id="badgeRing" d="M 70,70 m -50,0 a 50,50 0 1,1 100,0 a 50,50 0 1,1 -100,0" />
        </defs>
        <circle cx="70" cy="70" r="64" fill="url(#goldGrad)" stroke="#6b5314" stroke-width="2" />
        <circle cx="70" cy="70" r="50" fill="none" stroke="#6b5314" stroke-width="1.25" stroke-dasharray="1,3" />
        <circle cx="70" cy="70" r="40" fill="#fff8e6" stroke="#6b5314" stroke-width="1.5" />
        <text font-size="10.5" font-weight="700" fill="#6b5314" letter-spacing="2">
          <textPath href="#badgeRing" xlink:href="#badgeRing" startOffset="3%">CERTIFICADO • VERIFICADO • AUTÉNTICO •</textPath>
        </text>
        <text x="70" y="79" text-anchor="middle" font-size="30" fill="#6b5314" font-family="Georgia, serif">✓</text>
      </svg>
    </div>

    <div class="verificar">
      {{qrCode}}
      <span>Verificar</span>
    </div>
  </div>
</body>
</html>`,
  },
  {
    key: 'elegante',
    label: 'Elegante',
    description:
      'Borde fino violeta, logo de la institución y dos firmas al pie — mismo diseño sin el sello dorado.',
    html: `<html>
<head>
<style>
  body { margin: 0; font-family: 'Segoe UI', Arial, Helvetica, sans-serif; background: #ffffff; color: #241b3a; }
  .marco { margin: 20px; padding: 44px 58px; border: 2px solid #5b3e96; text-align: center; }
  .encabezado { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 22px; }
  .logo-slot { height: 30px; display: flex; align-items: center; }
  .logo-slot img { height: 30px; width: auto; object-fit: contain; }
  .inst-name { font-size: 13px; color: #4b3a73; }
  h1 { margin: 0 0 26px; font-size: 25px; letter-spacing: 0.5px; color: #1a1330; }
  .otorga { font-size: 13px; color: #6b6478; }
  .nombre { margin: 8px 0 22px; font-size: 27px; font-weight: 700; color: #5b3e96; }
  .curso { font-size: 14px; color: #3a3350; max-width: 480px; margin: 0 auto 34px; line-height: 1.6; }
  .firmas { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 20px; }
  .firma { flex: 1; border-top: 1px solid #a99bd1; padding-top: 6px; font-size: 11px; color: #4b3a73; }
  .firma strong { display: block; font-size: 12px; color: #1a1330; }
  .pie { display: flex; justify-content: center; align-items: center; gap: 18px; font-size: 11px; color: #6b6478; border-top: 1px solid #ece7f7; padding-top: 14px; }
  .pie img { width: 40px; height: 40px; }
</style>
</head>
<body>
  <div class="marco">
    <div class="encabezado">
      <span class="logo-slot">{{institutionLogo}}</span>
      <span class="inst-name">{{institutionName}}</span>
    </div>

    <h1>Certificado de Capacitación</h1>
    <div class="otorga">Se certifica que</div>
    <div class="nombre">{{studentName}}</div>
    <div class="curso">Participó activamente en <strong>{{courseTitle}}</strong>, cumpliendo con los objetivos y la carga horaria establecidos.</div>

    <div class="firmas">
      <div class="firma">Firma autorizada<strong>Instructor/a</strong></div>
      <div class="firma">Firma autorizada<strong>Dirección académica</strong></div>
    </div>

    <div class="pie">
      <span>Emitido el {{issueDate}}</span>
      <span>Certificado ID: {{verificationCode}}</span>
      <span>{{qrCode}}</span>
    </div>
  </div>
</body>
</html>`,
  },
];
