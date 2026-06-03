"use client"

import { motion } from "framer-motion"
import Image from "next/image"

function FloatingChip({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: "backOut" }}
      className={className}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay }}
        className="rounded-2xl border border-border bg-card px-4 py-3 shadow-xl"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-32 md:pt-40">
      {/* soft background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-10 top-40 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground"
          >
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            Build, launch &amp; grow your store
          </motion.span>

          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[0.95] tracking-tight text-foreground text-balance sm:text-6xl lg:text-7xl">
            Open your shop in 10 minutes and{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">be selling</span>
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }}
                className="absolute bottom-1 left-0 z-0 h-3 w-full origin-left rounded-full bg-accent/60"
              />
            </span>{" "}
            by today.
          </h1>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground text-pretty">
            Lucky Rabbit gives you everything to start an online business — a
            beautiful storefront, smart product pages, and a checkout shoppers
            trust. No code, no luck required.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <motion.a
              href={process.env.NEXT_PUBLIC_DASHBOARD_URL || "http://localhost:5173/login"}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full bg-foreground px-7 py-3.5 text-base font-semibold text-background shadow-lg transition-colors hover:bg-primary"
            >
              Start your store
            </motion.a>
            <motion.a
              href="#tour"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full border border-border bg-card px-7 py-3.5 text-base font-semibold text-foreground transition-colors hover:border-foreground"
            >
              Take the tour
            </motion.a>
          </div>
        </div>

        {/* storefront mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotate: -2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-border bg-secondary/50 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-destructive/70" />
              <span className="h-3 w-3 rounded-full bg-accent" />
              <span className="h-3 w-3 rounded-full bg-primary" />
              <span className="ml-3 rounded-md bg-background px-3 py-1 text-xs text-muted-foreground">
                luckyrabbit.shop
              </span>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-display text-lg font-bold text-foreground">Wildgood Co.</p>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  New drop
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { src: "/images/product-sneaker.png", name: "Cloud Runner" },
                  { src: "/images/product-bag.png", name: "Everyday Tote" },
                ].map((p, i) => (
                  <motion.div
                    key={p.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
                    className="overflow-hidden rounded-xl border border-border bg-secondary/40"
                  >
                    <Image
                      src={p.src || "/placeholder.svg"}
                      alt={p.name}
                      width={200}
                      height={200}
                      className="aspect-square w-full object-cover"
                    />
                    <p className="px-3 py-2 text-sm font-medium text-foreground">{p.name}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <FloatingChip delay={1} className="absolute -left-6 top-24 hidden sm:block">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
                ★
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">New order!</p>
                <p className="text-xs text-muted-foreground">Just now · Cloud Runner</p>
              </div>
            </div>
          </FloatingChip>

          <FloatingChip delay={1.4} className="absolute -right-4 bottom-10 hidden sm:block">
            <div>
              <p className="text-xs text-muted-foreground">Today&apos;s visitors</p>
              <p className="font-display text-xl font-bold text-foreground">1,284</p>
              <span className="text-xs font-semibold text-primary">▲ live now</span>
            </div>
          </FloatingChip>
        </motion.div>
      </div>
    </section>
  )
}
