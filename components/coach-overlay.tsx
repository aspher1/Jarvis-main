"use client"

import { useEffect, useState } from "react"
import { ArrowRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CoachOverlay({ context }: { context: "home" | "trade" }) {
  const key = `jarvis-coach-${context}`
  const [open, setOpen] = useState(false)
  useEffect(() => setOpen(window.localStorage.getItem(key) !== "done"), [key])
  if (!open) return null

  const steps = context === "home"
    ? ["Pick a stock", "Turn on helpful modules", "Jarvis drops chart waypoints", "You confirm the order"]
    : ["Turn on modules", "Ask Jarvis for a plan", "Check BUY ZONE · TAKE PROFIT · GET OUT", "Place a Paper order"]

  return (
    <aside className="fixed bottom-8 left-4 z-40 w-[370px] border border-[#00d4aa] bg-[#101412] p-4 shadow-none" aria-label="First-run guide">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="micro !text-[#00d4aa]">Quick start · 20 seconds</div>
          <h2 className="mt-1 text-base font-semibold text-white">See the trade before you place it.</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Dismiss guide"
          onClick={() => {
            window.localStorage.setItem(key, "done")
            setOpen(false)
          }}
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-4 border border-[#2a2a2a]">
        {steps.map((step, index) => (
          <div key={step} className="relative border-r border-[#2a2a2a] p-2 last:border-r-0">
            <span className="mono block text-[10px] text-[#00d4aa]">0{index + 1}</span>
            <span className="mt-1 block text-[11px] leading-4 text-[#d0d0d0]">{step}</span>
            {index < steps.length - 1 ? <ArrowRight className="absolute -right-2 top-3 z-10 size-3 bg-[#101412] text-[#555]" /> : null}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] leading-4 text-[#888]">Start with practice money. Jarvis helps you take better trades and lose less. It does not guarantee profit.</p>
    </aside>
  )
}
