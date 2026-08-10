// ============================================================================
// UpgradeRecommendation.tsx — "Por tu nivel de uso, Business podría resultar
// más conveniente." PREPARADO, no conectado todavia: necesita saber cuantos
// usuarios activos adicionales esta pagando de mas una institucion en un
// mes real, y Stoka LMS todavia no expone esa metrica al frontend (no hay
// endpoint de "MAU de este tenant este mes" — ver la nota extensa en
// getRecommendedUpgrade(), lib/pricing.ts). Este componente ya sabe
// renderizar el resultado de esa funcion; solo falta que algun futuro
// panel de facturación del propio tenant (ej. dentro de (app)/, no en esta
// landing publica) le pase un numero real.
//
// Deliberadamente NO se usa en app/precios/page.tsx: esta es la pagina
// PUBLICA de precios, sin sesion — no hay ningun "uso actual" que mostrarle
// a quien todavia no es cliente. Ver AdditionalUsers.tsx, que documenta el
// mismo punto en su propio contexto.
// ============================================================================

import { getRecommendedUpgrade, type PlanId } from '@/lib/pricing';
import type { PreciosDictionary } from '../dictionaries/precios';

export function UpgradeRecommendation({
  currentPlanId,
  extraActiveUsers,
  t,
}: {
  currentPlanId: PlanId;
  extraActiveUsers: number;
  t: PreciosDictionary;
}) {
  const recommendation = getRecommendedUpgrade(currentPlanId, extraActiveUsers);
  if (!recommendation) return null;

  return (
    <p className="rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
      {t.additionalUsers.upgradeRecommendationPrefix}{' '}
      <strong className="font-semibold text-primary">{recommendation.plan.name}</strong>{' '}
      {t.additionalUsers.upgradeRecommendationSuffix}
    </p>
  );
}
