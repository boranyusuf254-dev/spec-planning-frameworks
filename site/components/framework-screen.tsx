import Link from "next/link";
import type { ExampleFile, Framework } from "../lib/data";
import { DocumentView, MarkdownBody } from "./document-view";
import { FileTree } from "./file-tree";

const repoUrl = "https://github.com/plannotator/spec-planning-frameworks/blob/main/";

export function FrameworkScreen({ framework, selectedFile }: { framework: Framework; selectedFile: ExampleFile }) {
  return (
    <main id="main-content">
      <section className="framework-intro page-width">
        <div>
          <p className="eyebrow">Framework · {framework.status}</p>
          <h1>{framework.name}</h1>
          <p className="lede">{framework.definition}</p>
          <p className="byline">By {framework.author} · Evidence updated {framework.updated}</p>
        </div>
        <div className="intro-actions">
          <a className="button" href={framework.upstreamUrl}>Primary source ↗</a>
          <a className="button button-secondary" href={framework.docsUrl}>Plannotator guide ↗</a>
        </div>
      </section>

      <section id="artifact-viewer" className="viewer-layout page-width" aria-label={`${framework.name} example viewer`}>
        <FileTree slug={framework.slug} files={framework.files} selected={selectedFile.path} />
        <DocumentView file={selectedFile} headingPrefix={framework.slug} />
        <aside className="provenance-panel" aria-labelledby="provenance-title">
          <p className="eyebrow" id="provenance-title">Provenance</p>
          <dl className="compact-facts">
            <div><dt>Run</dt><dd>{framework.status}</dd></div>
            <div><dt>Version</dt><dd><code>{framework.version}</code></dd></div>
            <div><dt>License</dt><dd>{framework.license}</dd></div>
            <div><dt>Files</dt><dd>{framework.files.length}</dd></div>
          </dl>
          <ul className="source-list">
            {framework.sources.map((source) => <li key={source.url}><a href={source.url}>{source.label} ↗</a></li>)}
          </ul>
          <details>
            <summary>Full run record</summary>
            <div className="provenance-copy prose"><MarkdownBody content={framework.provenance} headingPrefix={`${framework.slug}-evidence`} /></div>
          </details>
          <a className="text-link" href={`${repoUrl}${framework.provenancePath}`}>Open evidence file ↗</a>
        </aside>
      </section>

      <section className="framework-details page-width">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>Artifact and workflow profile</h2>
        </div>
        <div className="table-scroll" tabIndex={0} aria-label={`${framework.name} comparison profile`}>
          <table className="profile-table">
            <thead><tr><th>Comparison criterion</th><th>Observed model</th></tr></thead>
            <tbody>
              <tr><th>Artifact model</th><td>{framework.artifactModel}</td></tr>
              <tr><th>Required inputs</th><td><ul>{framework.requiredInputs.map((item) => <li key={item}>{item}</li>)}</ul></td></tr>
              <tr><th>Stages and workflow</th><td><ol>{framework.workflow.map((item) => <li key={item}>{item}</li>)}</ol></td></tr>
              <tr><th>Task grain</th><td>{framework.taskGrain}</td></tr>
              <tr><th>Human review points</th><td>{framework.humanReview}</td></tr>
              <tr><th>Iteration loop</th><td>{framework.iterationLoop}</td></tr>
              <tr><th>Output files</th><td><ul className="code-list">{framework.outputFiles.map((item) => <li key={item}><code>{item}</code></li>)}</ul></td></tr>
              <tr><th>Tool or agent coupling</th><td>{framework.coupling}</td></tr>
              <tr><th>Customization</th><td>{framework.customization}</td></tr>
              <tr><th>Portability</th><td>{framework.portability}</td></tr>
              <tr><th>Install and run friction</th><td>{framework.friction}</td></tr>
              <tr><th>License and availability</th><td>{framework.license}. {framework.availability}.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="caveat-band">
        <div className="page-width caveat-inner">
          <div><p className="eyebrow">Read before comparing</p><h2>Limits of this run</h2></div>
          <ul>{framework.caveats.map((caveat) => <li key={caveat}>{caveat}</li>)}</ul>
        </div>
      </section>

      <nav className="next-links page-width" aria-label="Related pages">
        <Link href="/compare">Compare frameworks</Link>
        <Link href="/cases/reliable-webhook-delivery">Read the shared brief</Link>
      </nav>
    </main>
  );
}
