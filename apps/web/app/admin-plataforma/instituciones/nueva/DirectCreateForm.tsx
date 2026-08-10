'use client';

// ============================================================================
// DirectCreateForm.tsx — Los campos del alta directa. Mismo comportamiento
// de auto-sugerencia de subdominio que RegistrationForm.tsx (formulario
// público de /registro-institucion) — ver lib/slugify.ts, compartido entre
// los dos.
// ============================================================================

import { useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { fieldClasses, labelClasses } from '@/components/ui/field-styles';
import { slugify } from '@/lib/slugify';
import type { Locale } from '@/lib/locale';

const TEXT = {
  es: {
    institutionName: 'Nombre de la institución',
    institutionNamePlaceholder: 'Ej. Instituto San Martín',
    subdomain: 'Subdominio',
    subdomainPlaceholder: 'instituto-sanmartin',
    subdomainTouchedHelp: 'Solo minúsculas, números y guiones.',
    subdomainAutoHelp: 'Lo completamos a partir del nombre — cámbialo si quieres otro.',
    contactName: 'Nombre de la persona de contacto',
    contactNamePlaceholder: 'Quien va a ser el Administrador de entidad',
    contactEmail: 'Email de la persona de contacto',
    contactEmailHelp: 'Ahí se crea su cuenta de acceso — la contraseña temporal se muestra una sola vez apenas se cree.',
    notes: 'Notas (opcional)',
    submit: 'Crear institución',
  },
  en: {
    institutionName: 'Institution name',
    institutionNamePlaceholder: 'E.g. Saint Martin Institute',
    subdomain: 'Subdomain',
    subdomainPlaceholder: 'saint-martin-institute',
    subdomainTouchedHelp: 'Lowercase letters, numbers, and hyphens only.',
    subdomainAutoHelp: "We filled this in from the name — change it if you'd like a different one.",
    contactName: "Contact person's name",
    contactNamePlaceholder: 'Who will be the Entity Administrator',
    contactEmail: "Contact person's email",
    contactEmailHelp: "Their access account is created there — the temporary password is shown only once, right after creation.",
    notes: 'Notes (optional)',
    submit: 'Create institution',
  },
};

export function DirectCreateForm({
  action,
  rootHostname,
  locale,
}: {
  action: (formData: FormData) => void;
  rootHostname: string;
  locale: Locale;
}) {
  const t = TEXT[locale];
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
        <span className={labelClasses}>{t.institutionName}</span>
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
        <span className={labelClasses}>{t.subdomain}</span>
        <div className="flex items-stretch overflow-hidden rounded-lg border border-border focus-within:ring-2 focus-within:ring-primary/30">
          <input
            name="desiredSubdomain"
            type="text"
            required
            value={subdomain}
            onChange={handleSubdomainChange}
            // Ver la nota extensa en RegistrationForm.tsx sobre por que
            // este patron NUNCA lleva "[a-z0-9-]" con el guion adentro de
            // una clase de caracteres (navegadores modernos lo rechazan en
            // modo "v" de Unicode sets).
            pattern="[a-z0-9](-?[a-z0-9]){0,39}"
            placeholder={t.subdomainPlaceholder}
            className="w-full bg-surface px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted"
          />
          <span className="flex shrink-0 items-center whitespace-nowrap bg-black/[.03] px-3 text-sm text-muted dark:bg-white/[.06]">
            .{rootHostname}
          </span>
        </div>
        <span className="text-xs text-muted">
          {subdomainTouched ? t.subdomainTouchedHelp : t.subdomainAutoHelp}
        </span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className={labelClasses}>{t.contactName}</span>
        <input
          name="contactName"
          type="text"
          required
          placeholder={t.contactNamePlaceholder}
          className={fieldClasses}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className={labelClasses}>{t.contactEmail}</span>
        <input name="contactEmail" type="email" required className={fieldClasses} />
        <span className="text-xs text-muted">{t.contactEmailHelp}</span>
      </label>

      <label className="flex flex-col gap-1.5 text-sm">
        <span className={labelClasses}>{t.notes}</span>
        <textarea name="message" rows={2} className={fieldClasses} />
      </label>

      <Button type="submit" className="mt-2 w-full" size="lg">
        {t.submit}
      </Button>
    </form>
  );
}
