export type PlanQuality = "Strong" | "Okay" | "Skip"

export type PlanSurface = {
  buyZone: { label: "BUY ZONE"; price: number; subtitle?: "Buy here" }
  takeProfit: { label: "TAKE PROFIT"; price: number; subtitle?: "Take some money off" }
  getOut: { label: "GET OUT"; price: number; subtitle?: "Leave if price hits here" }
}

export type PlanWhy = {
  bias: string
  invalidation: string
  r: number
  setupName?: string
}

/**
 * Shared plan shape consumed by the companion and extension HUD.
 *
 * The aliases are intentional: order/risk code keeps target1/target2/rewardRisk,
 * while the local desk and Frontend contract use t1/t2/rMultiple. Producers must
 * assign each alias pair from the same numeric value.
 */
export type PlanContract = {
  id: string
  symbol: string
  source: "local-desk" | "algo"
  side: "BUY" | "SELL"
  entry: number
  stop: number
  t1: number
  t2: number
  rMultiple: number
  target1: number
  target2: number
  rewardRisk: number
  quality: PlanQuality
  plainEnglish: string
  invalidation: string
  surface: PlanSurface
  why: PlanWhy
}

export function planLayers(
  entry: number,
  stop: number,
  t1: number,
  bias: string,
  invalidation: string,
  rMultiple: number,
  setupName?: string,
): Pick<PlanContract, "surface" | "why"> {
  return {
    surface: {
      buyZone: { label: "BUY ZONE", price: entry, subtitle: "Buy here" },
      takeProfit: { label: "TAKE PROFIT", price: t1, subtitle: "Take some money off" },
      getOut: { label: "GET OUT", price: stop, subtitle: "Leave if price hits here" },
    },
    why: { bias, invalidation, r: rMultiple, setupName },
  }
}
