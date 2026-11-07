import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/marketing/PageHero";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { blogPosts } from "@/lib/marketing-content";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Roshan Care guides — home nursing, elderly care, GPS attendance, and medicine safety for Bhilwara families.",
};

export default function BlogIndexPage() {
  const [featured, ...rest] = blogPosts;

  return (
    <>
      <PageHero
        title="Care guides & insights"
        subtitle="Practical home-nursing notes for Bhilwara families — recovery, elderly safety, medicines, and trust systems."
        image="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=2000&q=80"
      />

      <div className="mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        {featured ? (
          <Link
            href={`/blog/${featured.slug}`}
            className="group relative grid overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--line)] bg-surface shadow-[var(--shadow-sm)] lg:grid-cols-[1.25fr_1fr]"
          >
            <div className="relative min-h-[240px] lg:min-h-[360px]">
              <Image
                src={featured.image}
                alt=""
                fill
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                sizes="(max-width:1024px) 100vw, 60vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#172d3a]/50 to-transparent lg:hidden" />
            </div>
            <div className="flex flex-col justify-center p-6 md:p-10">
              <p className="text-label text-primary">{featured.category}</p>
              <h2 className="font-display mt-3 text-3xl tracking-tight text-heading md:text-4xl">
                {featured.title}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{featured.excerpt}</p>
              <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-muted">
                {formatDate(featured.publishedAt)} · {featured.readMins} min read
              </p>
              <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Read article <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ) : null}

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--line)] bg-surface transition hover:border-primary/25 hover:shadow-[var(--shadow-md)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={post.image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  sizes="(max-width:768px) 100vw, 33vw"
                />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {post.category}
                </p>
                <h3 className="font-display mt-2 text-xl tracking-tight text-heading">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
                <p className="mt-4 text-[11px] font-semibold text-muted">
                  {formatDate(post.publishedAt)} · {post.readMins} min
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
