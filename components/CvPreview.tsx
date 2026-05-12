"use client";
import type { CV } from "@/lib/types";

export function CvPreview({ cv }: { cv: CV }) {
  function downloadPdf() {
    import("jspdf").then(({ default: jsPDF }) => {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const L = 40, R = 555, W = R - L;
      const PAGE_H = 841;
      const MARGIN_BOTTOM = 50;
      let y = 50;

      const checkPage = (needed = 20) => {
        if (y + needed > PAGE_H - MARGIN_BOTTOM) {
          doc.addPage();
          y = 50;
          doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(0);
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

      // Header
      doc.setFontSize(22).setFont("helvetica", "bold").setTextColor(0).text(cv.fullName, L, y);
      y += 20;
      const contact = [cv.email, cv.phone, cv.location].filter(Boolean).join("  |  ");
      doc.setFontSize(10).setFont("helvetica", "normal").setTextColor(100).text(contact, L, y);
      y += 16;

      if (cv.summary) {
        doc.setFontSize(10).setTextColor(60);
        addText(cv.summary, L, W, 14);
        y += 4;
      }

      const section = (title: string) => {
        checkPage(30);
        y += 6;
        doc.setFontSize(12).setFont("helvetica", "bold").setTextColor(0).text(title, L, y);
        y += 3;
        doc.setDrawColor(180).line(L, y, R, y);
        y += 12;
        doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(0);
      };

      if (cv.education.length) {
        section("Education");
        cv.education.forEach(e => {
          checkPage(30);
          const right = `${e.startYear}–${e.endYear}${e.gpa ? `  |  GPA ${e.gpa}` : ""}`;
          const rightW = doc.getTextWidth(right);
          doc.setFont("helvetica", "bold").setTextColor(0).text(`${e.degree}`, L, y);
          doc.setFont("helvetica", "normal").setTextColor(80).text(right, R - rightW, y);
          doc.setTextColor(0);
          y += 13;
          doc.setTextColor(80).text(e.institution, L, y);
          doc.setFont("helvetica", "normal").setTextColor(0);
          y += 14;
        });
      }

      if (cv.experience.length) {
        section("Experience");
        cv.experience.forEach(x => {
          checkPage(40);
          const right = `${x.startDate} – ${x.endDate}`;
          const rightW = doc.getTextWidth(right);
          doc.setFont("helvetica", "bold").setTextColor(0).text(`${x.title}`, L, y);
          doc.setFont("helvetica", "normal").setTextColor(80).text(right, R - rightW, y);
          doc.setTextColor(0);
          y += 13;
          doc.setFont("helvetica", "italic").setTextColor(80).text(x.company, L, y);
          doc.setFont("helvetica", "normal").setTextColor(0);
          y += 14;
          x.bullets.forEach(b => {
            const lines = doc.splitTextToSize(`• ${b}`, W - 10);
            lines.forEach((line: string) => { checkPage(13); doc.text(line, L + 8, y); y += 13; });
          });
          y += 4;
        });
      }

      if (cv.projects.length) {
        section("Projects");
        cv.projects.forEach(p => {
          checkPage(40);
          doc.setFont("helvetica", "bold").setTextColor(0).text(p.name, L, y);
          doc.setFont("helvetica", "normal").setTextColor(0);
          y += 13;
          if (p.tech.length) {
            checkPage(13);
            doc.setFont("helvetica", "normal").setTextColor(80)
              .text(`Tools: ${p.tech.join(", ")}`, L, y);
            doc.setTextColor(0);
            y += 13;
          }
          if (p.description) {
            addText(p.description, L, W, 13);
          }
          p.bullets.forEach(b => {
            const lines = doc.splitTextToSize(`• ${b}`, W - 10);
            lines.forEach((line: string) => { checkPage(13); doc.setFont("helvetica", "normal").setTextColor(0).text(line, L + 8, y); y += 13; });
          });
          y += 4;
        });
      }

      if (cv.skills.length) {
        section("Skills");
        const rows: string[][] = [];
        for (let i = 0; i < cv.skills.length; i += 5) rows.push(cv.skills.slice(i, i + 5));
        rows.forEach(row => {
          checkPage(14);
          doc.setFont("helvetica", "normal").setTextColor(0).text(row.join("   •   "), L, y);
          y += 14;
        });
      }

      if (cv.achievements && cv.achievements.length) {
        section("Achievements");
        cv.achievements.forEach(a => {
          checkPage(13);
          doc.setFont("helvetica", "normal").setTextColor(0).text(`★  ${a}`, L, y);
          y += 14;
        });
      }

      if (cv.skillCategories && cv.skillCategories.length) {
        section("Skills");
        cv.skillCategories.forEach(cat => {
          checkPage(14);
          doc.setFont("helvetica", "bold").setTextColor(0).text(`${cat.category}:`, L, y);
          doc.setFont("helvetica", "normal").setTextColor(60);
          const itemsText = `  ${cat.items.join(", ")}`;
          const catLabelW = doc.getTextWidth(`${cat.category}: `);
          addText(itemsText, L + catLabelW, W - catLabelW, 13);
          doc.setTextColor(0);
        });
      } else if (cv.skills.length) {
        section("Skills");
        const rows: string[][] = [];
        for (let i = 0; i < cv.skills.length; i += 5) rows.push(cv.skills.slice(i, i + 5));
        rows.forEach(row => {
          checkPage(14);
          doc.setFont("helvetica", "normal").setTextColor(0).text(row.join("   •   "), L, y);
          y += 14;
        });
      }

      if (cv.languages.length) {
        section("Languages");
        checkPage(14);
        doc.setFont("helvetica", "normal").setTextColor(0).text(cv.languages.map(l => `${l.name} (${l.level})`).join("   |   "), L, y);
      }

      if (cv.links && cv.links.length) {
        section("Links");
        cv.links.forEach(l => {
          checkPage(14);
          doc.setFont("helvetica", "normal").setTextColor(0).text(`${l.label}: ${l.url}`, L, y);
          y += 14;
        });
      }

      doc.save(`${cv.fullName.replace(/\s+/g, "_")}_CV.pdf`);
    });
  }

  return (
    <div className="glass rounded-2xl p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-grad font-display font-bold text-3xl">{cv.fullName}</h2>
        <p className="text-white/60 text-sm mt-1">
          {[cv.email, cv.phone, cv.location].filter(Boolean).join(" · ")}
        </p>
        {cv.links && cv.links.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-1.5">
            {cv.links.map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer"
                className="text-xs text-[var(--gold)] hover:underline">
                {l.label}: {l.url}
              </a>
            ))}
          </div>
        )}
        {cv.summary && <p className="mt-3 text-sm leading-relaxed">{cv.summary}</p>}
      </div>

      {cv.achievements && cv.achievements.length > 0 && (
        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Achievements</h3>
          <ul className="space-y-0.5">
            {cv.achievements.map((a, i) => (
              <li key={i} className="text-sm text-white/70 pl-3 before:content-['★'] before:mr-2 before:text-[var(--gold)]">{a}</li>
            ))}
          </ul>
        </section>
      )}

      {cv.education.length > 0 && (
        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Education</h3>
          {cv.education.map((e, i) => (
            <div key={i} className="flex justify-between text-sm mb-1">
              <span><span className="font-semibold">{e.degree}</span> — {e.institution}</span>
              <span className="text-white/50">{e.startYear}–{e.endYear}{e.gpa ? ` · GPA ${e.gpa}` : ""}</span>
            </div>
          ))}
        </section>
      )}

      {cv.experience.length > 0 && (
        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Experience</h3>
          {cv.experience.map((x, i) => (
            <div key={i} className="mb-4">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{x.title} · {x.company}</span>
                <span className="text-white/50">{x.startDate}–{x.endDate}</span>
              </div>
              <ul className="mt-1.5 space-y-1">
                {x.bullets.map((b, j) => (
                  <li key={j} className="text-sm text-white/70 pl-3 before:content-['•'] before:mr-2 before:text-white/30">{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {cv.projects.length > 0 && (
        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Projects</h3>
          {cv.projects.map((p, i) => (
            <div key={i} className="mb-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{p.name}</span>
                {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-xs text-[var(--gold)] hover:underline">{p.link}</a>}
              </div>
              {p.description && <p className="text-sm text-white/70 mt-0.5">{p.description}</p>}
              {p.tech.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {p.tech.map(t => (
                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-white/10">{t}</span>
                  ))}
                </div>
              )}
              {p.bullets && p.bullets.length > 0 && (
                <ul className="mt-1.5 space-y-1">
                  {p.bullets.map((b, j) => (
                    <li key={j} className="text-sm text-white/70 pl-3 before:content-['•'] before:mr-2 before:text-white/30">{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {(cv.skillCategories && cv.skillCategories.length > 0) ? (
        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Skills</h3>
          <div className="space-y-2">
            {cv.skillCategories.map((cat, i) => (
              <div key={i} className="flex gap-2 text-sm flex-wrap items-baseline">
                <span className="text-white/40 text-xs font-semibold shrink-0">{cat.category}:</span>
                <span className="text-white/70">{cat.items.join(", ")}</span>
              </div>
            ))}
          </div>
        </section>
      ) : cv.skills.length > 0 && (
        <section className="mb-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Skills</h3>
          <div className="flex flex-wrap gap-1">
            {cv.skills.map(s => (
              <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-white/10">{s}</span>
            ))}
          </div>
        </section>
      )}

      {cv.languages.length > 0 && (
        <section className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Languages</h3>
          <div className="flex flex-wrap gap-2">
            {cv.languages.map(l => (
              <span key={l.name} className="text-xs px-2 py-0.5 rounded-full bg-white/10">{l.name} <span className="text-white/40">({l.level})</span></span>
            ))}
          </div>
        </section>
      )}

      <button onClick={downloadPdf} className="gold-grad text-black font-bold px-6 py-3 rounded-xl text-sm">
        Download PDF
      </button>
    </div>
  );
}
