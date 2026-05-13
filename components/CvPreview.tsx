"use client";
import type { CV } from "@/lib/types";

export function CvPreview({ cv }: { cv: CV }) {
  function downloadPdf() {
    import("jspdf").then(({ jsPDF }) => {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const L = 45, R = 550, W = R - L;
      const PAGE_H = 841;
      let y = 50;

      const checkPage = (needed = 20) => {
        if (y + needed > PAGE_H - 50) { doc.addPage(); y = 50; }
      };

      const addWrapped = (text: string, x: number, maxW: number, size = 9, color: number | [number, number, number] = 60) => {
        doc.setFontSize(size);
        if (Array.isArray(color)) doc.setTextColor(color[0], color[1], color[2]);
        else doc.setTextColor(color);
        doc.splitTextToSize(text, maxW).forEach((line: string) => {
          checkPage(size + 4);
          doc.text(line, x, y);
          y += size + 4;
        });
      };

      const section = (title: string) => {
        checkPage(30);
        y += 8;
        doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(0).text(title.toUpperCase(), L, y);
        y += 4;
        doc.setDrawColor(0).setLineWidth(0.5).line(L, y, R, y);
        y += 10;
      };

      // ── Header ──
      doc.setFontSize(20).setFont("helvetica", "bold").setTextColor(0).text(cv.fullName, L, y);
      y += 16;
      const contact = [cv.phone, cv.email, cv.location].filter(Boolean).join("  |  ");
      if (contact) { doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(80).text(contact, L, y); y += 12; }
      if (cv.links?.length) {
        const linkLine = cv.links.map(l => `${l.label}: ${l.url}`).join("   |   ");
        doc.setFontSize(8).setTextColor(100).text(linkLine, L, y); y += 10;
      }
      y += 4;
      doc.setDrawColor(0).setLineWidth(1).line(L, y, R, y);
      y += 14;

      // ── Objective ──
      if (cv.summary) {
        section("OBJECTIVE");
        addWrapped(cv.summary, L, W, 9, 40);
        y += 6;
      }

      const isExp = cv.experience.length > 0;

      // ── Experience helper ──
      const renderExp = (label: string) => {
        if (!cv.experience.length) return;
        section(label.toUpperCase());
        cv.experience.forEach(x => {
          checkPage(40);
          doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0).text(`${x.title} — ${x.company}`, L, y);
          // Switch to 9pt normal BEFORE measuring, so getTextWidth uses the correct font
          doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(100);
          const dateStr = `${x.startDate} – ${x.endDate}`;
          doc.text(dateStr, R - doc.getTextWidth(dateStr), y);
          y += 13;
          x.bullets.forEach(b => addWrapped(`• ${b}`, L + 10, W - 10, 9, 50));
          y += 4;
        });
      };

      const renderProjects = () => {
        if (cv.projects?.length) {
          section("PROJECTS");
          cv.projects.forEach(p => {
            checkPage(35);
            const techStr = p.tech?.length ? ` | ${p.tech.join(", ")}` : "";
            doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0).text(`${p.name}${techStr}`, L, y);
            y += 13;
            p.bullets?.forEach(b => addWrapped(`• ${b}`, L + 10, W - 10, 9, 50));
            y += 4;
          });
        }
      };

      const renderSkills = () => {
        if (cv.skillCategories?.length) {
          section("SKILLS");
          cv.skillCategories.forEach(cat => {
            checkPage(14);
            const labelText = `${cat.category}: `;
            const labelW = doc.getTextWidth(labelText);
            doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(0).text(labelText, L, y);
            doc.setFont("helvetica", "normal").setTextColor(60).text(cat.items.join(", "), L + labelW, y);
            y += 13;
          });
          y += 4;
        } else if (cv.skills?.length) {
          section("SKILLS");
          addWrapped(cv.skills.join(" • "), L, W, 9, 60);
          y += 4;
        }
      };

      if (isExp) {
        // Experienced: experience → projects → skills
        renderExp("EXPERIENCE");
        renderProjects();
        renderSkills();
      } else {
        // Fresher: skills → projects → internships
        renderSkills();
        renderProjects();
        renderExp("INTERNSHIPS");
      }

      // ── Education ──
      if (cv.education.length) {
        section("EDUCATION");
        cv.education.forEach(e => {
          checkPage(25);
          doc.setFontSize(10).setFont("helvetica", "bold").setTextColor(0).text(e.degree, L, y);
          const yr = `${e.startYear} – ${e.endYear}${e.gpa ? ` | GPA ${e.gpa}` : ""}`;
          doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(100).text(yr, R - doc.getTextWidth(yr), y);
          y += 13;
          doc.setFontSize(9).setTextColor(60).text(e.institution, L, y);
          y += 14;
        });
      }

      // ── Certifications ──
      if (cv.certifications?.length) {
        section("CERTIFICATIONS");
        cv.certifications.forEach(c => addWrapped(`• ${c}`, L + 10, W - 10, 9, 50));
        y += 4;
      }

      // ── Achievements ──
      if (cv.achievements?.length) {
        section("ACHIEVEMENTS & EXTRAS");
        cv.achievements.forEach(a => addWrapped(`• ${a}`, L + 10, W - 10, 9, 50));
        y += 4;
      }

      // ── Languages ──
      if (cv.languages.length) {
        section("LANGUAGES");
        addWrapped(cv.languages.map(l => `${l.name} (${l.level})`).join("   •   "), L, W, 9, 60);
      }

      doc.save(`${cv.fullName.replace(/\s+/g, "_")}_CV.pdf`);
    }).catch(err => console.error("PDF error:", err));
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

  const isExperienced = cv.experience.length > 0;

  const experiencedOrder = ["objective", "experience", "projects", "skills", "education", "certifications", "achievements", "languages"] as const;
  const fresherOrder = ["objective", "skills", "projects", "internships", "education", "certifications", "achievements", "languages"] as const;
  const sectionList = isExperienced ? experiencedOrder : fresherOrder;

  const renderExperience = (label: string) => {
    if (!cv.experience.length) return null;
    return (
      <section key={label} className="mb-6">
        <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-3 pb-1 border-b border-gray-300">{label}</h2>
        {cv.experience.map((x, i) => (
          <div key={i} className="mb-5">
            <div className="flex justify-between items-baseline mb-1">
              <p className="font-bold text-black text-sm">{x.title} — {x.company}</p>
              <p className="text-gray-500 text-xs">{x.startDate} - {x.endDate}</p>
            </div>
            <ul className="space-y-1 mt-1">
              {x.bullets.map((b, j) => (
                <li key={j} className="text-gray-700 text-sm leading-relaxed">• {b}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    );
  };

  const renderSection = (sectionName: string) => {
    switch (sectionName) {
      case "objective":
        return cv.summary ? (
          <section key="objective" className="mb-6">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-3 pb-1 border-b border-gray-300">Objective</h2>
            <p className="text-gray-700 text-sm leading-relaxed">{cv.summary}</p>
          </section>
        ) : null;
      case "experience":
        return renderExperience("Experience");
      case "internships":
        return renderExperience("Internships");
      case "education":
        return cv.education.length ? (
          <section key="education" className="mb-6">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-3 pb-1 border-b border-gray-300">Education</h2>
            {cv.education.map((e, i) => (
              <div key={i} className="mb-4">
                <div className="flex justify-between items-baseline">
                  <p className="font-bold text-black text-sm">{e.degree}</p>
                  <p className="text-gray-500 text-xs">{e.startYear} - {e.endYear}{e.gpa ? ` | GPA ${e.gpa}` : ""}</p>
                </div>
                <p className="text-gray-600 text-sm">{e.institution}</p>
              </div>
            ))}
          </section>
        ) : null;
      case "projects":
        return cv.projects?.length ? (
          <section key="projects" className="mb-6">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-3 pb-1 border-b border-gray-300">Projects</h2>
            {cv.projects.map((p, i) => (
              <div key={i} className="mb-5">
                <p className="font-bold text-black text-sm">{p.name}{p.tech?.length ? ` | ${p.tech.join(", ")}` : ""}</p>
                {p.description && <p className="text-gray-600 text-sm mt-1">{p.description}</p>}
                {p.bullets && p.bullets.length > 0 && (
                  <ul className="space-y-1 mt-1">
                    {p.bullets.map((b, j) => (
                      <li key={j} className="text-gray-700 text-sm leading-relaxed">• {b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        ) : null;
      case "skills":
        return (cv.skillCategories?.length || cv.skills?.length) ? (
          <section key="skills" className="mb-6">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-3 pb-1 border-b border-gray-300">Skills</h2>
            {cv.skillCategories?.length ? (
              <div className="space-y-1">
                {cv.skillCategories.map((cat, i) => (
                  <p key={i} className="text-sm text-gray-700">
                    <span className="font-semibold text-black">{cat.category}: </span>
                    {cat.items.join(", ")}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-gray-700 text-sm">{cv.skills?.join(" • ")}</p>
            )}
          </section>
        ) : null;
      case "certifications":
        return cv.certifications?.length ? (
          <section key="certifications" className="mb-6">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-3 pb-1 border-b border-gray-300">Certifications</h2>
            <ul className="space-y-1">
              {cv.certifications.map((c, i) => <li key={i} className="text-gray-700 text-sm">• {c}</li>)}
            </ul>
          </section>
        ) : null;
      case "achievements":
        return cv.achievements?.length ? (
          <section key="achievements" className="mb-6">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-3 pb-1 border-b border-gray-300">Achievements & Extras</h2>
            <ul className="space-y-1">
              {cv.achievements.map((a, i) => <li key={i} className="text-gray-700 text-sm">• {a}</li>)}
            </ul>
          </section>
        ) : null;
      case "languages":
        return cv.languages.length ? (
          <section key="languages" className="mb-6">
            <h2 className="text-sm font-bold text-black uppercase tracking-wider mb-3 pb-1 border-b border-gray-300">Languages</h2>
            <div className="flex flex-wrap gap-x-6 gap-y-1">
              {cv.languages.map((l, i) => (
                <p key={i} className="text-sm text-gray-700">
                  <span className="font-semibold text-black">{l.name}</span> ({l.level})
                </p>
              ))}
            </div>
          </section>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white text-black p-12 max-w-4xl mx-auto rounded-lg shadow-sm" style={{ fontFamily: "Georgia, serif" }}>
      {/* Header */}
      <div className="mb-6 pb-4 border-b-2 border-gray-800">
        <h1 className="text-3xl font-bold text-black tracking-tight">{cv.fullName}</h1>
        <p className="text-gray-600 text-sm mt-1">
          {[cv.phone, cv.email, cv.location].filter(Boolean).join("  |  ")}
        </p>
        {cv.links?.length ? (
          <p className="text-gray-500 text-xs mt-1">
            {cv.links.map(l => `${l.label}: ${l.url}`).join("   |   ")}
          </p>
        ) : null}
      </div>

      {sectionList.map(s => renderSection(s))}

      <div className="mt-8 pt-6 border-t border-gray-300 flex gap-3">
        <button onClick={downloadPdf} className="gold-grad text-black font-bold px-6 py-2 rounded-lg text-sm hover:opacity-90">
          Download PDF
        </button>
        <button onClick={downloadWord} className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg text-sm hover:bg-blue-700">
          Download Word
        </button>
      </div>
    </div>
  );
}
