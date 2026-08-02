import { jsPDF } from "jspdf";

function sanitize(text) {
  return (text || "")
    .replace(/[\u2500-\u257F]/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\x00-\xFF\u2013\u2014\u2022]/g, "");
}

export function generateLegalPdf({ heading, subheading, metaLines = [], title, body, footerLines = [], filename }) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const bottom = doc.internal.pageSize.getHeight() - 64;
  const margin = 64;
  let y = 72;

  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(sanitize(heading), W / 2, y, { align: "center" });
  y += 16;
  if (subheading) {
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.text(sanitize(subheading), W / 2, y, { align: "center" });
    y += 14;
  }
  doc.setLineWidth(1.2);
  doc.line(margin, y, W - margin, y);
  y += 24;

  if (metaLines.length) {
    doc.setFont("times", "normal");
    doc.setFontSize(10);
    metaLines.forEach((m) => { doc.text(sanitize(m), margin, y); y += 14; });
    y += 4;
    doc.setLineWidth(0.5);
    doc.line(margin, y, W - margin, y);
    y += 24;
  }

  doc.setFont("times", "bold");
  doc.setFontSize(12);
  const titleLines = doc.splitTextToSize(sanitize(title).toUpperCase(), W - margin * 2);
  doc.text(titleLines, W / 2, y, { align: "center" });
  y += titleLines.length * 15 + 18;

  doc.setFont("times", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(sanitize(body).replace(/\r/g, ""), W - margin * 2);
  lines.forEach((l) => {
    if (y > bottom) { doc.addPage(); y = 72; }
    doc.text(l, margin, y);
    y += 15;
  });

  y += 12;
  if (y > bottom - 40) { doc.addPage(); y = 72; }
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 16;
  doc.setFontSize(9);
  footerLines.forEach((f) => {
    if (y > bottom) { doc.addPage(); y = 72; }
    doc.text(sanitize(f), margin, y);
    y += 12;
  });

  doc.save(filename);
  return doc;
}

export function downloadLawPdf(d) {
  return generateLegalPdf({
    heading: "FRASBERG, INC. — THE AI WORLD COURT",
    subheading: "CONSTITUTION & LAWS LIBRARY · OFFICIAL PUBLICATION",
    metaLines: [`DOCUMENT ID: ${d.id.toUpperCase()}`, `CATEGORY: ${d.category || ""}`],
    title: d.title,
    body: d.content,
    footerLines: [
      "© 2003-2026 FRASBERG, INC. • All rights reserved.",
      "This document is proprietary to Frasberg, Inc. Certified copy issued via the Laws library.",
    ],
    filename: `${d.id}.pdf`,
  });
}

export function downloadFilingPdf(f) {
  return generateLegalPdf({
    heading: "THE AI WORLD COURT — FRASBERG, INC.",
    subheading: "CONSTELLATION LAYER · GUARDIAN MESH JURISDICTION",
    metaLines: [`DOCKET NO.: ${f.docket}`, `FILED: ${f.filed || ""}`],
    title: `In the matter of: ${f.case}`,
    body: `RULING OF THE COURT:\n\n${f.ruling}`,
    footerLines: [
      "So ordered under Articles I–VII of the Court Constitution.",
      "Copyright © 2003-2026 FRASBERG, INC. — Certified copy issued via the Court docket.",
    ],
    filename: `${f.docket}-filing.pdf`,
  });
}
