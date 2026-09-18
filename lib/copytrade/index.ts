import type { Signal } from "@/lib/algos"

export type CopyLeader = {
  id: string
  name: string
  style: string
  trackRecord: string
  note: string
}

export const COPY_LEADERS: CopyLeader[] = [
  {
    id: "scalpnova",
    name: "ScalpNova",
    style: "Fast momentum",
    trackRecord: "SIMULATED · 61% win rate",
    note: "Looks for quick moves after price clears a nearby high.",
  },
  {
    id: "swingpilot",
    name: "SwingPilot",
    style: "Patient trend",
    trackRecord: "SIMULATED · 58% win rate",
    note: "Waits for a pullback inside a stronger upward trend.",
  },
  {
    id: "capitalguard",
    name: "CapitalGuard",
    style: "Capital defense",
    trackRecord: "SIMULATED · 2.6 avg R:R",
    note: "Takes fewer setups and demands at least twice the possible reward.",
  },
]

export function leaderSignal(leaderId: string, base: Signal): Signal {
  const leader = COPY_LEADERS.find((item) => item.id === leaderId) ?? COPY_LEADERS[0]
  const reason = `${leader.note} ${base.reason}`
  return {
    ...base,
    id: `${base.id}-${leader.id}`,
    confidence: Math.max(52, base.confidence - (leader.id === "capitalguard" ? 0 : 4)),
    plainEnglish: `${leader.name} would follow this ${base.quality.toLowerCase()} setup. This is a simulated signal, not a copied real account.`,
    reason,
    why: { ...base.why, bias: reason },
  }
}
