// src/utils/exportExcel.js
import XLSX from "xlsx-js-style";
import { saveAs } from "file-saver";

// ── Shared date formatters — use these in each column's exportValue() so
// every export (Assets, Licenses, Jobs) is consistent, regardless of
// whatever raw format the backend sends the date in. ──────────────────────

// Full date + time, IST — e.g. "07 Jul 2026, 03:45 PM"
export function formatDateIST(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// Date only, IST — e.g. "07-Jul-2026" (for purchase_date, expired_on, etc.
// where there's no time component worth showing)
export function formatDateOnlyIST(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const HEADER_STYLE = {
  font: { bold: true, color: { rgb: "FFFFFF" } },
  fill: { fgColor: { rgb: "2563EB" } }, // header background color
  alignment: { vertical: "center", horizontal: "center" },
  border: {
    top:    { style: "thin", color: { rgb: "D1D5DB" } },
    bottom: { style: "thin", color: { rgb: "D1D5DB" } },
    left:   { style: "thin", color: { rgb: "D1D5DB" } },
    right:  { style: "thin", color: { rgb: "D1D5DB" } },
  },
};

const CELL_BORDER = {
  border: {
    top:    { style: "thin", color: { rgb: "E5E7EB" } },
    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
    left:   { style: "thin", color: { rgb: "E5E7EB" } },
    right:  { style: "thin", color: { rgb: "E5E7EB" } },
  },
};

/**
 * @param {string[]} headers          - column header labels, in order
 * @param {Object[]} rows             - array of plain objects keyed by header label
 *                                       (i.e. exactly what each DataTable already builds
 *                                       as "cleanData" before calling XLSX.utils.json_to_sheet)
 * @param {string} sheetName          - e.g. "Assets", "Licenses", "Jobs"
 * @param {string} fileName           - e.g. "assets.xlsx"
 * @param {Object} [options]
 * @param {string} [options.headerColor]  - override header fill color (hex, no #)
 * @param {boolean} [options.freezeHeader=true]
 * @param {boolean} [options.autoFilter=true]
 */
export function exportStyledExcel(headers, rows, sheetName, fileName, options = {}) {
  const {
    headerColor,
    freezeHeader = true,
    autoFilter = true,
  } = options;

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  const range = XLSX.utils.decode_range(worksheet["!ref"]);

  // ── style header row (row 0) ──
  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!worksheet[cellRef]) continue;
    worksheet[cellRef].s = {
      ...HEADER_STYLE,
      ...(headerColor ? { fill: { fgColor: { rgb: headerColor } } } : {}),
    };
  }

  // ── style body cells (light borders, banded rows) ──
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: row, c: col });

        if (!worksheet[cellRef]) continue;

        const value = worksheet[cellRef].v;

        let fill;

        if (
        value === "✅" ||
        value === "Yes" ||
        value === "YES" ||
        value === true
        ) {
        fill = {
            fgColor: { rgb: "92D050" } // Green
        };
        } else if (
        value === "❌" ||
        value === "No" ||
        value === "NO" ||
        value === false
        ) {
        fill = {
            fgColor: { rgb: "FF6666" } // Red
        };
        } else {
        const isEvenRow = (row - 1) % 2 === 0;

        fill = isEvenRow
            ? { fgColor: { rgb: "F9FAFB" } }
            : undefined;
        }

        worksheet[cellRef].s = {
        ...CELL_BORDER,
        fill,
        alignment: {
            horizontal: "center",
            vertical: "center",
        },
        };
    }
    }

  // ── auto column width based on longest value per column ──
  worksheet["!cols"] = headers.map((h) => {
    const maxLen = rows.reduce(
      (max, r) => Math.max(max, String(r[h] ?? "").length),
      h.length
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
  });

  if (freezeHeader) {
    worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  }
  if (autoFilter) {
    worksheet["!autofilter"] = { ref: worksheet["!ref"] };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  saveAs(new Blob([buffer], { type: "application/octet-stream" }), fileName);
}