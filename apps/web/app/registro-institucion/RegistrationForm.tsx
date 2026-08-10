'use client';

// ============================================================================
// RegistrationForm.tsx — Los campos interactivos de registro-institucion/
// page.tsx, separados en su propio Client Component SOLO por esto: el
// subdominio se auto-sugiere a partir del nombre de la institución a medida
// que se escribe (ver "slugify" abajo), algo que un Server Component no
// puede hacer (no hay re-render en el navegador sin JS). En cuanto la
// persona toca el campo de subdominio a mano, la sugerencia automática se
// apaga — nunca le pisa algo que ya eligió (ver "subdomainTouched").
//
// Sigue enviando con la MISMA Server Action de siempre (action={crearSolicitud},
// pasada como prop desde el Server Component) — ni la validación ni el
// endpoint cambian, esto es pura comodidad al completar el formulario.
// ============================================================================

import { useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { fieldClasses, labelClasses } from '@/components/ui/field-styles';
import { slugify } from '@/lib/slugify';
import type { RegistroInstitucionDictionary } from '../dictionaries/registro-institucion';

export function RegistrationForm({
  action,
  t,
  rootHostname,
  messagePrefill,
}: {
  action: (formData: FormData) => void;
  t: RegistroInstitucionDictionary;
  rootHostname: string;
  /** Ver la nota de "?plan=" en page.tsx — precarga el mensaje cuando se
   * llega desde el CTA de un plan en /precios (editable, no de solo lectura). */
  messagePrefill?: string;
}) {
  const [subdomain, setSubdomain] = useState('');
  const [subdomainTouched, setSubdomainTouched] = useState(false);

  function handleInstitutionNameChange(e: ChangeEvent<HTMLInputElement>) {
    if (!subdomainTouched) {
      setSubdomain(slugify(e.target.value));
    }
  }

  function handleSubdomainChange(e: ChangeEvent<HTMLInputElement>) {
    setSubdomainTouched(true);
    setSubdomain(e.target.value);
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className={labelClasses}>{t.institutionNameLabel}</span>
        <input
          name="institutionName"
          type="text"
          required
          placeholder={t.institutionNamePlaceholder}
          onChange={handleInstitutionNameChange}
          className={fieldClasses}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className={labelClasses}>{t.subdomainLabel}</span>
        <div className="flex items-stretch overflow-hidden rounded-lg border border-border focus-within:ring-2 focus-within:ring-primary/30">
          <input
            name="desiredSubdomain"
            type="text"
            required
            value={subdomain}
            onChange={handleSubdomainChange}
            // Un caracter alfanumerico inicial, despues hasta 39 mas
            // (alfanumericos, con guiones SUELTOS entre medio, nunca dos
            // seguidos ni al principio/final) — evita a proposito una
            // clase de caracteres "[a-z0-9-]" con el guion adentro: los
            // navegadores modernos compilan el atributo "pattern" en modo
            // "v" (Unicode sets) desde hace poco, que rechaza ESA
            // construccion como "Invalid character class" y bloquea el
            // envio del formulario en silencio (se detecto probando el
            // flujo de punta a punta de verdad, no en el enunciado). El
            // backend (create-tenant-registration.dto.ts) es quien manda
            // la validacion real; esto es solo una pista visual inmediata.
            pattern="[a-z0-9](-?[a-z0-9]){0,39}"
            placeholder="instituto-sanmartin"
            className="w-full bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted"
          />
          <span className="flex shrink-0 items-center whitespace-nowrap bg-black/[.03] px-3 text-sm text-muted dark:bg-white/[.06]">
            .{rootHostname}
          </span>
        </div>
        <span className="text-xs text-muted">
          {subdomainTouched ? t.subdomainHelp : t.subdomainAutoHelp}
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className={labelClasses}>{t.contactNameLabel}</span>
        <input
          name="contactName"
          type="text"
          required
          placeholder={t.contactNamePlaceholder}
          className={fieldClasses}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className={labelClasses}>{t.contactEmailLabel}</span>
        <input name="contactEmail" type="email" required className={fieldClasses} />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className={labelClasses}>{t.messageLabel}</span>
        <textarea
          name="message"
          rows={3}
          placeholder={t.messagePlaceholder}
          defaultValue={messagePrefill}
          className={fieldClasses}
        />
      </label>

      <Button type="submit" className="mt-2 w-full" size="lg">
        {t.submit}
      </Button>
    </form>
  );
}
