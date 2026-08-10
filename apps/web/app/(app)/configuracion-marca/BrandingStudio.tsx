'use client';

// ============================================================================
// BrandingStudio.tsx — Client Component (a proposito, ver la nota extensa de
// (app)/layout.tsx sobre por que casi todo en esta app es Server Component +
// Server Action): la vista previa en vivo y la paleta de colores clicable
// necesitan estado real de React (recordar el archivo recien elegido ANTES
// de subirlo, reaccionar al click de un swatch) — no hay forma CSS-only de
// lograr eso, a diferencia del toggle de nav mobile.
//
// Los <form action={...}> siguen mandando exactamente a los Server Actions
// de siempre (actualizarMarca/actualizarLogo/actualizarFondo, pasados como
// props desde page.tsx) — nada de esto reemplaza el guardado real, solo
// agrega una vista previa y una forma mas comoda de elegir el color ENCIMA
// de los mismos formularios de siempre.
// ============================================================================

import { useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { fileInputClasses, labelClasses } from '@/components/ui/field-styles';
import { derivePrimaryPalette } from '@/lib/color';
import { StokaBrandingBadge } from '@/components/StokaBrandingBadge';
import type { Locale } from '@/lib/locale';

// Paleta curada de colores institucionales tipicos — clic directo en vez de
// tener que saber/copiar un codigo hexadecimal de memoria. El primero es el
// mismo Azul Principal que ya usa el resto de la plataforma (ver
// components/StokaLogo.tsx / app/globals.css).
const PRESET_COLORS_BY_LOCALE: Record<Locale, Array<{ hex: string; label: string }>> = {
  es: [
    { hex: '#1e90ff', label: 'Azul Stoka (por defecto)' },
    { hex: '#0d1b2a', label: 'Azul noche' },
    { hex: '#1d4ed8', label: 'Azul' },
    { hex: '#0f766e', label: 'Verde azulado' },
    { hex: '#15803d', label: 'Verde' },
    { hex: '#b45309', label: 'Ámbar' },
    { hex: '#c2410c', label: 'Naranja' },
    { hex: '#be123c', label: 'Rojo' },
    { hex: '#a21caf', label: 'Magenta' },
    { hex: '#334155', label: 'Gris pizarra' },
  ],
  en: [
    { hex: '#1e90ff', label: 'Stoka Blue (default)' },
    { hex: '#0d1b2a', label: 'Night blue' },
    { hex: '#1d4ed8', label: 'Blue' },
    { hex: '#0f766e', label: 'Teal' },
    { hex: '#15803d', label: 'Green' },
    { hex: '#b45309', label: 'Amber' },
    { hex: '#c2410c', label: 'Orange' },
    { hex: '#be123c', label: 'Red' },
    { hex: '#a21caf', label: 'Magenta' },
    { hex: '#334155', label: 'Slate gray' },
  ],
};

const TEXT = {
  es: {
    nameAndColor: 'Nombre y colores',
    institutionName: 'Nombre de la institución',
    primaryColor: 'Color de marca (botones y enlaces)',
    primaryColorHelp: 'Se usa en toda tu área — página de inicio y una vez adentro. Sin elegir uno, se usa el Azul Stoka.',
    backgroundColor: 'Color de fondo (respaldo)',
    colorPickerTitle: 'Elegir color con la paleta del sistema',
    colorHelp: 'Se usa solo si todavía no subiste una imagen de fondo — la imagen siempre tiene prioridad.',
    saveNameAndColor: 'Guardar nombre y colores',
    hideStokaBrandingLabel: 'Ocultar el sello "Hecho con Stoka LMS"',
    hideStokaBrandingHelp:
      'Ese sello aparece por defecto en tu página de inicio, en el pie de la app y en la verificación pública de certificados. Ocultarlo es parte del plan Pro.',
    logo: 'Logo',
    currentLogo: 'Logo actual',
    logoBroken: 'No se pudo cargar el logo actual (la imagen puede haber expirado). Vuelve a subirla.',
    uploadLogo: 'Subir logo',
    favicon: 'Favicon',
    faviconHelp: 'El ícono que se ve en la pestaña del navegador. Sin subir uno, se usa el de Stoka.',
    currentFavicon: 'Favicon actual',
    faviconBroken: 'No se pudo cargar el favicon actual (la imagen puede haber expirado). Vuelve a subirlo.',
    uploadFavicon: 'Subir favicon',
    backgroundImage: 'Imagen de fondo',
    currentBackground: 'Fondo actual',
    backgroundBroken: 'No se pudo cargar el fondo actual (la imagen puede haber expirado). Vuelve a subirla.',
    uploadBackground: 'Subir imagen de fondo',
    preview: 'Vista previa',
    previewHelp: 'Así se va a ver tu página de inicio pública con lo que elegiste arriba — se actualiza al instante, todavía no guardaste nada.',
    institutionNamePlaceholder: 'Nombre de tu institución',
    login: 'Iniciar sesión',
  },
  en: {
    nameAndColor: 'Name and colors',
    institutionName: 'Institution name',
    primaryColor: 'Brand color (buttons and links)',
    primaryColorHelp: "Used across your whole area — home page and once logged in. If you don't pick one, Stoka Blue is used.",
    backgroundColor: 'Background color (fallback)',
    colorPickerTitle: "Choose a color with the system's picker",
    colorHelp: "Only used if you haven't uploaded a background image yet — the image always takes priority.",
    saveNameAndColor: 'Save name and colors',
    hideStokaBrandingLabel: 'Hide the "Made with Stoka LMS" badge',
    hideStokaBrandingHelp:
      "That badge shows by default on your home page, the app's footer, and public certificate verification. Hiding it is part of the Pro plan.",
    logo: 'Logo',
    currentLogo: 'Current logo',
    logoBroken: 'The current logo failed to load (the image may have expired). Upload it again.',
    uploadLogo: 'Upload logo',
    favicon: 'Favicon',
    faviconHelp: "The icon shown in the browser tab. If you don't upload one, Stoka's is used.",
    currentFavicon: 'Current favicon',
    faviconBroken: 'The current favicon failed to load (the image may have expired). Upload it again.',
    uploadFavicon: 'Upload favicon',
    backgroundImage: 'Background image',
    currentBackground: 'Current background',
    backgroundBroken: 'The current background failed to load (the image may have expired). Upload it again.',
    uploadBackground: 'Upload background image',
    preview: 'Preview',
    previewHelp: "This is how your public home page will look with what you chose above — it updates instantly, you haven't saved anything yet.",
    institutionNamePlaceholder: "Your institution's name",
    login: 'Log in',
  },
};

type ServerAction = (formData: FormData) => void | Promise<void>;

interface BrandingStudioProps {
  tenantName: string;
  initialColor: string;
  initialPrimaryColor: string;
  initialLogoUrl?: string;
  initialBackgroundUrl?: string;
  initialFaviconUrl?: string;
  initialHideStokaBranding: boolean;
  actualizarMarca: ServerAction;
  actualizarLogo: ServerAction;
  actualizarFondo: ServerAction;
  actualizarFavicon: ServerAction;
  locale: Locale;
}

export function BrandingStudio({
  tenantName,
  initialColor,
  initialPrimaryColor,
  initialLogoUrl,
  initialBackgroundUrl,
  initialFaviconUrl,
  initialHideStokaBranding,
  actualizarMarca,
  actualizarLogo,
  actualizarFondo,
  actualizarFavicon,
  locale,
}: BrandingStudioProps) {
  const t = TEXT[locale];
  const PRESET_COLORS = PRESET_COLORS_BY_LOCALE[locale];
  const [name, setName] = useState(tenantName);
  const [color, setColor] = useState(initialColor || '#1e90ff');
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor || '#1e90ff');
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [logoBroken, setLogoBroken] = useState(false);
  const [bgUrl, setBgUrl] = useState(initialBackgroundUrl);
  const [bgBroken, setBgBroken] = useState(false);
  const [faviconUrl, setFaviconUrl] = useState(initialFaviconUrl);
  const [faviconBroken, setFaviconBroken] = useState(false);
  const [hideStokaBranding, setHideStokaBranding] = useState(initialHideStokaBranding);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const primaryColorInputRef = useRef<HTMLInputElement>(null);

  // Paleta derivada del color de marca elegido (hover, texto de contraste)
  // para que el boton de la vista previa de abajo se vea EXACTAMENTE como
  // se veria en la app real (ver apps/web/app/layout.tsx, que aplica la
  // misma derivacion) — sin esto, la vista previa mostraria siempre el
  // Azul Stoka aunque se haya elegido otro color, hasta guardar y recargar.
  const previewPalette = derivePrimaryPalette(primaryColor) ?? {
    primary: '#1e90ff',
    primaryForeground: '#ffffff',
  };

  function onLogoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoUrl(URL.createObjectURL(file));
      setLogoBroken(false);
    }
  }

  function onBgFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setBgUrl(URL.createObjectURL(file));
      setBgBroken(false);
    }
  }

  function onFaviconFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconUrl(URL.createObjectURL(file));
      setFaviconBroken(false);
    }
  }

  function pickPreset(hex: string) {
    setColor(hex);
    if (colorInputRef.current) colorInputRef.current.value = hex;
  }

  function pickPrimaryPreset(hex: string) {
    setPrimaryColor(hex);
    if (primaryColorInputRef.current) primaryColorInputRef.current.value = hex;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-medium">{t.nameAndColor}</h2>
          <form action={actualizarMarca} className="flex flex-col gap-4">
            <Field
              label={t.institutionName}
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div>
              <span className={labelClasses}>{t.primaryColor}</span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={primaryColorInputRef}
                  type="color"
                  name="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                  title={t.colorPickerTitle}
                />
                <span className="font-mono text-xs text-muted">{primaryColor}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => pickPrimaryPreset(preset.hex)}
                    title={preset.label}
                    aria-label={preset.label}
                    className={
                      'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ' +
                      (primaryColor.toLowerCase() === preset.hex
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border')
                    }
                    style={{ backgroundColor: preset.hex }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">{t.primaryColorHelp}</p>
            </div>
            <div>
              <span className={labelClasses}>{t.backgroundColor}</span>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={colorInputRef}
                  type="color"
                  name="backgroundColor"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                  title={t.colorPickerTitle}
                />
                <span className="font-mono text-xs text-muted">{color}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.hex}
                    type="button"
                    onClick={() => pickPreset(preset.hex)}
                    title={preset.label}
                    aria-label={preset.label}
                    className={
                      'h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ' +
                      (color.toLowerCase() === preset.hex
                        ? 'border-primary ring-2 ring-primary/30'
                        : 'border-border')
                    }
                    style={{ backgroundColor: preset.hex }}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">{t.colorHelp}</p>
            </div>
            <label className="flex items-start gap-2.5">
              <input
                type="checkbox"
                name="hideStokaBranding"
                checked={hideStokaBranding}
                onChange={(e) => setHideStokaBranding(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
              />
              <span className="text-sm">
                <span className="font-medium">{t.hideStokaBrandingLabel}</span>
                <span className="block text-xs text-muted">{t.hideStokaBrandingHelp}</span>
              </span>
            </label>
            <Button type="submit" className="self-start">
              {t.saveNameAndColor}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-medium">{t.logo}</h2>
          {logoUrl && !logoBroken && (
            // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal, no un asset estatico.
            <img
              src={logoUrl}
              alt={t.currentLogo}
              onError={() => setLogoBroken(true)}
              className="mb-3 h-20 w-auto rounded-lg border border-border bg-white object-contain"
            />
          )}
          {logoUrl && logoBroken && (
            <p className="mb-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted">
              {t.logoBroken}
            </p>
          )}
          <form action={actualizarLogo} className="flex flex-col gap-3">
            <input
              name="file"
              type="file"
              accept="image/*"
              required
              onChange={onLogoFileChange}
              className={fileInputClasses}
            />
            <Button type="submit" variant="secondary" size="sm" className="self-start">
              {t.uploadLogo}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-1 text-base font-medium">{t.favicon}</h2>
          <p className="mb-3 text-xs text-muted">{t.faviconHelp}</p>
          {faviconUrl && !faviconBroken && (
            // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal, no un asset estatico.
            <img
              src={faviconUrl}
              alt={t.currentFavicon}
              onError={() => setFaviconBroken(true)}
              className="mb-3 h-10 w-10 rounded-lg border border-border bg-white object-contain"
            />
          )}
          {faviconUrl && faviconBroken && (
            <p className="mb-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted">
              {t.faviconBroken}
            </p>
          )}
          <form action={actualizarFavicon} className="flex flex-col gap-3">
            <input
              name="file"
              type="file"
              accept="image/*"
              required
              onChange={onFaviconFileChange}
              className={fileInputClasses}
            />
            <Button type="submit" variant="secondary" size="sm" className="self-start">
              {t.uploadFavicon}
            </Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-base font-medium">{t.backgroundImage}</h2>
          {bgUrl && !bgBroken && (
            // eslint-disable-next-line @next/next/no-img-element -- URL firmada temporal, no un asset estatico.
            <img
              src={bgUrl}
              alt={t.currentBackground}
              onError={() => setBgBroken(true)}
              className="mb-3 h-40 w-full rounded-lg border border-border object-cover"
            />
          )}
          {bgUrl && bgBroken && (
            <p className="mb-3 rounded-lg border border-dashed border-border p-3 text-xs text-muted">
              {t.backgroundBroken}
            </p>
          )}
          <form action={actualizarFondo} className="flex flex-col gap-3">
            <input
              name="file"
              type="file"
              accept="image/*"
              required
              onChange={onBgFileChange}
              className={fileInputClasses}
            />
            <Button type="submit" variant="secondary" size="sm" className="self-start">
              {t.uploadBackground}
            </Button>
          </form>
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-1 text-base font-medium">{t.preview}</h2>
        <p className="mb-4 text-sm text-muted">{t.previewHelp}</p>
        <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-xl border border-border">
          {/* Misma tecnica que app/page.tsx: la imagen de fondo va en una capa
              APARTE, agrandada y difuminada, para que el desenfoque no le
              pegue tambien a la tarjeta de encima. */}
          {bgUrl && !bgBroken ? (
            <div
              className="absolute inset-0 scale-110 bg-cover bg-center blur-xl"
              style={{ backgroundImage: `url(${bgUrl})` }}
            />
          ) : (
            <div className="absolute inset-0" style={{ backgroundColor: color }} />
          )}
          {bgUrl && !bgBroken && <div className="absolute inset-0 bg-black/45" />}

          <div className="relative w-56 rounded-xl border border-white/10 bg-white/95 p-5 text-center shadow-lg dark:bg-zinc-900/95">
            {logoUrl && !logoBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="mx-auto mb-2 h-10 w-auto object-contain" />
            ) : (
              // Color inline (no la clase "bg-primary"): la vista previa
              // debe reflejar el color de marca RECIEN elegido, no el que
              // ya esta guardado globalmente (ver la nota de "previewPalette"
              // mas arriba).
              <div
                className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold"
                style={{ backgroundColor: previewPalette.primary, color: previewPalette.primaryForeground }}
              >
                {name.trim().charAt(0).toUpperCase() || 'S'}
              </div>
            )}
            <p className="truncate text-sm font-semibold">{name || t.institutionNamePlaceholder}</p>
            <div
              className="mt-3 rounded-lg px-3 py-1.5 text-xs font-medium"
              style={{ backgroundColor: previewPalette.primary, color: previewPalette.primaryForeground }}
            >
              {t.login}
            </div>
          </div>

          {!hideStokaBranding && (
            <StokaBrandingBadge label="Hecho con Stoka LMS" className="absolute inset-x-0 bottom-3" />
          )}
        </div>
      </Card>
    </>
  );
}
