# brand-assets/

Archivos de trabajo del isotipo oficial de Stoka LMS — NO se sirven a la
app (por eso viven fuera de `apps/web/public/`, a diferencia de
`apps/web/public/brand/`, que sí es público).

- `logo-source-original.png` — el render 3D original tal como lo mandó el
  usuario (fondo negro, pensado para moodboard, no para pantalla).
- `logo-mark-square.png` — el ícono con el fondo ya quitado, recortado y
  centrado en un lienzo cuadrado transparente — de aquí salen
  `apps/web/app/icon.png` (favicon) y
  `keycloak-themes/stoka/login/resources/img/logo-mark.png`.

Los assets que SÍ usa la app en tiempo real están en
`apps/web/public/brand/` (`logo-mark.png`, `logo-lockup.png`) — ver
`apps/web/components/StokaLogo.tsx`.

## Cómo se quitó el fondo

El original venía sobre negro casi puro. Se le calculó el canal alfa por
luminancia (`alpha = clamp((max(R,G,B) - 0.05) / 0.23, 0, 1)`) y se
"despremultiplicó" el color (`rgb / alpha` en los píxeles parcialmente
transparentes) para que no quede un halo oscuro al componer sobre un
fondo claro — normal en renders con brillos/glow pensados para fondo
negro. Se probó primero con flood-fill desde el borde de la imagen para
distinguir "fondo real" de "sombras internas del ícono", pero eso dejaba
huecos negros en las letras cerradas (la "O", la "A" de "STOKA") porque
sus contornos internos no tocan el borde de la imagen — la luminancia
simple, sin esa distinción, dio un resultado más limpio.
