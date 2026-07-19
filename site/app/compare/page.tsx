import type { Metadata } from "next";
import Link from "next/link";
import { canonicalUrl, content, getFramework } from "../../lib/data";

export const metadata: Metadata = { title: "Compare frameworks", description: "Open two same-case specification or planning outputs in a source-aware side-by-side document viewer.", alternates: canonicalUrl("/compare/") ? { canonical: canonicalUrl("/compare/") } : undefined };

export default function CompareIndexPage() {
  return (
    <main id="main-content" className="page-width index-page">
      <p className="eyebrow">Side by side</p>
      <h1>Compare planning artifacts</h1>
      <p className="lede">Choose a tested pair. Each viewer keeps raw downloads, source view, and run status close to the documents.</p>
      <div className="comparison-index">
        {content.comparisons.map((comparison) => {
          const left = getFramework(comparison.left);
          const right = getFramework(comparison.right);
          return (
            <article key={comparison.slug}>
              <p className="comparison-names"><span>{left?.name}</span><span aria-hidden="true">↔</span><span>{right?.name}</span></p>
              <h2><Link href={`/compare/${comparison.slug}`}>{comparison.title}</Link></h2>
              <p>{comparison.summary}</p>
              <Link className="text-link" href={`/compare/${comparison.slug}`}>Open comparison →</Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}
