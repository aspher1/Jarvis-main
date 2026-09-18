"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, BookOpen, Crosshair, Radio, Settings2, ShieldAlert } from "lucide-react"
import { useJarvis } from "@/components/jarvis-provider"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/", label: "Watchlist", icon: Crosshair },
  { href: "/blotter", label: "P&L + Journal", icon: Activity },
  { href: "/how-it-works", label: "How it works", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings2 },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { preferences, dailyLocked } = useJarvis()
  const live = preferences.brokerMode === "live"

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <header className="sticky top-0 z-50 flex h-12 items-stretch border-b border-[#2a2a2a] bg-[#0d0d0d]">
        <Link href="/" className="flex w-52 items-center gap-3 border-r border-[#2a2a2a] px-4">
          <span className="relative flex size-6 items-center justify-center border border-[#00d4aa] text-[#00d4aa]">
            <Crosshair className="size-4" />
            <span className="absolute -right-1 -top-1 size-1.5 bg-[#a6ff4d]" />
          </span>
          <span>
            <strong className="block font-mono text-xs tracking-[0.24em] text-white">JARVIS</strong>
            <span className="micro block !text-[8px] !text-[#00d4aa]">Decision overlay</span>
          </span>
        </Link>
        <nav className="flex">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 border-r border-[#2a2a2a] px-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777] hover:bg-[#151515] hover:text-white",
                pathname === href && "bg-[#171717] text-[#00d4aa]",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center">
          {dailyLocked ? (
            <span className="flex h-full items-center gap-2 border-l border-[#ff4757] px-4 text-[10px] font-bold uppercase tracking-wider text-[#ff6a77]">
              <ShieldAlert className="size-3.5" /> Daily limit · Entries locked
            </span>
          ) : null}
          <span className={cn("flex h-full items-center gap-2 border-l px-4 text-[10px] font-bold uppercase tracking-wider", live ? "border-[#ff4757] text-[#ff6a77]" : "border-[#2a2a2a] text-[#00d4aa]")}>
            <Radio className="size-3.5" /> {live ? "Real money (Live)" : "Practice money (Paper)"}
          </span>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-[#2a2a2a] px-4 py-2 text-center text-[10px] uppercase tracking-[0.08em] text-[#777]">
        Not financial advice. Trading can lose money, including your full account. You are responsible for every order.
      </footer>
    </div>
  )
}
