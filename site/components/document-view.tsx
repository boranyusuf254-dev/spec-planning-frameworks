"use client";

import { useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ExampleFile } from "../lib/data";

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

export function MarkdownBody({ content, headingPrefix = "doc" }: { content: string; headingPrefix?: string }) {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const markdown = frontmatter ? content.slice(frontmatter[0].length) : content;
  const components: Components = {
    h2: ({ children, ...props }) => {
      const text = String(children);
      return <h2 id={`${headingPrefix}-${slug(text)}`} {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }) => {
      const text = String(children);
      return <h3 id={`${headingPrefix}-${slug(text)}`} {...props}>{children}</h3>;
    },
    a: ({ href, children, ...props }) => (
      <a href={href} {...props} rel={href?.startsWith("http") ? "noreferrer" : undefined}>{children}</a>
    ),
  };

  return (
    <>
      {frontmatter && (
        <details className="frontmatter">
          <summary>Artifact metadata</summary>
          <pre><code>{frontmatter[1]}</code></pre>
        </details>
      )}
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{markdown}</ReactMarkdown>
    </>
  );
}

export function DocumentView({ file, headingPrefix = "doc", compact = false }: { file: ExampleFile; headingPrefix?: string; compact?: boolean }) {
  const [mode, setMode] = useState<"rendered" | "source">(file.format === "markdown" ? "rendered" : "source");
  const canRender = file.format === "markdown";

  return (
    <section className={`document-view${compact ? " document-view-compact" : ""}`} aria-label={file.path}>
      <div className="document-toolbar">
        <code title={file.path}>{file.path}</code>
        <div className="toolbar-actions">
          {canRender && (
            <div className="segmented" aria-label="Document display">
              <button type="button" aria-pressed={mode === "rendered"} onClick={() => setMode("rendered")}>Rendered</button>
              <button type="button" aria-pressed={mode === "source"} onClick={() => setMode("source")}>Source</button>
            </div>
          )}
          <a className="download-link" href={file.rawUrl} download>Raw ↗</a>
        </div>
      </div>
      <div className={`document-body ${mode === "source" ? "source-body" : "prose"}`} tabIndex={0} aria-label="Document contents">
        {mode === "rendered" && canRender ? (
          <MarkdownBody content={file.content} headingPrefix={headingPrefix} />
        ) : (
          <pre><code>{file.content}</code></pre>
        )}
      </div>
    </section>
  );
}
