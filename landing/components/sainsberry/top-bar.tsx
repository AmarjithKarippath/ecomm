"use client"

import { motion } from "framer-motion"
import Link from "next/link"

function RabbitMark() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M11 14c-1.5-3-2-7-1-10 2 1 3.5 3.5 4.5 6.5M21 14c1.5-3 2-7 1-10-2 1-3.5 3.5-4.5 6.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 11c4.5 0 8 3.4 8 8 0 3.6-2.2 6.5-5 8h-6c-2.8-1.5-5-4.4-5-8 0-4.6 3.5-8 8-8Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="20" r="1.4" fill="currentColor" />
      <circle cx="19" cy="20" r="1.4" fill="currentColor" />
    </svg>
  )
}

export function TopBar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
    >
      <div className="flex w-full max-w-6xl items-center justify-between rounded-full border border-border/70 bg-background/80 px-5 py-2.5 shadow-sm backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold tracking-tight text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <RabbitMark />
          </span>
          Sainsberry
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href="/blog"
            className="hidden text-sm font-semibold text-foreground/80 transition-colors hover:text-foreground sm:inline"
          >
            Blog
          </Link>
          <motion.a
            href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:5173/login"}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-colors hover:bg-primary"
          >
            Start free
          </motion.a>
        </div>
      </div>
    </motion.header>
  )
}
