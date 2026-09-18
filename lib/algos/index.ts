import type { Candle } from "@/lib/market"

export type AlgoName = "TrendFollow" | "MeanRevert" | "Breakout"
export type PlanQuality = "Strong" | "Okay" | "Skip"

export type DeskMemo = {
  vwap: number
  priorHigh: number
  priorLow: number
  openingRangeHigh: number
  openingRangeLow: number
  bias: "Bullish" | "Neutral" | "Bearish"
  catalystWindow: string
  hedgeNote: string
}

export type Signal = {
  id: string
  symbol: string
  algo: AlgoName
  side: "BUY" | "SELL"
  entry: number
  stop: number
  target1: number
  target2: number
  confidence: number
  rewardRisk: number
  quality: PlanQuality
  plainEnglish: string
  reason: string
  invalidation: string
  congestion: "low" | "medium" | "high"
  desk: DeskMemo
}

const round = (value: number) => Math.round(value * 100) / 100
const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

export function analyzeDesk(candles: Candle[]): DeskMemo {
  const session = candles.slice(-78)
  const prior = candles.slice(-156, -78)
  const reference = prior.length ? prior : candles.slice(0, Math.max(1, candles.length - 24))
  const opening = session.slice(0, Math.min(6, session.length))
  const cumulativeVolume = session.reduce((sum, candle) => sum + Math.max(1, candle.volume), 0)
  const vwap = session.reduce((sum, candle) => {
    const typical = (candle.high + candle.low + candle.close) / 3
    return sum + typical * Math.max(1, candle.volume)
  }, 0) / Math.max(1, cumulativeVolume)
  const last = session.at(-1)?.close ?? 0
  const openingRangeHigh = Math.max(...opening.map((candle) => candle.high))
  const openingRangeLow = Math.min(...opening.map((candle) => candle.low))
  const priorHigh = Math.max(...reference.map((candle) => candle.high))
  const priorLow = Math.min(...reference.map((candle) => candle.low))
  const bias = last > vwap && last > openingRangeHigh ? "Bullish" : last < vwap && last < openingRangeLow ? "Bearish" : "Neutral"
  return {
    vwap: round(vwap),
    priorHigh: round(priorHigh),
    priorLow: round(priorLow),
    openingRangeHigh: round(openingRangeHigh),
    openingRangeLow: round(openingRangeLow),
    bias,
    catalystWindow: "Check scheduled news and earnings before trading; local price rules cannot see breaking news.",
    hedgeNote: bias === "Bullish" ? "Keep the stop below the level that proves buyers lost control." : "Use smaller size while price is mixed around VWAP.",
  }
}

export function scorePlan(rewardRisk: number, stopDistancePercent: number, congestion: Signal["congestion"]): PlanQuality {
  if (rewardRisk < 2 || congestion === "high" || stopDistancePercent > 3) return "Skip"
  if (rewardRisk >= 2 && congestion === "low" && stopDistancePercent <= 2) return "Strong"
  return "Okay"
}

function signal(symbol: string, algo: AlgoName, entry: number, stop: number, confidence: number, congestion: Signal["congestion"], reason: string, desk: DeskMemo): Signal {
  const risk = Math.abs(entry - stop)
  const target1 = entry + risk * 2
  const target2 = entry + risk * 3
  const rewardRisk = round((target1 - entry) / risk)
  const quality = scorePlan(rewardRisk, (risk / entry) * 100, congestion)
  return {
    id: `${symbol}-${algo}`,
    symbol,
    algo,
    side: "BUY",
    entry: round(entry),
    stop: round(stop),
    target1: round(target1),
    target2: round(target2),
    confidence,
    rewardRisk,
    quality,
    plainEnglish:
      quality === "Skip"
        ? "Skip this setup — price is crowded or the reward is too small."
        : `Buy near ${round(entry)} only if price holds. Get out at ${round(stop)} if wrong.`,
    reason,
    invalidation: `Out if a 5-minute candle closes below ${round(stop)}.`,
    congestion,
    desk,
  }
}

export function trendFollow(symbol: string, candles: Candle[]): Signal[] {
  if (candles.length < 30) return []
  const closes = candles.map((candle) => candle.close)
  const fast = average(closes.slice(-10))
  const slow = average(closes.slice(-30))
  const last = closes.at(-1)!
  const desk = analyzeDesk(candles)
  const entry = last
  const recentLow = Math.min(...candles.slice(-8).map((candle) => candle.low))
  const stop = Math.min(entry * 0.995, Math.max(entry * 0.99, recentLow))
  return [signal(symbol, "TrendFollow", entry, stop, fast > slow ? 82 : 58, fast > slow && desk.bias === "Bullish" ? "low" : "medium", `Price is ${last >= desk.vwap ? "above" : "below"} VWAP ${desk.vwap.toFixed(2)} and the short trend is ${fast > slow ? "leading" : "mixed"}.`, desk)]
}

export function meanRevert(symbol: string, candles: Candle[]): Signal[] {
  if (candles.length < 20) return []
  const closes = candles.map((candle) => candle.close)
  const mean = average(closes.slice(-20))
  const last = closes.at(-1)!
  const desk = analyzeDesk(candles)
  const entry = Math.min(last, desk.vwap * 0.997)
  const stop = Math.min(entry * 0.99, desk.openingRangeLow)
  return [signal(symbol, "MeanRevert", entry, stop, last < mean ? 76 : 55, Math.abs(last - mean) / mean < 0.004 ? "high" : "medium", `Price moved away from VWAP ${desk.vwap.toFixed(2)} and may return to its recent average.`, desk)]
}

export function breakout(symbol: string, candles: Candle[]): Signal[] {
  if (candles.length < 25) return []
  const recent = candles.slice(-21, -1)
  const resistance = Math.max(...recent.map((candle) => candle.high))
  const desk = analyzeDesk(candles)
  const last = candles.at(-1)!.close
  const trigger = Math.max(resistance, desk.priorHigh, desk.openingRangeHigh)
  const entry = Math.max(last, trigger + 0.01)
  const stop = Math.min(entry * 0.995, Math.max(desk.vwap, desk.openingRangeHigh) - 0.01)
  return [signal(symbol, "Breakout", entry, stop, last >= trigger ? 86 : 68, last >= trigger && desk.bias === "Bullish" ? "low" : "medium", `Price is testing the prior high ${desk.priorHigh.toFixed(2)} and opening range high ${desk.openingRangeHigh.toFixed(2)}.`, desk)]
}

export const ALGO_RUNNERS: Record<AlgoName, (symbol: string, candles: Candle[]) => Signal[]> = {
  TrendFollow: trendFollow,
  MeanRevert: meanRevert,
  Breakout: breakout,
}
