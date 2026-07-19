import type { Metadata } from "next";
import Link from "next/link";
import { canonicalUrl, content } from "../../lib/data";

export const metadata: Metadata = { title: "Frameworks", description: "Definitions, artifact trees, workflows, sources, and raw same-case examples for six AI coding planning frameworks.", alternates: canonicalUrl("/frameworks/") ? { canonical: canonicalUrl("/frameworks/") } : undefined };

export default function FrameworksPage() {
  return (
    <main id="main-content" className="page-width index-page">
      <p className="eyebrow">Evidence index</p>
      <h1>AI coding planning frameworks</h1>
      <p className="lede">Each profile begins with a plain definition, then shows the exact artifact tree, workflow, review points, primary sources, and run caveats.</p>
      <div className="framework-index">
        {content.frameworks.map((framework, index) => (
          <article key={framework.slug}>
            <p className="finding-index">{String(index + 1).padStart(2, "0")}</p>
            <h2><Link href={`/frameworks/${framework.slug}`}>{framework.name}</Link></h2>
            <p>{framework.definition}</p>
            <dl><div><dt>Run</dt><dd>{framework.status}</dd></div><div><dt>Version</dt><dd>{framework.version}</dd></div><div><dt>Files</dt><dd>{framework.files.length}</dd></div></dl>
          </article>
        ))}
      </div>
    </main>
  );
}
