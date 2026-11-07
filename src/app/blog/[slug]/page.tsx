import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogPostClient } from "@/components/marketing/BlogPostClient";
import { blogPosts, getPost } from "@/lib/marketing-content";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}): Promise<Metadata> {
  const { slug } = await Promise.resolve(params);
  const post = getPost(slug);
  if (!post) return { title: "Article" };
  return { title: post.title.en, description: post.excerpt.en };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  const post = getPost(slug);
  if (!post) notFound();
  return <BlogPostClient post={post} />;
}
