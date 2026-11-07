import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { blogPosts, getPost } from "@/lib/marketing-content";
import { formatDate } from "@/lib/format";

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
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const { slug } = await Promise.resolve(params);
  const post = getPost(slug);
  if (!post) notFound();

  const related = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <>
      <div className="relative overflow-hidden bg-[#172d3a] text-white">
        <Image
          src={post.image}
          alt=""
          fill
          priority
          className="object-cover opacity-30"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#172d3a]/70 via-[#172d3a]/85 to-[#172d3a]" />
        <SiteHeader tone="overlay" />
        <div className="relative mx-auto max-w-3xl px-5 pb-14 pt-8 md:px-8 md:pb-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All guides
          </Link>
          <p className="mt-8 text-label text-[var(--secondary-deep)]">{post.category}</p>
          <h1 className="font-display mt-3 text-4xl leading-[1.08] tracking-[-0.03em] md:text-5xl">
            {post.title}
          </h1>
          <p className="mt-5 text-sm text-white/60">
            {formatDate(post.publishedAt)} · {post.readMins} min read · Roshan Care
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
        <p className="text-lg leading-relaxed text-heading/90">{post.excerpt}</p>
        <div className="mt-10 space-y-5">
          {post.body.map((para) => (
            <p key={para.slice(0, 24)} className="text-[15px] leading-relaxed text-muted">
              {para}
            </p>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-12 rounded-[var(--radius-xl)] border border-[var(--line)] bg-[linear-gradient(135deg,#f7faf9,#ddf5ec)] p-6 md:p-8">
          <h2 className="font-display text-2xl text-heading">Need a nurse for this?</h2>
          <p className="mt-2 text-sm text-muted">
            Bhilwara care desk shift, skill, aur address match karke assign karti hai — GPS attendance
            included.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/book" className="btn btn-primary">
              Book a Nurse <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/faq" className="btn btn-outline">
              Read FAQ
            </Link>
          </div>
        </div>
      </article>

      {related.length ? (
        <section className="border-t border-[var(--line)] bg-surface">
          <div className="mx-auto max-w-6xl px-5 py-14 md:px-8">
            <p className="text-label text-primary">Keep reading</p>
            <h2 className="font-display mt-2 text-2xl text-heading">Related guides</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="rounded-[var(--radius-xl)] border border-[var(--line)] p-5 transition hover:border-primary/25"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {p.category}
                  </p>
                  <h3 className="font-display mt-2 text-xl text-heading">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <SiteFooter />
    </>
  );
}
