import type { Metadata } from "next";
import Link from "next/link";
import { canonicalUrl, content, origin } from "../lib/data";

export const metadata: Metadata = {
  alternates: canonicalUrl("/") ? { canonical: canonicalUrl("/") } : undefined,
};

const frameworkShape: Record<string, string> = {
  superpowers: "Dated design → fine-grained plan",
  gsd: "Project ledger → phased roadmap",
  "github-spec-kit": "Constitution → spec → plan → tasks",
  "kiro-specs": "Requirements → design → tasks",
  "matt-pocock-skills": "Published spec → tracker tickets",
  "bmad-method": "Modular roles or express spec",
};

export default function Home() {
  const dataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "AI coding planning frameworks: same-case examples",
    description: "Raw planning artifacts from six frameworks applied to one reliable webhook delivery brief.",
    url: origin(),
    license: "https://opensource.org/license/mit",
    creator: { "@type": "Organization", name: "Plannotator" },
    dateModified: "2026-07-19",
  };

  return (
    <main id="main-content">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dataset) }} />
      <section className="hero page-width">
        <p className="eyebrow">One brief · six real workflows</p>
        <h1>See what AI coding planning frameworks actually produce.</h1>
        <p className="hero-answer">
          This repository runs Superpowers, GSD, GitHub Spec Kit, Matt Pocock&apos;s skills, and BMad Method against the same reliable-webhook brief. Kiro Specs is the one exception: its example is manual and plainly labeled because the vendor workflow required unavailable authentication.
        </p>
        <div className="hero-actions">
          <Link className="button" href="/compare/superpowers-vs-gsd">Open side-by-side viewer</Link>
          <Link className="button button-secondary" href="/cases/reliable-webhook-delivery">Read the neutral brief</Link>
        </div>
      </section>

      <section className="matrix-section page-width">
        <div className="section-heading">
          <p className="eyebrow">Fast comparison</p>
          <h2>Same case, different planning unit</h2>
          <p>“Same case” means every run received the same product requirements. Queue, database, framework, policy numbers, hosting, and UI stayed unspecified.</p>
        </div>
        <div className="table-scroll" tabIndex={0} aria-label="Framework comparison table">
          <table className="comparison-table">
            <thead><tr><th>Framework</th><th>Core artifact shape</th><th>Run result</th><th>Files</th><th>Tool availability</th></tr></thead>
            <tbody>
              {content.frameworks.map((framework) => (
                <tr key={framework.slug}>
                  <th><Link href={`/frameworks/${framework.slug}`}>{framework.name}</Link></th>
                  <td>{frameworkShape[framework.slug]}</td>
                  <td>{framework.status}</td>
                  <td>{framework.files.length}</td>
                  <td>{framework.slug === "kiro-specs" ? "Vendor auth required" : "Open source"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="findings page-width">
        <div className="section-heading"><p className="eyebrow">What the artifacts reveal</p><h2>Structure is a product choice</h2></div>
        <div className="finding-grid">
          <article><p className="finding-index">01</p><h3>Planning depth varies sharply</h3><p>Spec Kit expanded into contracts, a data model, validation steps, and 69 tasks. BMAD&apos;s express path stayed in one compact spec plus its memory log.</p></article>
          <article><p className="finding-index">02</p><h3>State lives in different places</h3><p>GSD writes a resumable project ledger. Matt Pocock&apos;s flow treats the durable spec and issue tracker as the handoff. Kiro keeps three linked documents.</p></article>
          <article><p className="finding-index">03</p><h3>Failures are part of the result</h3><p>Superpowers completed a design but not its plan; GSD created phase context but not a phase plan. Both partial trees remain downloadable with the interruption noted.</p></article>
        </div>
      </section>

      <section className="route-list page-width">
        <div className="section-heading"><p className="eyebrow">Start inspecting</p><h2>Frameworks and comparisons</h2></div>
        <div className="link-rows">
          {content.frameworks.map((framework) => <Link key={framework.slug} href={`/frameworks/${framework.slug}`}><span>{framework.name}</span><span>{framework.status} →</span></Link>)}
        </div>
        <div className="comparison-link-row">
          {content.comparisons.map((comparison) => <Link key={comparison.slug} href={`/compare/${comparison.slug}`}>{comparison.title} →</Link>)}
        </div>
      </section>
    </main>
  );
}
