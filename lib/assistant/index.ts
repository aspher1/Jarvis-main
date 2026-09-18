import type { Signal } from "@/lib/algos"
import { positionSize } from "@/lib/paper"

export type AssistantContext = {
  symbol: string
  equity: number
  riskPercent: number
  feed: "live" | "delayed" | "mock" | "polling"
  signals: Signal[]
}

export type JarvisPlan = Signal & {
  shares: number
  createdAt: number
  disclaimer: string
  checklist: string[]
  feedWarning?: string
}

export interface Assistant {
  propose(context: AssistantContext): Promise<JarvisPlan>
  explain(plan: JarvisPlan): string
}

export class LocalStructuredAssistant implements Assistant {
  async propose(context: AssistantContext): Promise<JarvisPlan> {
    const ranked = [...context.signals].sort((a, b) => {
      const quality = { Strong: 3, Okay: 2, Skip: 1 }
      return quality[b.quality] - quality[a.quality] || b.confidence - a.confidence
    })
    const best = ranked[0]
    if (!best) throw new Error("Turn on at least one Algo Radar module first.")
    return {
      ...best,
      shares: positionSize(context.equity, context.riskPercent, best.entry, best.stop),
      createdAt: Date.now(),
      disclaimer: "Not financial advice. You are responsible for orders. Trading can lose money, including your full account.",
      checklist: ["Check entry", "Set stop", "Place order"],
      feedWarning:
        context.feed === "live"
          ? undefined
          : "Based on delayed or demo prices — do not use this plan for a live day trade.",
    }
  }

  explain(plan: JarvisPlan) {
    return `${plan.reason} ${plan.invalidation} The plan offers ${plan.rewardRisk.toFixed(1)} times the possible reward for each dollar at risk.`
  }
}
