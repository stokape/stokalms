// ============================================================================
// (app)/loading.tsx — Convención de archivo de Next.js: mientras la página
// real (Server Component) todavía está pidiendo sus datos, Next.js muestra
// esto automáticamente en el lugar de "{children}" de (app)/layout.tsx —
// la barra lateral y el header ya están pintados, solo el contenido
// principal muestra el esqueleto. Ver components/ui/PageSkeleton.tsx.
// ============================================================================

import { PageSkeleton } from '@/components/ui/PageSkeleton';

export default function AppLoading() {
  return <PageSkeleton />;
}
