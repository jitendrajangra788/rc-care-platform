"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { blogPosts, pick, type BlogPost } from "@/lib/marketing-content";
import { useLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";

export function BlogPostClient({ post }: { post: BlogPost }) {
  const { locale } = useLocale();
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
            {pick(post.title, locale)}
          </h1>
          <p className="mt-5 text-sm text-white/60">
            {formatDate(post.publishedAt)} · {post.readMins} min read · Roshan Care
          </p>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-5 py-8 md:px-8 md:py-10">
        <p className="text-lg leading-relaxed text-heading/90">
          {pick(post.excerpt, locale)}
        </p>
        <div className="mt-10 space-y-5">
          {post.body.map((para, idx) => (
            <p key={idx} className="text-[15px] leading-relaxed text-muted">
              {pick(para, locale)}
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
            The Bhilwara care desk matches shift, skill, and address — GPS attendance included.
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

        {related.length > 0 ? (
          <div className="mt-12">
            <h2 className="font-display text-xl text-heading">Related guides</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="rounded-[var(--radius-xl)] border border-[var(--line)] p-5 transition hover:border-primary/25"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {r.category}
                  </p>
                  <p className="font-display mt-2 text-lg text-heading">
                    {pick(r.title, locale)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </article>
      <SiteFooter />
    </>
  );
}
