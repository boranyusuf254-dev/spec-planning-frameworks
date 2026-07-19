import { cp, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteRoot, "..");
const publicRawRoot = path.join(siteRoot, "public", "raw");

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(absolute)));
    if (entry.isFile()) files.push(absolute);
  }

  return files;
}

const toUrlPath = (value) =>
  value
    .split(path.sep)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const formatFor = (file) => {
  const extension = path.extname(file).toLowerCase();
  if (extension === ".md" || extension === ".mdx") return "markdown";
  if (extension === ".json") return "json";
  if (extension === ".yaml" || extension === ".yml") return "yaml";
  return "text";
};

await rm(publicRawRoot, { recursive: true, force: true });
await mkdir(publicRawRoot, { recursive: true });

const frameworks = await readJson(path.join(repoRoot, "data", "frameworks.json"));
const comparisons = await readJson(path.join(repoRoot, "data", "comparisons.json"));
const briefPath = path.join(repoRoot, "cases", "reliable-webhook-delivery", "brief.md");
const brief = await readFile(briefPath, "utf8");
const publicBriefPath = path.join(publicRawRoot, "cases", "reliable-webhook-delivery", "brief.md");
await mkdir(path.dirname(publicBriefPath), { recursive: true });
await cp(briefPath, publicBriefPath);

const hydratedFrameworks = [];

for (const framework of frameworks) {
  const sourceRoot = path.join(repoRoot, framework.exampleRoot);
  const destinationRoot = path.join(publicRawRoot, framework.slug);
  const files = [];

  for (const absolute of await walk(sourceRoot)) {
    const relative = path.relative(sourceRoot, absolute);
    const destination = path.join(destinationRoot, relative);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(absolute, destination);
    files.push({
      path: relative.split(path.sep).join("/"),
      format: formatFor(absolute),
      content: await readFile(absolute, "utf8"),
      rawUrl: `/raw/${framework.slug}/${toUrlPath(relative)}`,
    });
  }

  const provenance = await readFile(path.join(repoRoot, framework.provenancePath), "utf8");
  hydratedFrameworks.push({ ...framework, files, provenance });
}

const output = {
  generatedAt: "2026-07-19T00:00:00.000Z",
  case: {
    id: "reliable-webhook-delivery",
    title: "Reliable webhook delivery",
    brief,
    sourcePath: "cases/reliable-webhook-delivery/brief.md",
  },
  frameworks: hydratedFrameworks,
  comparisons,
};

await mkdir(path.join(siteRoot, "content"), { recursive: true });
const outputPath = path.join(siteRoot, "content", "generated.json");
const temporaryOutputPath = `${outputPath}.${process.pid}.tmp`;
await writeFile(
  temporaryOutputPath,
  `${JSON.stringify(output, null, 2)}\n`,
  "utf8",
);
await rename(temporaryOutputPath, outputPath);

console.log(
  `Synced ${hydratedFrameworks.length} frameworks and ${hydratedFrameworks.reduce((total, framework) => total + framework.files.length, 0)} example files.`,
);
