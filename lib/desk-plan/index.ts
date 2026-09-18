import { scorePlan } from "@/lib/algos"
import type { Candle } from "@/lib/market/types"
import { planLayers, type PlanContract } from "@/lib/plans/types"

export type DeskLevelName =
  | "VWAP"
  | "OR"
  | "PRIOR_H"
  | "PRIOR_L"
  | "ATR"

type LocalAnchorName =
  | "session-vwap"
  | "opening-range-5m-high"
  | "opening-range-5m-low"
  | "opening-range-15m-high"
  | "opening-range-15m-low"
  | "prior-session-high"
  | "prior-session-low"

export type DeskPlan = PlanContract & {
  source: "local-desk"
  setupName: "LocalDesk"
  levelsUsed: DeskLevelName[]
  checklist: string[]
  feedWarning?: string
  reason: string
  congestion: "low" | "medium" | "high"
  indicators: {
    sessionVwap: number
    openingRange5m: { high: number; low: number }
    openingRange15m: { high: number; low: number }
    priorSession?: { high: number; low: number }
    atr14: number
  }
}

type PriceLevel = { name: LocalAnchorName; price: number }

const roundPrice = (value: number) => Math.round(value * 100) / 100
const timestampMs = (time: number) => time < 10_000_000_000 ? time * 1_000 : time
const sessionKey = (candle: Candle) => new Date(timestampMs(candle.time)).toISOString().slice(0, 10)

function validCandles(candles: Candle[]) {
  return candles
    .filter((candle) =>
      [candle.time, candle.open, candle.high, candle.low, candle.close, candle.volume]
        .every(Number.isFinite) &&
      candle.high >= candle.low &&
      candle.close > 0,
    )
    .sort((a, b) => timestampMs(a.time) - timestampMs(b.time))
}

function sessionGroups(candles: Candle[]) {
  const groups = new Map<string, Candle[]>()
  for (const candle of candles) {
    const key = sessionKey(candle)
    groups.set(key, [...(groups.get(key) ?? []), candle])
  }
  return [...groups.values()]
}

export function sessionVwap(candles: Candle[]) {
  const weighted = candles.reduce(
    (total, candle) => {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3
      return {
        priceVolume: total.priceVolume + typicalPrice * Math.max(0, candle.volume),
        volume: total.volume + Math.max(0, candle.volume),
        fallback: total.fallback + typicalPrice,
      }
    },
    { priceVolume: 0, volume: 0, fallback: 0 },
  )
  if (!candles.length) return 0
  return weighted.volume > 0 ? weighted.priceVolume / weighted.volume : weighted.fallback / candles.length
}

export function openingRange(candles: Candle[], minutes: 5 | 15) {
  const bars = candles.slice(0, minutes / 5)
  if (!bars.length) return null
  return {
    high: Math.max(...bars.map((candle) => candle.high)),
    low: Math.min(...bars.map((candle) => candle.low)),
  }
}

export function atr14(candles: Candle[]) {
  if (!candles.length) return 0
  const ranges = candles.map((candle, index) => {
    const previousClose = candles[index - 1]?.close ?? candle.open
    return Math.max(
      candle.high - candle.low,
      Math.abs(candle.high - previousClose),
      Math.abs(candle.low - previousClose),
    )
  })
  const period = ranges.slice(-14)
  return period.reduce((sum, range) => sum + range, 0) / period.length
}

