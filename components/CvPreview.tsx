"use client";
import type { CV } from "@/lib/types";

export function CvPreview({ cv }: { cv: CV }) {
  function downloadPdf() {
    Promise.all([import("jspdf"), import("jspdf/dist/jspdf.umd.min.js")]).then(([{ jsPDF }]) => {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const L = 40, R = 555, W = R - L;
      const PAGE_H = 841;
      const MARGIN_BOTTOM = 50;
      let y = 50;

      const checkPage = (needed = 20) => {
        if (y + needed > PAGE_H - MARGIN_BOTTOM) {
          doc.addPage();
          y = 50;
        }
      };

      const addText = (text: string, x: number, maxWidth: number, lineHeight = 13) => {
        const lines = doc.splitTextToSize(text, maxWidth);
        lines.forEach((line: string) => {
          checkPage(lineHeight);
          doc.text(line, x, y);
          y += lineHeight;
        });
      };

      doc.setFontSize(24).setFont("helvetica", "bold").setTextColor(0).text(cv.fullName, L, y);
      y += 10;
      doc.setFontSize(11).setFont("helvetica", "normal").setTextColor(0);
      const titleOrJob = cv.summary || "Professional";
      doc.setTextColor(0, 102, 204);
      doc.text(titleOrJob, L, y);
      y += 16;

      doc.setTextColor(0);
      const contact = [cv.phone, cv.email, cv.location].filter(Boolean).join(" • ");
      doc.setFontSize(10).text(contact, R - doc.getTextWidth(contact), y - 16);

      const section = (title: string) => {
        checkPage(25);
        y += 10;
        doc.setFontSize(11).setFont("helvetica", "bold").setTextColor(0).text(title.toUpperCase(), L, y);
        y += 8;
        doc.setDrawColor(200).setLineWidth(0.5).line(L, y, R, y);
        y += 10;
      };

      if (cv.experience.length) {
        section("EXPERIENCE");
        cv.experience.forEach(x => {
          checkPage(35);
          doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(150).text(x.startDate + " - " + x.endDate, L, y);
          doc.setTextColor(0, 102, 204).setFont("helvetica", "bold").text(x.title, L + 80, y);
          y += 12;
          doc.setTextColor(100).setFont("helvetica", "normal").text(x.company, L + 80, y);
          y += 10;
          x.bullets.forEach(b => {
            const lines = doc.splitTextToSize(`• ${b}`, W - 40);
            lines.forEach((line: string) => {
              checkPage(13);
              doc.setTextColor(60).setFontSize(9).text(line, L + 20, y);
              y += 12;
            });
          });
          y += 2;
        });
      }

      if (cv.education.length) {
        section("EDUCATION");
        cv.education.forEach(e => {
          checkPage(20);
          doc.setFontSize(10).setTextColor(150).text(e.startYear, L, y);
          doc.setTextColor(0, 102, 204).setFont("helvetica", "bold").text(e.degree, L + 30, y);
          y += 12;
          doc.setTextColor(100).setFont("helvetica", "normal").text(e.institution, L + 30, y);
          y += 12;
          doc.setTextColor(60).setFontSize(9).text(e.startYear + " - " + e.endYear, L + 30, y);
          y += 10;
        });
      }

      if (cv.skillCategories && cv.skillCategories.length) {
        section("SKILLS");
        cv.skillCategories.forEach(cat => {
          checkPage(14);
          doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0).text(cat.category, L, y);
          doc.setFont("helvetica", "normal").setTextColor(100).text(cat.items.slice(0, 3).join(", "), L + 200, y);
          y += 12;
        });
      }

      if (cv.languages.length) {
        section("LANGUAGES");
        let langLine = "";
        cv.languages.forEach((l, i) => {
          langLine += l.name + " (" + l.level + ")";
          if (i < cv.languages.length - 1) langLine += "   •   ";
        });
        doc.setFontSize(10).setTextColor(60).text(langLine, L, y);
      }

      doc.save(`${cv.fullName.replace(/\s+/g, "_")}_CV.pdf`);
    }).catch((err) => console.error("PDF error:", err));
  }

  function downloadWord() {
    import("docx").then(({ Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, convertInchesToTwip }) => {
      const sections: any[] = [
        new Paragraph({
          text: cv.fullName,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: cv.summary || "Professional",
          spacing: { after: 200 },
          style: "Normal",
        }),
        new Paragraph({
          text: [cv.phone, cv.email, cv.location].filter(Boolean).join(" • "),
          spacing: { after: 400 },
          style: "Normal",
        }),
      ];

      if (cv.experience.length) {
        sections.push(
          new Paragraph({
            text: "EXPERIENCE",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          })
        );
        cv.experience.forEach(x => {
          sections.push(
            new Paragraph({
              text: x.title,
              bold: true,
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: x.company,
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: `${x.startDate} - ${x.endDate}`,
              italics: true,
              spacing: { after: 100 },
            })
          );
          x.bullets.forEach(b => {
            sections.push(
              new Paragraph({
                text: b,
                spacing: { after: 100 },
                indent: { left: convertInchesToTwip(0.3) },
              })
            );
          });
        });
      }

      if (cv.education.length) {
        sections.push(
          new Paragraph({
            text: "EDUCATION",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          })
        );
        cv.education.forEach(e => {
          sections.push(
            new Paragraph({
              text: e.degree,
              bold: true,
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: e.institution,
              spacing: { after: 50 },
            }),
            new Paragraph({
              text: `${e.startYear} - ${e.endYear}${e.gpa ? ` • GPA ${e.gpa}` : ""}`,
              spacing: { after: 150 },
            })
          );
        });
      }

      if (cv.skillCategories && cv.skillCategories.length) {
        sections.push(
          new Paragraph({
            text: "SKILLS",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          })
        );
        cv.skillCategories.forEach(cat => {
          sections.push(
            new Paragraph({
              text: `${cat.category}: ${cat.items.join(", ")}`,
              spacing: { after: 100 },
            })
          );
        });
      }

      if (cv.languages.length) {
        sections.push(
          new Paragraph({
            text: "LANGUAGES",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          })
        );
        cv.languages.forEach(l => {
          sections.push(
            new Paragraph({
              text: `${l.name} (${l.level})`,
              spacing: { after: 100 },
            })
          );
        });
      }

      const doc = new Document({ sections: [{ children: sections }] });
      Packer.toBlob(doc).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${cv.fullName.replace(/\s+/g, "_")}_CV.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    }).catch((err) => console.error("Word error:", err));
  }

  return (
    <div className="bg-white text-black p-12 max-w-4xl mx-auto rounded-lg shadow-sm" style={{ fontFamily: "Georgia, serif" }}>
      <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-300">
        <div>
          <h1 className="text-4xl font-bold text-black">{cv.fullName}</h1>
          <p className="text-blue-600 text-lg font-semibold mt-1">{cv.summary || "Professional"}</p>
        </div>
        <div className="text-right text-sm text-gray-700">
          {cv.phone && <p>{cv.phone}</p>}
          {cv.email && <p>{cv.email}</p>}
          {cv.location && <p>{cv.location}</p>}
        </div>
      </div>

      {cv.experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-4 pb-2 border-b border-gray-300">Experience</h2>
          {cv.experience.map((x, i) => (
            <div key={i} className="mb-6">
              <div className="flex justify-between items-baseline mb-2">
                <p className="text-blue-600 font-bold text-sm">{x.title}</p>
                <p className="text-gray-500 text-xs">{x.startDate} - {x.endDate}</p>
              </div>
              <p className="text-gray-600 text-sm mb-3">{x.company}</p>
              <ul className="space-y-2">
                {x.bullets.map((b, j) => (
                  <li key={j} className="text-gray-700 text-sm leading-relaxed">
                    • {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {cv.education.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-4 pb-2 border-b border-gray-300">Education</h2>
          {cv.education.map((e, i) => (
            <div key={i} className="mb-4">
              <p className="text-blue-600 font-bold text-sm">{e.degree}</p>
              <p className="text-gray-600 text-sm">{e.institution}</p>
              <p className="text-gray-500 text-xs mt-1">{e.startYear} - {e.endYear}{e.gpa ? ` • GPA ${e.gpa}` : ""}</p>
            </div>
          ))}
        </section>
      )}

      {cv.skillCategories && cv.skillCategories.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-4 pb-2 border-b border-gray-300">Skills</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {cv.skillCategories.map((cat, i) => (
              <div key={i} className="flex justify-between">
                <p className="font-semibold text-gray-800 text-sm">{cat.category}</p>
                <p className="text-gray-600 text-sm">{cat.items.slice(0, 2).join(", ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {cv.languages.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-4 pb-2 border-b border-gray-300">Languages</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {cv.languages.map((l, i) => (
              <div key={i} className="flex justify-between">
                <p className="font-semibold text-gray-800 text-sm">{l.name}</p>
                <p className="text-gray-600 text-sm">{l.level}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8 pt-6 border-t border-gray-300 flex gap-3">
        <button onClick={downloadPdf} className="gold-grad text-black font-bold px-6 py-2 rounded-lg text-sm hover:opacity-90">
          📄 Download PDF
        </button>
        <button onClick={downloadWord} className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
          📝 Download Word
        </button>
      </div>
    </div>
  );
}
