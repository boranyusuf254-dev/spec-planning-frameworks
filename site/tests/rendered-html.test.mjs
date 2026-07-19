import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readOutput = (relative) => readFile(new URL(`../out/${relative}`, import.meta.url), "utf8");

test("static export contains the comparison answer and framework matrix", async () => {
  const html = await readOutput("index.html");
  assert.match(html, /AI coding planning frameworks/);
  assert.match(html, /same reliable-webhook brief/i);
  assert.match(html, /Superpowers/);
  assert.match(html, /GitHub Spec Kit/);
  assert.match(html, /Manual source-faithful example/);
  assert.match(html, /application\/ld\+json/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
  assert.doesNotMatch(html, /rel="canonical"/i);
});

test("static export contains stable framework, file, comparison, and case routes", async () => {
  const outputs = [
    "frameworks/superpowers/index.html",
    "frameworks/github-spec-kit/files/specs/001-reliable-webhook-delivery/tasks.md/index.html",
    "compare/superpowers-vs-gsd/index.html",
    "cases/reliable-webhook-delivery/index.html",
  ];

  for (const output of outputs) {
    const html = await readOutput(output);
    assert.match(html, /<main[^>]+id="main-content"/i, output);
    assert.match(html, /View the repository/i, output);
  }
});

test("content sync preserves raw source bytes", async () => {
  const source = await readFile(new URL("../../examples/gsd/raw/.planning/ROADMAP.md", import.meta.url));
  const publicCopy = await readFile(new URL("../out/raw/gsd/.planning/ROADMAP.md", import.meta.url));
  assert.deepEqual(publicCopy, source);

  const generated = JSON.parse(await readFile(new URL("../content/generated.json", import.meta.url), "utf8"));
  assert.equal(generated.frameworks.length, 6);
  assert.equal(generated.frameworks.reduce((total, framework) => total + framework.files.length, 0), 37);
  assert.ok(generated.frameworks.every((framework) => framework.provenance.includes("# ")));
});

test("robots and sitemap are static outputs with configurable local origin", async () => {
  const [robots, sitemap] = await Promise.all([readOutput("robots.txt"), readOutput("sitemap.xml")]);
  assert.match(robots, /Sitemap: http:\/\/localhost:3000\/sitemap.xml/);
  assert.match(sitemap, /http:\/\/localhost:3000\/frameworks\/github-spec-kit/);
  assert.doesNotMatch(sitemap, /spec-planning-frameworks\.plannotator\.ai/);
});
