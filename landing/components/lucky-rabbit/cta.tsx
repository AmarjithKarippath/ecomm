"use client"

import { motion } from "framer-motion"
import { Reveal } from "./reveal"

const DASHBOARD_URL =
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:5173/login"

export function Cta() {
  return (
    <section id="start" className="px-4 py-24">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-ink bg-ink px-6 py-20 text-center">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-brand/40 blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.45, 0.2] }}
            transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
            className="absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-brand-bright/40 blur-3xl"
          />
        </div>

        <div className="relative z-10">
          <Reveal>
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-extrabold leading-tight text-ink-foreground text-balance sm:text-5xl">
              Ready to start selling? Today&apos;s your lucky day.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-4 max-w-md leading-relaxed text-ink-foreground/70">
              Sign in to your dashboard and have a live store in minutes. No code,
              no commitment, no catch.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-8 flex justify-center">
              <motion.a
                href={DASHBOARD_URL}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="shrink-0 rounded-full bg-brand-bright px-7 py-3.5 font-semibold text-ink transition-colors hover:bg-primary"
              >
                Start free
              </motion.a>
            </div>
          </Reveal>

          <p className="mt-4 text-xs text-ink-foreground/50">
            By continuing, you agree to receive Lucky Rabbit product updates.
          </p>
        </div>
      </div>
    </section>
  )
}
