import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FrameworkScreen } from "../../../../../components/framework-screen";
import { canonicalUrl, content, getFramework } from "../../../../../lib/data";

export const generateStaticParams = () =>
  content.frameworks.flatMap((framework) => framework.files.map((file) => ({ slug: framework.slug, path: file.path.split("/") })));

export async function generateMetadata({ params }: { params: Promise<{ slug: string; path: string[] }> }): Promise<Metadata> {
  const { slug, path } = await params;
  const framework = getFramework(slug);
  const route = `/frameworks/${slug}/files/${path.map(encodeURIComponent).join("/")}/`;
  return framework ? { title: `${path.at(-1)} — ${framework.name}`, description: `Inspect ${path.join("/")} from the ${framework.name} same-case run.`, alternates: canonicalUrl(route) ? { canonical: canonicalUrl(route) } : undefined } : {};
}

export default async function FrameworkFilePage({ params }: { params: Promise<{ slug: string; path: string[] }> }) {
  const { slug, path } = await params;
  const framework = getFramework(slug);
  if (!framework) notFound();
  const selectedFile = framework.files.find((file) => file.path === path.join("/"));
  if (!selectedFile) notFound();
  return <FrameworkScreen framework={framework} selectedFile={selectedFile} />;
}
