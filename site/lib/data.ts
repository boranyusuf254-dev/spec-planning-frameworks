import generated from "../content/generated.json";

export type SourceLink = { label: string; url: string };
export type ExampleFile = {
  path: string;
  format: "markdown" | "json" | "yaml" | "text";
  content: string;
  rawUrl: string;
};

export type Framework = {
  slug: string;
  name: string;
  definition: string;
  author: string;
  updated: string;
  status: string;
  version: string;
  commit: string;
  license: string;
  availability: string;
  docsUrl: string;
  upstreamUrl: string;
  artifactModel: string;
  requiredInputs: string[];
  workflow: string[];
  taskGrain: string;
  humanReview: string;
  iterationLoop: string;
  outputFiles: string[];
  coupling: string;
  customization: string;
  portability: string;
  friction: string;
  exampleRoot: string;
  provenancePath: string;
  caveats: string[];
  sources: SourceLink[];
  files: ExampleFile[];
  provenance: string;
};

export type Comparison = {
  slug: string;
  left: string;
  right: string;
  title: string;
  summary: string;
  docsUrl?: string;
  recommendedFiles: { left: string; right: string };
};

export const content = generated as {
  generatedAt: string;
  case: { id: string; title: string; brief: string; sourcePath: string };
  frameworks: Framework[];
  comparisons: Comparison[];
};

export const getFramework = (slug: string) =>
  content.frameworks.find((framework) => framework.slug === slug);

export const getComparison = (slug: string) =>
  content.comparisons.find((comparison) => comparison.slug === slug);

export const primaryFile = (framework: Framework) =>
  framework.files.find((file) => /(^|\/)spec\.md$/i.test(file.path)) ??
  framework.files.find((file) => /requirements\.md$/i.test(file.path)) ??
  framework.files.find((file) => file.format === "markdown") ??
  framework.files[0];

export const origin = () =>
  (process.env.NEXT_PUBLIC_SITE_ORIGIN ?? "http://localhost:3000").replace(/\/$/, "");

export const canonicalUrl = (pathname: string) => {
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_ORIGIN?.replace(/\/$/, "");
  if (!configuredOrigin) return undefined;
  return `${configuredOrigin}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
};
