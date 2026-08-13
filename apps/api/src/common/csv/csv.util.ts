// ============================================================================
// csv.util.ts — Serializa filas de datos a texto CSV. Compartido por
// reports.service.ts (los 3 reportes), security.service.ts (auditoria) y
// cualquier otra exportacion futura — un solo lugar que sabe escapar
// comas/comillas/saltos de linea, en vez de repetirlo en cada modulo.
// ============================================================================

import type { Response } from 'express';

// Neutraliza "CSV Injection" / "Formula Injection" (CWE-1236, ver auditoria
// de seguridad F-01): si una celda empieza con "=", "+", "-", "@", tab o
// retorno de carro, Excel/LibreOffice/Google Sheets la interpretan como una
// FORMULA al abrir el archivo (ej. un nombre "=HYPERLINK(...)" cargado por
// cualquier persona via "Mi perfil" terminaria ejecutandose en la maquina
// de quien exporta el reporte, tipicamente un Coordinador/Administrador).
// Anteponer una comilla simple es la mitigacion estandar (OWASP CSV
// Injection Cheat Sheet): las hojas de calculo la interpretan como "fuerza
// texto literal", igual que si alguien la tipeara a mano antes del "=".
function neutralizeFormula(str: string): string {
  return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
}

// Escapa un valor para CSV (RFC 4180): si contiene coma, comilla o salto de
// linea, se envuelve entre comillas dobles y cualquier comilla interna se
// duplica. Cualquier otro valor se manda tal cual, sin comillas de mas.
function escapeCsvValue(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  const safe = neutralizeFormula(str);
  if (/[",\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

// "columns" define el orden Y el encabezado (la clave del objeto puede ser
// distinta al texto de encabezado, ej. "fullName" -> "Nombre completo").
// Sin "extends Record<string, unknown>" a proposito: exigiria que cada
// interfaz de fila (ej. AttendanceReportRow en reports.service.ts)
// declarara una firma de indice de mas, solo para poder pasarla aca.
export function toCsv<T>(rows: T[], columns: Array<{ key: keyof T; header: string }>): string {
  const headerLine = columns.map((c) => escapeCsvValue(c.header)).join(',');
  const lines = rows.map((row) => columns.map((c) => escapeCsvValue(row[c.key])).join(','));
  // "\r\n" (no solo "\n"): Excel en Windows -el destino mas probable de un
  // CSV descargado- interpreta filas mas confiablemente con el fin de linea
  // de CRLF; con solo "\n" a veces junta todo en una sola fila visual.
  // BOM UTF-8 al inicio: sin el, Excel abre acentos/eñes como caracteres
  // rotos en vez de detectar UTF-8 solo.
  return '﻿' + [headerLine, ...lines].join('\r\n');
}

// Ex-funcion local de reports.controller.ts, movida aca cuando
// security.controller.ts necesito exactamente lo mismo: encabezados +
// envio de una descarga CSV, sin repetir el boilerplate de Content-Type/
// Content-Disposition en cada controller nuevo que exporte algo.
export function sendCsv(res: Response, csv: string, filename: string): void {
  res
    .status(200)
    .set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    })
    .send(csv);
}
