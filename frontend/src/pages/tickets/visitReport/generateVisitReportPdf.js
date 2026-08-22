// ===============================
// File: src/pages/tickets/visitReport/generateVisitReportPdf.js
// ===============================
//
// Builds a jsPDF document that mirrors the TSF Engineers "Visit Report"
// letterhead exactly: header (logo + company block), title, the
// Customer/Meeting/Scope/Time/Order/Venue grid, Agenda box, Points box
// (fed from checked Daily Update Tasks), Date of Visit, Present From
// columns, and a footer with the Rockwell partner badge + watermark on
// every page.
//
// Put your two images in /public exactly as named here (or edit the
// two constants below to match whatever you actually save them as):
//   /public/company-logo.png
//   /public/Rockewell.png

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const LOGO_PATH     = "/company-logo.png";
const ROCKWELL_PATH = "/Rockewell.png";

const PAGE_W  = 210; // A4 mm
const PAGE_H  = 297;
const MARGIN  = 14;

function loadImageAsDataURL(path) {
  return fetch(path)
    .then((res) => {
      if (!res.ok) throw new Error(`Could not load ${path}`);
      return res.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// "2024-05-08" -> "08.05.2024" (matches "Date of Visit:" style in the sample)
function formatDateDots(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

// "18:30:00" -> "6:30 pm"
function formatTime12h(t) {
  if (!t) return "-";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr);
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${mStr} ${ampm}`;
}

function drawHeader(doc) {
  let y = MARGIN;

  // Logo in top-right
const logoW = 22;
const logoH = 22;
const logoX = PAGE_W - MARGIN - logoW;
const logoY = y - 8;

doc.addImage(doc.__logo, "PNG", logoX, logoY, logoW, logoH);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(70, 138, 155);
  doc.text("TSF Engineers Pvt. Ltd.", MARGIN, y + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text(
  "Corporate Office: Plot No.710, Sector- 82, Industrial Area, SAS Nagar (Mohali) -160055 (Punjab)",
  MARGIN,
  y + 10
);

doc.text(
  "Phone: +91-1724080814, +91-7529839678, Email: info@tsfe365.com",
  MARGIN,
  y + 14
);

  doc.setFont("helvetica", "bold");
  doc.text("CIN NO. U29220PB2018PTC047448", PAGE_W - MARGIN, y + 18, { align: "right" });

  y += 20;
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text("Visit Report", PAGE_W / 2, y, { align: "center" });
  const titleWidth = doc.getTextWidth("Visit Report");
  doc.setLineWidth(0.3);
  doc.line(PAGE_W / 2 - titleWidth / 2, y + 1.5, PAGE_W / 2 + titleWidth / 2, y + 1.5);

  return y + 8;
}

function drawFooterOnPage(doc) {
  const footerY = PAGE_H - 22;
  doc.setDrawColor(0);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, footerY, PAGE_W - MARGIN, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(40, 40, 40);
  doc.text(
    "Registered Office: Plot No.710, Sector- 82, Industrial Area, SAS Nagar (Mohali) -160055 (Punjab)",
    MARGIN, footerY + 5
  );
  doc.text(
    "Phone: +91-1724080814, +91-7529839678, Email: info@tsfe365.com, Web: www.tsfe365.com",
    MARGIN, footerY + 9
  );

  if (doc.__rockwell) {
    const imgW = 38;
const imgH = 15;

doc.addImage(
  doc.__rockwell,
  "PNG",
  PAGE_W - MARGIN - imgW,
  footerY,
  imgW,
  imgH
);
  }
}

function drawWatermarkOnPage(doc) {
  doc.saveGraphicsState();
  doc.setGState(new doc.GState({ opacity: 0.06 }));
  const size = 140;
  doc.addImage(doc.__logo, "PNG", (PAGE_W - size) / 2, (PAGE_H - size) / 2, size, size);
  doc.restoreGraphicsState();
}

/**
 * @param {object} ticket        — ticket record (scope_of_work, customer_name,
 *                                  meeting_date, meeting_time, venue, order_no, agenda)
 * @param {array}  dailyTasks    — full daily task list; only is_selected ones print
 * @param {array}  memberGroups  — [{ company, people: [{name, online}] }]
 * @returns {Promise<jsPDF>}
 */
export async function generateVisitReportPdf({ ticket, dailyTasks = [], memberGroups = [] }) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const [logo, rockwell] = await Promise.allSettled([
    loadImageAsDataURL(LOGO_PATH),
    loadImageAsDataURL(ROCKWELL_PATH),
  ]);
  doc.__logo     = logo.status === "fulfilled" ? logo.value : null;
  doc.__rockwell = rockwell.status === "fulfilled" ? rockwell.value : null;

  let y = doc.__logo ? drawHeader(doc) : MARGIN;

  // ── Customer / Meeting Date / Scope / Time / Order No / Venue grid ──
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 28 },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, valign: "middle", lineColor: [0, 0, 0], lineWidth: 0.2 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 32 },
      1: { cellWidth: 63 },
      2: { fontStyle: "bold", cellWidth: 30 },
      3: { cellWidth: "auto" },
    },
    body: [
      ["Customer Name:", ticket.customer_name || "-", "Meeting Date:", formatDate(ticket.meeting_date)],
      ["Scope of work",  ticket.scope_of_work  || "-", "Time:",         formatTime12h(ticket.meeting_time)],
      ["Order No:",      ticket.order_no       || "-", "Venue:",        ticket.venue || "-"],
    ],
  });
  y = doc.lastAutoTable.finalY + 6;

  // ── Agenda ──
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN, bottom: 28 },
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2, lineColor: [0, 0, 0], lineWidth: 0.2 },
    head: [[{ content: "AGENDA", colSpan: 2, styles: { halign: "center", fontStyle: "bolditalic" } }]],
    columnStyles: { 0: { cellWidth: 12, fontStyle: "bold" }, 1: { cellWidth: "auto" } },
    body: [["1.0", ticket.agenda || "-"]],
  });
  y = doc.lastAutoTable.finalY + 6;

  // ── Points (checked Daily Update Tasks only) ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("POINTS:", MARGIN, y);
  y += 5;

  const boxStartY = y;
  doc.setFont("helvetica", "bolditalic");
  doc.setFontSize(9);
  const heading = "Following were the work done for troubleshooting:";
  doc.text(heading, MARGIN + 3, y + 5);
  doc.setLineWidth(0.2);
  doc.line(MARGIN + 3, y + 6, MARGIN + 3 + doc.getTextWidth(heading), y + 6);

  let by = y + 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const checkedTasks = (dailyTasks || []).filter((t) => t.is_selected);

  if (checkedTasks.length === 0) {
    doc.text("No main tasks marked for this report yet.", MARGIN + 5, by);
    by += 6;
  } else {
    checkedTasks.forEach((t) => {
      const lines = doc.splitTextToSize(`•  ${t.task_description}`, PAGE_W - 2 * MARGIN - 10);
      lines.forEach((line) => {
        if (by > PAGE_H - 40) { doc.addPage(); by = MARGIN; }
        doc.text(line, MARGIN + 5, by);
        by += 5;
      });
    });
  }
  by += 3;
  doc.setDrawColor(0);
  doc.rect(MARGIN, boxStartY, PAGE_W - 2 * MARGIN, by - boxStartY);
  y = by + 8;

  if (y > PAGE_H - 45) { doc.addPage(); y = MARGIN; }

  // ── Date of Visit ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Date of Visit:   ${formatDateDots(ticket.meeting_date)}`, MARGIN, y);
  y += 8;

  // ── Present From columns ──
  const groups = memberGroups.filter((g) => (g.people || []).some((p) => p.name?.trim()));
  if (groups.length > 0) {
    const colW = (PAGE_W - 2 * MARGIN) / groups.length;
    groups.forEach((group, i) => {
      const x = MARGIN + i * colW;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`PRESENT FROM ${(group.company || "").toUpperCase()}`, x, y);

      let py = y + 5;
      doc.setFont("helvetica", "normal");
      group.people
        .filter((p) => p.name?.trim())
        .forEach((p) => {
          const label = p.online ? `${p.name} (Online Remotely)` : p.name;
          doc.splitTextToSize(label, colW - 4).forEach((line) => {
            doc.text(line, x, py);
            py += 4.5;
          });
        });
    });
  }

  // ── Watermark + footer on every page ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    if (doc.__logo) drawWatermarkOnPage(doc);
    drawFooterOnPage(doc);
  }

  return doc;
}