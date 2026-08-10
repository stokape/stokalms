// ============================================================================
// stoka-back-link.js — Agrega un enlace "← Volver" arriba de CUALQUIER
// pantalla de Keycloak (login, "olvidé mi contraseña", errores...) sin
// tocar ningun .ftl del tema base (ver theme.properties, "parent=keycloak").
//
// Por que "history.back()" y no una URL fija: esta misma pantalla la
// comparten TODAS las instituciones (un solo Keycloak, ver
// ADR-003-auth-identity.md) — no hay una unica "URL de vuelta" correcta
// para todas. Volver al historial del navegador SIEMPRE lleva a donde
// esa persona en particular estaba antes (la landing de su institucion, o
// la pantalla de "encontramos tu institucion" de /entrar), sin tener que
// adivinar ningun dominio.
// ============================================================================

document.addEventListener('DOMContentLoaded', function () {
  // Sin historial (ej. se abrio esta pestaña directo en el login, sin
  // venir de ningun lado) no hay "atras" al que volver — mejor no
  // mostrar un enlace que no va a hacer nada al tocarlo.
  if (window.history.length <= 1) {
    return;
  }

  var link = document.createElement('a');
  link.className = 'stoka-back-link';
  link.href = '#';
  link.textContent = '← Volver';
  link.addEventListener('click', function (event) {
    event.preventDefault();
    window.history.back();
  });
  document.body.insertAdjacentElement('afterbegin', link);
});
