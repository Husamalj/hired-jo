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

      // renders text as a clickable link at current y
      const addLink = (text: string, x: number, url: string, size = 8) => {
        doc.setFontSize(size).setFont("helvetica", "normal").setTextColor(0, 0, 200);
        doc.text(text, x, y);
        const tw = doc.getTextWidth(text);
        doc.link(x, y - size, tw, size + 2, { url });
        doc.setTextColor(0);
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

      // contact line — make email clickable
      doc.setFontSize(9).setFont("helvetica", "normal").setTextColor(80);
      let cx = L;
      const contactParts = [cv.phone, cv.email, cv.location].filter(Boolean);
      contactParts.forEach((part, idx) => {
        const isEmail = part === cv.email && cv.email;
        if (isEmail) {
          doc.setTextColor(0, 0, 200);
          doc.text(part!, cx, y);
          doc.link(cx, y - 9, doc.getTextWidth(part!), 11, { url: `mailto:${part}` });
          doc.setTextColor(80);
        } else {
          doc.text(part!, cx, y);
        }
        cx += doc.getTextWidth(part!);
        if (idx < contactParts.length - 1) {
          doc.text("  |  ", cx, y);
          cx += doc.getTextWidth("  |  ");
        }
      });
      y += 12;

      // links line — label is the clickable text
      if (cv.links?.length) {
        let lx = L;
        cv.links.forEach((l, idx) => {
          addLink(l.label, lx, l.url.startsWith("http") ? l.url : `https://${l.url}`, 8);
          lx += doc.getTextWidth(l.label);
          if (idx < cv.links!.length - 1) {
            doc.setFontSize(8).setFont("helvetica", "normal").setTextColor(80);
            doc.text("   |   ", lx, y);
            lx += doc.getTextWidth("   |   ");
          }
        });
        y += 10;
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
            doc.setFontSize(9).setFont("helvetica", "bold").setTextColor(0);
            const labelW = doc.getTextWidth(labelText);
            doc.text(labelText, L, y);
            doc.setFont("helvetica", "normal").setTextColor(60);
            const itemsText = cat.items.join(", ");
            const lines = doc.splitTextToSize(itemsText, W - labelW);
            lines.forEach((line: string, idx: number) => {
              if (idx === 0) {
                doc.text(line, L + labelW, y);
              } else {
                y += 13;
                checkPage(14);
                doc.text(line, L + labelW, y);
              }
            });
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
    import("docx").then(({ Document, Packer, Paragraph, TextRun, ExternalHyperlink, HeadingLevel, convertInchesToTwip, UnderlineType }) => {
      const sectionHeading = (text: string) =>
        new Paragraph({
          children: [new TextRun({ text, bold: true, size: 22, allCaps: true })],
          spacing: { before: 240, after: 120 },
          border: { bottom: { style: "single", size: 6, color: "888888", space: 4 } },
        });

      const hyperlink = (label: string, url: string) =>
        new ExternalHyperlink({
          link: url.startsWith("http") ? url : `https://${url}`,
          children: [new TextRun({ text: label, color: "0000CC", underline: { type: UnderlineType.SINGLE } })],
        });

      const children: any[] = [];

      // ── Header ──
      children.push(
        new Paragraph({
          children: [new TextRun({ text: cv.fullName, bold: true, size: 36 })],
          spacing: { after: 80 },
        })
      );

      // contact line — email clickable
      const contactChildren: any[] = [];
      const contactParts = [cv.phone, cv.email, cv.location].filter(Boolean) as string[];
      contactParts.forEach((part, idx) => {
        if (part === cv.email && cv.email) {
          contactChildren.push(
            new ExternalHyperlink({
              link: `mailto:${cv.email}`,
              children: [new TextRun({ text: cv.email, color: "0000CC", underline: { type: UnderlineType.SINGLE }, size: 18 })],
            })
          );
        } else {
          contactChildren.push(new TextRun({ text: part, size: 18, color: "444444" }));
        }
        if (idx < contactParts.length - 1) contactChildren.push(new TextRun({ text: "  |  ", size: 18, color: "444444" }));
      });
      children.push(new Paragraph({ children: contactChildren, spacing: { after: 80 } }));

      // links line — label is the clickable text
      if (cv.links?.length) {
        const linkChildren: any[] = [];
        cv.links.forEach((l, idx) => {
          linkChildren.push(hyperlink(l.label, l.url));
          if (idx < cv.links!.length - 1) linkChildren.push(new TextRun({ text: "   |   ", size: 18, color: "444444" }));
        });
        children.push(new Paragraph({ children: linkChildren, spacing: { after: 200 } }));
      }

      // ── Objective ──
      if (cv.summary) {
        children.push(sectionHeading("OBJECTIVE"));
        children.push(new Paragraph({ children: [new TextRun({ text: cv.summary, size: 18 })], spacing: { after: 100 } }));
      }

      // ── Experience ──
      if (cv.experience.length) {
        children.push(sectionHeading("EXPERIENCE"));
        cv.experience.forEach(x => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `${x.title} — ${x.company}`, bold: true, size: 20 })],
              spacing: { after: 40 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `${x.startDate} – ${x.endDate}`, italics: true, size: 18, color: "666666" })],
              spacing: { after: 80 },
            })
          );
          x.bullets.forEach(b => {
            children.push(new Paragraph({
              children: [new TextRun({ text: `• ${b}`, size: 18 })],
              spacing: { after: 60 },
              indent: { left: convertInchesToTwip(0.2) },
            }));
          });
        });
      }

      // ── Projects ──
      if (cv.projects?.length) {
        children.push(sectionHeading("PROJECTS"));
        cv.projects.forEach(p => {
          const techStr = p.tech?.length ? ` | ${p.tech.join(", ")}` : "";
          children.push(new Paragraph({
            children: [new TextRun({ text: `${p.name}${techStr}`, bold: true, size: 20 })],
            spacing: { after: 60 },
          }));
          p.bullets?.forEach(b => {
            children.push(new Paragraph({
              children: [new TextRun({ text: `• ${b}`, size: 18 })],
              spacing: { after: 60 },
              indent: { left: convertInchesToTwip(0.2) },
            }));
          });
        });
      }

      // ── Skills ──
      if (cv.skillCategories?.length) {
        children.push(sectionHeading("SKILLS"));
        cv.skillCategories.forEach(cat => {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: `${cat.category}: `, bold: true, size: 18 }),
              new TextRun({ text: cat.items.join(", "), size: 18 }),
            ],
            spacing: { after: 80 },
          }));
        });
      } else if (cv.skills?.length) {
        children.push(sectionHeading("SKILLS"));
        children.push(new Paragraph({ children: [new TextRun({ text: cv.skills.join(" • "), size: 18 })], spacing: { after: 80 } }));
      }

      // ── Education ──
      if (cv.education.length) {
        children.push(sectionHeading("EDUCATION"));
        cv.education.forEach(e => {
          children.push(
            new Paragraph({
              children: [new TextRun({ text: e.degree, bold: true, size: 20 })],
              spacing: { after: 40 },
            }),
            new Paragraph({
              children: [new TextRun({ text: e.institution, size: 18, color: "444444" })],
              spacing: { after: 40 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `${e.startYear} – ${e.endYear}${e.gpa ? ` | GPA ${e.gpa}` : ""}`, size: 18, italics: true, color: "666666" })],
              spacing: { after: 120 },
            })
          );
        });
      }

      // ── Certifications ──
      if (cv.certifications?.length) {
        children.push(sectionHeading("CERTIFICATIONS"));
        cv.certifications.forEach(c => {
          children.push(new Paragraph({ children: [new TextRun({ text: `• ${c}`, size: 18 })], spacing: { after: 60 }, indent: { left: convertInchesToTwip(0.2) } }));
        });
      }

      // ── Achievements ──
      if (cv.achievements?.length) {
        children.push(sectionHeading("ACHIEVEMENTS & EXTRAS"));
        cv.achievements.forEach(a => {
          children.push(new Paragraph({ children: [new TextRun({ text: `• ${a}`, size: 18 })], spacing: { after: 60 }, indent: { left: convertInchesToTwip(0.2) } }));
        });
      }

      // ── Languages ──
      if (cv.languages.length) {
        children.push(sectionHeading("LANGUAGES"));
        cv.languages.forEach(l => {
          children.push(new Paragraph({
            children: [
              new TextRun({ text: l.name, bold: true, size: 18 }),
              new TextRun({ text: ` (${l.level})`, size: 18 }),
            ],
            spacing: { after: 80 },
          }));
        });
      }

      const doc = new Document({
        sections: [{
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.5),
                bottom: convertInchesToTwip(0.5),
                left: convertInchesToTwip(0.5),
                right: convertInchesToTwip(0.5),
              },
            },
          },
          children,
        }],
      });
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
          {cv.phone && <span>{cv.phone}</span>}
          {cv.phone && cv.email && <span className="mx-1">|</span>}
          {cv.email && <a href={`mailto:${cv.email}`} className="text-blue-600 hover:underline">{cv.email}</a>}
          {cv.email && cv.location && <span className="mx-1">|</span>}
          {cv.location && <span>{cv.location}</span>}
        </p>
        {cv.links?.length ? (
          <p className="text-gray-500 text-xs mt-1">
            {cv.links.map((l, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-2">|</span>}
                <a href={l.url.startsWith("http") ? l.url : `https://${l.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{l.label}</a>
              </span>
            ))}
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
