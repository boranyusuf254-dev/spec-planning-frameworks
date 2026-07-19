import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompareView } from "../../../components/compare-view";
import { canonicalUrl, content, getComparison, getFramework } from "../../../lib/data";

export const generateStaticParams = () => content.comparisons.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const comparison = getComparison((await params).slug);
  return comparison ? { title: comparison.title, description: comparison.summary, alternates: canonicalUrl(`/compare/${comparison.slug}/`) ? { canonical: canonicalUrl(`/compare/${comparison.slug}/`) } : undefined } : {};
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const comparison = getComparison((await params).slug);
  if (!comparison) notFound();
  const left = getFramework(comparison.left);
  const right = getFramework(comparison.right);
  if (!left || !right) notFound();
  const initialLeft = comparison.recommendedFiles.left;
  const initialRight = comparison.recommendedFiles.right;

  return (
    <main id="main-content">
      <section className="comparison-intro page-width">
        <p className="eyebrow">Artifact comparison</p>
        <h1>{comparison.title}</h1>
        <p className="lede">{comparison.summary}</p>
        <div className="comparison-facts">
          <p><strong>{left.name}</strong><span>{left.status} · {left.files.length} {left.files.length === 1 ? "file" : "files"}</span></p>
          <p><strong>{right.name}</strong><span>{right.status} · {right.files.length} {right.files.length === 1 ? "file" : "files"}</span></p>
        </div>
        {comparison.docsUrl && <a className="text-link" href={comparison.docsUrl}>Read the canonical Plannotator comparison ↗</a>}
      </section>
      <CompareView left={left} right={right} initialLeft={initialLeft} initialRight={initialRight} />
      <nav className="next-links page-width" aria-label="Related pages">
        <Link href={`/frameworks/${left.slug}`}>{left.name} profile</Link>
        <Link href={`/frameworks/${right.slug}`}>{right.name} profile</Link>
        <Link href="/cases/reliable-webhook-delivery">Shared brief</Link>
      </nav>
    </main>
  );
}
