import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allPosts, getPost, type Block } from "@/lib/posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sainsberry.com";

export function generateStaticParams() {
  return allPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author }],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      authors: [post.author],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "h2": {
      const id = block.id ?? slugify(block.text);
      return <h2 id={id} className="mt-12 text-2xl font-bold tracking-tight text-foreground scroll-mt-24">{block.text}</h2>;
    }
    case "h3": {
      const id = block.id ?? slugify(block.text);
      return <h3 id={id} className="mt-8 text-xl font-semibold text-foreground scroll-mt-24">{block.text}</h3>;
    }
    case "p":
      return <p className="mt-4 leading-relaxed text-foreground/90">{block.text}</p>;
    case "ul":
      return (
        <ul className="mt-4 list-disc space-y-2 pl-6 text-foreground/90 marker:text-muted-foreground">
          {block.items.map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-4 list-decimal space-y-2 pl-6 text-foreground/90 marker:text-muted-foreground">
          {block.items.map((it, i) => <li key={i}>{it}</li>)}
        </ol>
      );
    case "quote":
      return (
        <blockquote className="mt-6 border-l-4 border-primary bg-secondary/40 px-5 py-3 italic text-foreground/85">
          “{block.text}”
          {block.cite && <footer className="mt-2 text-sm not-italic text-muted-foreground">— {block.cite}</footer>}
        </blockquote>
      );
    case "callout":
      return (
        <aside className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-5 text-foreground/90">
          {block.text}
        </aside>
      );
  }
}

function relatedPosts(currentSlug: string) {
  return allPosts().filter((p) => p.slug !== currentSlug).slice(0, 3);
}

export default async function BlogPost(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${post.slug}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: post.hero ? [`${SITE_URL}${post.hero}`] : [`${SITE_URL}/og.png`],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: "Sainsberry",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.tags.join(", "),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="mx-auto max-w-2xl px-6 py-16">
        <nav className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="px-2" aria-hidden>/</span>
          <Link href="/blog" className="hover:text-foreground">Blog</Link>
        </nav>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </time>
            <span aria-hidden>·</span>
            <span>{post.readingMinutes} min read</span>
            <span aria-hidden>·</span>
            <span>{post.author}</span>
          </div>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl text-balance">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">{post.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-foreground/80">
                #{t}
              </span>
            ))}
          </div>
        </header>

        <div className="prose-base mt-10">
          {post.body.map((block, i) => <RenderBlock key={i} block={block} />)}
        </div>

        <section className="mt-16 border-t border-border pt-10">
          <h2 className="text-lg font-semibold text-foreground">Keep reading</h2>
          <ul className="mt-4 space-y-3">
            {relatedPosts(post.slug).map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="group block">
                  <div className="font-semibold text-foreground group-hover:text-primary">{p.title}</div>
                  <div className="text-sm text-muted-foreground">{p.description}</div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12">
          <Link
            href={process.env.NEXT_PUBLIC_DASHBOARD_URL || "/"}
            className="inline-block rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background hover:bg-primary"
          >
            Start your store →
          </Link>
        </div>
      </article>
    </main>
  );
}
