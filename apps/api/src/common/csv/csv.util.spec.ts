// ============================================================================
// csv.util.spec.ts — Prueba unitaria de la mitigacion de CSV/Formula
// Injection (ver la nota extensa en csv.util.ts, "neutralizeFormula") —
// hallazgo F-01 de la auditoria de seguridad. El escenario real: alguien
// carga un nombre como "=HYPERLINK(...)" via "Mi perfil" (sin restriccion
// de caracteres, ver EditUserProfileDto) y despues un Coordinador exporta
// un reporte que incluye ese nombre y lo abre en Excel.
// ============================================================================

import { toCsv } from './csv.util';

describe('toCsv — neutralizacion de formulas (CSV Injection)', () => {
  const columns = [{ key: 'name' as const, header: 'Nombre' }];

  it.each([
    // Contiene comas/comillas -> ademas queda envuelta en comillas RFC4180
    // (el "'" neutralizador queda como el primer caracter DENTRO de esas
    // comillas, ver el siguiente test para el caso mas simple sin comas).
    ['=HYPERLINK("http://evil/steal","click")', `"'=HYPERLINK`],
    ['+1+1', "'+1+1"],
    ['-2+3', "'-2+3"],
    ['@SUM(A1:A9)', "'@SUM"],
  ])('antepone una comilla simple a un valor que empieza con caracter de formula (%s)', (input, expectedPrefix) => {
    const csv = toCsv([{ name: input }], columns);
    const dataLine = csv.split('\r\n')[1];
    // Una hoja de calculo SOLO interpreta como formula una celda cuyo
    // PRIMER caracter (dentro de las comillas, si las hay) sea uno de los
    // disparadores — con la comilla simple antepuesta, ese primer caracter
    // pasa a ser "'" (texto literal forzado), que es lo que confirma esto.
    expect(dataLine.startsWith(expectedPrefix)).toBe(true);
  });

  it('no modifica valores normales (sin caracter de formula al inicio)', () => {
    const csv = toCsv([{ name: 'Carlos Coordinador' }], columns);
    expect(csv.split('\r\n')[1]).toBe('Carlos Coordinador');
  });

  it('sigue escapando comas/comillas/saltos de linea normalmente (RFC 4180) tras neutralizar', () => {
    const csv = toCsv([{ name: '=A,B' }], columns);
    expect(csv.split('\r\n')[1]).toBe(`"'=A,B"`);
  });

  it('un valor vacio o nulo no se rompe', () => {
    const csv = toCsv([{ name: null as unknown as string }], columns);
    expect(csv.split('\r\n')[1]).toBe('');
  });
});
