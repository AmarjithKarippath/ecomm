"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Reveal } from "./reveal"

function ChannelOrbit() {
  const channels = ["Instagram", "TikTok", "Email", "Marketplace", "In person", "Search"]
  return (
    <div className="relative mt-8 flex flex-wrap gap-3">
      {channels.map((c, i) => (
        <motion.span
          key={c}
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          whileHover={{ scale: 1.08, backgroundColor: "var(--primary)", color: "var(--primary-foreground)" }}
          className="cursor-default rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
        >
          {c}
        </motion.span>
      ))}
    </div>
  )
}

function RetentionVisual() {
  const rows = [
    { t: "Welcome, friend 🐇", s: "Sent to 2,300 subscribers" },
    { t: "You left something behind", s: "Recovered 38 carts" },
    { t: "Members-only drop", s: "Opens in 2 days" },
  ]
  return (
    <div className="mt-8 space-y-3">
      {rows.map((r, i) => (
        <motion.div
          key={r.t}
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12 }}
          className="flex items-center gap-3 rounded-2xl border border-ink-foreground/15 bg-ink-foreground/5 px-4 py-3"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-bright/20 text-brand-bright">
            ✦
          </span>
          <div>
            <p className="text-sm font-semibold text-ink-foreground">{r.t}</p>
            <p className="text-xs text-ink-foreground/60">{r.s}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export function Grow() {
  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <p className="font-display text-sm font-bold uppercase tracking-widest text-primary">
            Get going, then get growing
          </p>
        </Reveal>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-3xl border border-border bg-card p-8 shadow-sm">
              <h3 className="font-display text-3xl font-bold tracking-tight text-foreground text-balance">
                Sell where they&apos;re scrolling
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Put your products in every feed, inbox, and marketplace your
                shoppers already live in — all managed from one tidy dashboard.
              </p>
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-6 overflow-hidden rounded-2xl border border-border shadow-lg"
              >
                <Image
                  src="/images/social-shopping.webp"
                  alt="A shopper browsing a brand's shoppable storefront on a phone"
                  width={1200}
                  height={800}
                  className="h-56 w-full object-cover sm:h-64"
                />
              </motion.div>
              <ChannelOrbit />
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="h-full rounded-3xl border border-ink bg-ink p-8 shadow-sm">
              <h3 className="font-display text-3xl font-bold tracking-tight text-ink-foreground text-balance">
                Keep them coming back
              </h3>
              <p className="mt-3 leading-relaxed text-ink-foreground/70">
                Reengage shoppers with a steady drumbeat of offers, updates, and
                automations that run while you sleep.
              </p>
              <RetentionVisual />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
