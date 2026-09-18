export type BrokerMode = "paper" | "live"

export type OrderRequest = {
  symbol: string
  side: "BUY" | "SELL"
  shares: number
  price: number
  stop: number
  target: number
  planQuality: "Strong" | "Okay" | "Skip"
  mode: BrokerMode
}

export type Fill = OrderRequest & {
  id: string
  filledAt: number
  status: "FILLED" | "REJECTED"
  ackMs: number
  pnl: number
  rResult?: number
  hasStop: boolean
}

export type Position = {
  symbol: string
  shares: number
  averagePrice: number
  currentPrice: number
  stop: number
  target: number
}

export type RiskRules = {
  equity: number
  maxRiskPercent: number
  minRewardRisk: number
  dailyLossPercent: number
}

export type RiskCheck = {
  allowed: boolean
  riskDollars: number
  riskPercent: number
  rewardRisk: number
  reasons: string[]
}

export interface Broker {
  readonly mode: BrokerMode
  submit(order: OrderRequest): Promise<Fill>
  flatten(symbol: string, price: number): Promise<Fill | null>
}

export function checkRisk(
  order: OrderRequest,
  rules: RiskRules,
  dailyPnl: number,
  consecutiveLosses = 0,
  allowSkipOverride = false,
): RiskCheck {
  const riskDollars = Math.abs(order.price - order.stop) * order.shares
  const riskPercent = (riskDollars / rules.equity) * 100
  const rewardRisk = Math.abs(order.target - order.price) / Math.max(0.01, Math.abs(order.price - order.stop))
  const reasons: string[] = []
  if (order.planQuality === "Skip" && !allowSkipOverride) reasons.push("This plan is rated Skip. Low-quality plans cannot be ordered.")
  if (riskPercent > rules.maxRiskPercent) reasons.push(`Risk is ${riskPercent.toFixed(2)}%. Your maximum is ${rules.maxRiskPercent}%.`)
  if (rewardRisk < rules.minRewardRisk) reasons.push(`Possible reward is only ${rewardRisk.toFixed(1)}R. Minimum is ${rules.minRewardRisk}R.`)
  if (dailyPnl <= -(rules.equity * rules.dailyLossPercent) / 100) reasons.push("Daily loss limit reached. New entries are locked.")
  if (consecutiveLosses >= 2) reasons.push("Two losses in a row. New entries are locked for an anti-tilt cooldown.")
  if (!order.stop || order.stop >= order.price) reasons.push("Add a stop loss below the entry before buying.")
  if (!Number.isFinite(order.shares) || order.shares <= 0) reasons.push("Share quantity must be greater than zero.")
  return { allowed: reasons.length === 0, riskDollars, riskPercent, rewardRisk, reasons }
}

export function positionSize(equity: number, riskPercent: number, entry: number, stop: number) {
  const perShare = Math.abs(entry - stop)
  if (!perShare) return 0
  return Math.max(0, Math.floor((equity * (riskPercent / 100)) / perShare))
}

export function journalMetrics(fills: Fill[]) {
  const closed = fills.filter((fill) => fill.side === "SELL")
  const wins = closed.filter((fill) => fill.pnl > 0)
  const totalPnl = closed.reduce((sum, fill) => sum + fill.pnl, 0)
  const avgR = closed.length ? closed.reduce((sum, fill) => sum + (fill.rResult ?? 0), 0) / closed.length : 0
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0
  const expectancy = closed.length ? totalPnl / closed.length : 0
  let peak = 0
  let running = 0
  let maxDrawdown = 0
  for (const fill of closed) {
    running += fill.pnl
    peak = Math.max(peak, running)
    maxDrawdown = Math.min(maxDrawdown, running - peak)
  }
  return { trades: closed.length, winRate, avgR, expectancy, maxDrawdown, totalPnl }
}
