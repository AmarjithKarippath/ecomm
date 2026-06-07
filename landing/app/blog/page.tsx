import Link from "next/link";
import type { Metadata } from "next";
import { allPosts } from "@/lib/posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sainsberry.com";

export const metadata: Metadata = {
  title: "Blog — Sainsberry",
  description:
    "Conversion playbooks, single-product store tactics, India D2C payments, and quickstart guides for new ecommerce founders.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/blog`,
    title: "Sainsberry Blog — single-product store playbooks",
    description:
      "Conversion playbooks, single-product store tactics, India D2C payments, and quickstart guides for new ecommerce founders.",
  },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogIndex() {
  const posts = allPosts();
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to home</Link>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Blog
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Playbooks, experiments, and lessons for single-product store founders.
        </p>

        <ul className="mt-12 divide-y divide-border">
          {posts.map((p) => (
            <li key={p.slug} className="py-8">
              <article>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <time dateTime={p.publishedAt}>{formatDate(p.publishedAt)}</time>
                  <span aria-hidden>·</span>
                  <span>{p.readingMinutes} min read</span>
                  {p.tags.slice(0, 2).map((t) => (
                    <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-foreground/80">
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight">
                  <Link href={`/blog/${p.slug}`} className="text-foreground hover:text-primary">
                    {p.title}
                  </Link>
                </h2>
                <p className="mt-2 text-muted-foreground text-pretty">{p.description}</p>
                <Link
                  href={`/blog/${p.slug}`}
                  className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  Read post →
                </Link>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
