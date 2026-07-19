import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FrameworkScreen } from "../../../components/framework-screen";
import { canonicalUrl, content, getFramework, primaryFile } from "../../../lib/data";

export const generateStaticParams = () => content.frameworks.map(({ slug }) => ({ slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const framework = getFramework((await params).slug);
  if (!framework) return {};
  return { title: framework.name, description: framework.definition, authors: [{ name: framework.author }], alternates: canonicalUrl(`/frameworks/${framework.slug}/`) ? { canonical: canonicalUrl(`/frameworks/${framework.slug}/`) } : undefined };
}

export default async function FrameworkPage({ params }: { params: Promise<{ slug: string }> }) {
  const framework = getFramework((await params).slug);
  if (!framework) notFound();
  return <FrameworkScreen framework={framework} selectedFile={primaryFile(framework)} />;
}
