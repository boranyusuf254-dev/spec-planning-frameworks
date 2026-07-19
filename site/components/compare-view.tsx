"use client";

import { useMemo, useState } from "react";
import type { ExampleFile, Framework } from "../lib/data";
import { DocumentView } from "./document-view";

const headingList = (file: ExampleFile) =>
  [...file.content.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].replace(/[*_`]/g, "").trim());

const headingSlug = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

function FileSelect({ label, framework, value, onChange }: { label: string; framework: Framework; value: string; onChange: (value: string) => void }) {
  return (
    <label className="compare-file-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {framework.files.map((file) => <option key={file.path} value={file.path}>{file.path}</option>)}
      </select>
    </label>
  );
}

export function CompareView({ left, right, initialLeft, initialRight }: { left: Framework; right: Framework; initialLeft: string; initialRight: string }) {
  const [leftPath, setLeftPath] = useState(initialLeft);
  const [rightPath, setRightPath] = useState(initialRight);
  const leftFile = left.files.find((file) => file.path === leftPath) ?? left.files[0];
  const rightFile = right.files.find((file) => file.path === rightPath) ?? right.files[0];
  const sharedSections = useMemo(() => {
    const rightHeadings = new Set(headingList(rightFile).map((heading) => heading.toLowerCase()));
    return headingList(leftFile).filter((heading) => rightHeadings.has(heading.toLowerCase()));
  }, [leftFile, rightFile]);

  const choose = (side: "left" | "right", value: string) => {
    if (side === "left") setLeftPath(value);
    else setRightPath(value);
    const params = new URLSearchParams(window.location.search);
    params.set(side, value);
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`);
  };

  const jumpTo = (heading: string) => {
    const id = headingSlug(heading);
    document.getElementById(`compare-left-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    document.getElementById(`compare-right-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="comparison-workbench" aria-label="Side-by-side artifact comparison">
      <div className="comparison-controls">
        <FileSelect label={left.name} framework={left} value={leftFile.path} onChange={(value) => choose("left", value)} />
        <FileSelect label={right.name} framework={right} value={rightFile.path} onChange={(value) => choose("right", value)} />
      </div>
      {sharedSections.length > 0 && (
        <nav className="shared-section-nav" aria-label="Sections shared by both files">
          <span>Shared sections</span>
          {sharedSections.map((heading) => <button type="button" key={heading} onClick={() => jumpTo(heading)}>{heading}</button>)}
        </nav>
      )}
      <div className="comparison-panes">
        <DocumentView file={leftFile} headingPrefix="compare-left" compact />
        <DocumentView file={rightFile} headingPrefix="compare-right" compact />
      </div>
    </section>
  );
}
