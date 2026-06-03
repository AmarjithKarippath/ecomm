"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { Reveal } from "./reveal"

function DesignVisual() {
  const themes = [
    { label: "Bloom", c: "bg-primary" },
    { label: "Mono", c: "bg-foreground" },
    { label: "Sunny", c: "bg-accent" },
  ]
  return (
    <div className="flex flex-wrap gap-3">
      {themes.map((t, i) => (
        <motion.div
          key={t.label}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12 }}
          whileHover={{ y: -6, rotate: i % 2 ? 2 : -2 }}
          className="w-28 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <div className={`h-16 ${t.c}`} />
          <div className="space-y-1.5 p-2.5">
            <div className="h-2 w-3/4 rounded-full bg-muted" />
            <div className="h-2 w-1/2 rounded-full bg-muted" />
            <p className="pt-1 text-xs font-semibold text-foreground">{t.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function ProductVisual() {
  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.03 }}
        className="overflow-hidden rounded-2xl border border-border bg-secondary/40"
      >
        <Image
          src="/images/product-skincare.png"
          alt="Skincare serum product"
          width={360}
          height={260}
          className="h-44 w-full object-cover"
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="absolute -bottom-4 -right-3 rounded-xl border border-border bg-card px-3 py-2 shadow-lg"
      >
        <p className="text-xs font-medium text-muted-foreground">Auto-written</p>
        <p className="text-sm font-semibold text-primary">Glow Serum ✦</p>
      </motion.div>
    </div>
  )
}

function PayVisual() {
  const items = ["Cards", "Wallets", "UPI", "Buy now, pay later"]
  return (
    <div className="space-y-2.5">
      {items.map((it, i) => (
        <motion.div
          key={it}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5"
        >
          <span className="text-sm font-medium text-foreground">{it}</span>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
            ✓
          </span>
        </motion.div>
      ))}
    </div>
  )
}

const STEPS = [
  {
    n: "01",
    title: "Choose your design",
    body: "Start from a stunning prebuilt theme, or describe your vibe and let Lucky Rabbit generate a store that looks built just for your brand.",
    visual: <DesignVisual />,
  },
  {
    n: "02",
    title: "Make your products shine",
    body: "Drop in your photos and Lucky Rabbit polishes them, writes descriptions, and lays out product pages that turn browsers into buyers.",
    visual: <ProductVisual />,
  },
  {
    n: "03",
    title: "Get ready to get paid",
    body: "All you need is a bank account. Accept every way your customers love to pay, with secure checkout built right in.",
    visual: <PayVisual />,
  },
]

export function Steps() {
  return (
    <section id="tour" className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-2xl font-display text-4xl font-extrabold tracking-tight text-foreground text-balance sm:text-5xl">
            Three steps from idea to open for business.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <motion.article
                whileHover={{ y: -8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="flex h-full flex-col gap-6 rounded-3xl border border-border bg-card p-7 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-display text-sm font-bold text-primary">{s.n}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="min-h-[180px]">{s.visual}</div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-foreground">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </motion.article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
