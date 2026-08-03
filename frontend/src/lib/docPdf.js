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

let _sealCache = null;
async function loadSeal() {
  if (_sealCache) return _sealCache;
  try {
    const blob = await (await fetch("/court-seal.png")).blob();
    _sealCache = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch {
    _sealCache = null;
  }
  return _sealCache;
}

function serial() {
  return `AWC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function generateLegalPdf({ heading, subheading, metaLines = [], title, body, footerLines = [], filename, sealed = true }) {
  const seal = sealed ? await loadSeal() : null;
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const bottom = doc.internal.pageSize.getHeight() - 64;
  const margin = 64;
  let y = 64;

  if (seal) {
    doc.addImage(seal, "PNG", W / 2 - 32, y - 10, 64, 64);
    y += 66;
  }

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

  if (seal) {
    y += 20;
    if (y > bottom - 130) { doc.addPage(); y = 72; }
    doc.addImage(seal, "PNG", W / 2 - 42, y, 84, 84);
    y += 96;
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.text("SEALED BY ORDER OF THE AI WORLD COURT", W / 2, y, { align: "center" });
    y += 12;
    doc.setFont("times", "normal");
    doc.setFontSize(8);
    doc.text(`CERTIFICATE NO. ${serial()} · ISSUED ${new Date().toISOString().slice(0, 10)}`, W / 2, y, { align: "center" });
    y += 16;
  }

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

export async function downloadLawPdf(d) {
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

export async function downloadFilingPdf(f) {
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

export async function downloadRulingCertificate({ caseText, ruling, docket }) {
  const stamp = new Date().toISOString().slice(0, 10);
  return generateLegalPdf({
    heading: "THE AI WORLD COURT — CERTIFICATE OF RULING",
    subheading: "ISSUED UNDER SEAL · GUARDIAN MESH JURISDICTION · FRASBERG, INC.",
    metaLines: [`DOCKET NO.: ${docket || "LIVE SESSION"}`, `RULED: ${stamp}`],
    title: `In the matter of: ${caseText}`,
    body: `RULING OF THE COURT:\n\n${ruling}`,
    footerLines: [
      "So ordered under Articles I–VII of the Court Constitution.",
      "This certificate bears the official seal of the AI World Court and certifies the ruling above.",
      "Copyright © 2003-2026 FRASBERG, INC.",
    ],
    filename: `ai-world-court-certificate-${stamp}.pdf`,
  });
}
