// ============================================================================
// admin-plataforma/loading.tsx — Mismo mecanismo que (app)/loading.tsx,
// para las pantallas de administración de plataforma (fuera del route
// group "(app)", ver admin-plataforma/layout.tsx). El "mx-auto max-w-3xl
// px-6" replica el contenedor que cada página de acá abajo ya trae por su
// cuenta (el layout no le pone ancho/padding propio).
// ============================================================================

import { PageSkeleton } from '@/components/ui/PageSkeleton';

export default function AdminPlataformaLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6">
      <PageSkeleton />
    </div>
  );
}
