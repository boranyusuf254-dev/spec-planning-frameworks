"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { ExampleFile } from "../lib/data";

export function FileTree({ slug, files, selected }: { slug: string; files: ExampleFile[]; selected: string }) {
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <nav className="file-tree" aria-label="Generated files">
      <p className="eyebrow">Output files</p>
      <ul>
        {files.map((file) => (
          <li key={file.path}>
            <Link
              ref={file.path === selected ? activeRef : undefined}
              className={file.path === selected ? "active" : undefined}
              aria-current={file.path === selected ? "page" : undefined}
              href={`/frameworks/${slug}/files/${file.path.split("/").map(encodeURIComponent).join("/")}`}
              title={file.path}
            >
              <span aria-hidden="true">{file.format === "markdown" ? "¶" : "{}"}</span>
              {file.path}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