export function buildLocalDeskPlan(symbol: string, candles: Candle[]): DeskPlan | null {
  const groups = sessionGroups(validCandles(candles))
  const current = groups.at(-1)
  if (!current?.length) return null

  const prior = groups.at(-2)
  const or5 = openingRange(current, 5)!
  const or15 = openingRange(current, 15) ?? or5
  const vwap = sessionVwap(current)
  const atr = atr14(validCandles(candles))
  if (![vwap, atr].every((value) => Number.isFinite(value) && value > 0)) return null

  const priorRange = prior?.length ? {
    high: Math.max(...prior.map((candle) => candle.high)),
    low: Math.min(...prior.map((candle) => candle.low)),
  } : undefined

  const structuralLevels: PriceLevel[] = [
    { name: "session-vwap", price: vwap },
    { name: "opening-range-5m-high", price: or5.high },
    { name: "opening-range-5m-low", price: or5.low },
    { name: "opening-range-15m-high", price: or15.high },
    { name: "opening-range-15m-low", price: or15.low },
    ...(priorRange ? [
      { name: "prior-session-high" as const, price: priorRange.high },
      { name: "prior-session-low" as const, price: priorRange.low },
    ] : []),
  ]
  const last = current.at(-1)!.close
  const supports = structuralLevels.filter((level) => level.price <= last).sort((a, b) => b.price - a.price)
  const entryLevel = supports[0] ?? { name: "session-vwap" as const, price: vwap }
  const lowerSupport = supports.find((level) => level.price < entryLevel.price)
  const minimumStopDistance = atr * 0.5
  const structuralStop = lowerSupport?.price ?? entryLevel.price - atr
  const rawStop = Math.min(structuralStop, entryLevel.price - minimumStopDistance)

  const entry = roundPrice(entryLevel.price)
  const stop = roundPrice(rawStop)
  const risk = entry - stop
  if (!(risk > 0)) return null

  const resistance = structuralLevels
    .filter((level) => level.price > entry)
    .sort((a, b) => a.price - b.price)
  const firstTarget = resistance[0]
  const secondTarget = resistance.find((level) => level.price > (firstTarget?.price ?? entry))
  const t1 = roundPrice(firstTarget?.price ?? entry + risk * 2)
  const projectedT2 = Math.max(entry + risk * 3, t1 + risk)
  const t2 = roundPrice(secondTarget?.price ?? projectedT2)
  if (!(t1 > entry && t2 > t1)) return null

  const rMultiple = Math.round(((t1 - entry) / risk) * 100) / 100
  const stopDistancePercent = (risk / entry) * 100
  const openingWidth = or15.high - or15.low
  // Congestion heuristic: an OR15 no wider than 1.25 ATR is crowded, up to
  // 2 ATR is mixed, and a wider opening range is treated as low congestion.
  const congestion = openingWidth <= atr * 1.25 ? "high" : openingWidth <= atr * 2 ? "medium" : "low"
  const quality = scorePlan(rMultiple, stopDistancePercent, congestion)
  const bias = last >= vwap
    ? "Price is holding at or above session VWAP, so the local desk bias is upward."
    : "Price is below session VWAP, so buyers need to reclaim the BUY ZONE before acting."
  const invalidation = `The plan is invalid if a 5-minute candle closes below ${stop}.`
  const levelsUsed: DeskLevelName[] = [
    "VWAP",
    "OR",
    ...(priorRange ? ["PRIOR_H" as const, "PRIOR_L" as const] : []),
    "ATR",
  ]

  return {
    id: `${symbol}-LocalDesk`,
    symbol,
    source: "local-desk",
    setupName: "LocalDesk",
    side: "BUY",
    entry,
    stop,
    t1,
    t2,
    rMultiple,
    target1: t1,
    target2: t2,
    rewardRisk: rMultiple,
    quality,
    plainEnglish: quality === "Skip"
      ? "Skip this setup. The levels are too crowded, the stop is too wide, or the possible reward is too small."
      : `Check BUY ZONE at ${entry}. TAKE PROFIT at ${t1} and ${t2}. Set GET OUT at ${stop}.`,
    invalidation,
    ...planLayers(entry, stop, t1, bias, invalidation, rMultiple, "LocalDesk"),
    levelsUsed,
    checklist: ["Check BUY ZONE", "Set GET OUT", "Place order"],
    reason: bias,
    congestion,
    indicators: {
      sessionVwap: roundPrice(vwap),
      openingRange5m: { high: roundPrice(or5.high), low: roundPrice(or5.low) },
      openingRange15m: { high: roundPrice(or15.high), low: roundPrice(or15.low) },
      priorSession: priorRange
        ? { high: roundPrice(priorRange.high), low: roundPrice(priorRange.low) }
        : undefined,
      atr14: roundPrice(atr),
    },
  }
}

export function localDesk(symbol: string, candles: Candle[]) {
  const plan = buildLocalDeskPlan(symbol, candles)
  return plan ? [plan] : []
}
