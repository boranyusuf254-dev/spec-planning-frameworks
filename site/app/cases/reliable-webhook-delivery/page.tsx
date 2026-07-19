import type { Metadata } from "next";
import Link from "next/link";
import { DocumentView } from "../../../components/document-view";
import { canonicalUrl, content, type ExampleFile } from "../../../lib/data";

export const metadata: Metadata = {
  title: "Reliable webhook delivery — shared case",
  description: "The neutral TypeScript SaaS webhook brief used unchanged across all six framework examples.",
  alternates: canonicalUrl("/cases/reliable-webhook-delivery/") ? { canonical: canonicalUrl("/cases/reliable-webhook-delivery/") } : undefined,
};

export default function CasePage() {
  const brief: ExampleFile = {
    path: content.case.sourcePath,
    format: "markdown",
    content: content.case.brief,
    rawUrl: "/raw/cases/reliable-webhook-delivery/brief.md",
  };

  return (
    <main id="main-content">
      <section className="case-intro page-width">
        <p className="eyebrow">Controlled input · reliable-webhook-delivery</p>
        <h1>One neutral brief for every framework</h1>
        <p className="lede">The product requirements never change between runs. Unspecified technology and policy choices stay open so the artifacts expose what each workflow chooses, asks, or assumes.</p>
      </section>
      <section className="case-layout page-width">
        <aside>
          <p className="eyebrow">Comparison rule</p>
          <p>No framework receives extra requirements. We do not score prose style or count pages as a proxy for quality.</p>
          <h2>What to inspect</h2>
          <ul><li>Which choices become assumptions?</li><li>Where can a human review?</li><li>How small are the tasks?</li><li>Can another tool read the output?</li></ul>
        </aside>
        <DocumentView file={brief} headingPrefix="case" />
      </section>
      <section className="route-list page-width">
        <div className="section-heading"><p className="eyebrow">All outputs</p><h2>Open the same case in each framework</h2></div>
        <div className="link-rows">{content.frameworks.map((framework) => <Link key={framework.slug} href={`/frameworks/${framework.slug}`}><span>{framework.name}</span><span>{framework.files.length} files →</span></Link>)}</div>
      </section>
    </main>
  );
}
