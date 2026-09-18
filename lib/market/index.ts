import type { Candle, FeedKind, MarketData, Quote } from "./types"

const BASE: Record<string, number> = { AAPL: 231.18, TSLA: 426.32, NVDA: 184.87, SPY: 659.42 }

function seeded(symbol: string) {
  return [...symbol].reduce((total, char) => total + char.charCodeAt(0), 0)
}

function mockCandles(symbol: string, limit = 120): Candle[] {
  const seed = seeded(symbol)
  let price = BASE[symbol] ?? 80 + (seed % 220)
  const now = Math.floor(Date.now() / 1000 / 300) * 300
  return Array.from({ length: limit }, (_, index) => {
    const pulse = Math.sin((index + seed) / 7) * price * 0.003
    const drift = Math.sin((index + seed) / 23) * price * 0.0015
    const open = price
    const close = Math.max(1, open + pulse + drift)
    price = close
    return {
      time: now - (limit - index) * 300,
      open,
      high: Math.max(open, close) + price * 0.002,
      low: Math.min(open, close) - price * 0.002,
      close,
      volume: 500_000 + ((seed * (index + 17) * 7919) % 1_800_000),
    }
  })
}

export class MockMarketData implements MarketData {
  readonly name = "Jarvis demo stream"
  readonly kind = "mock" as const

  async getCandles(symbol: string, limit = 120) {
    return mockCandles(symbol, limit)
  }

  async getQuote(symbol: string): Promise<Quote> {
    const candles = mockCandles(symbol)
    const price = candles.at(-1)?.close ?? BASE[symbol] ?? 100
    return {
      symbol,
      price,
      bid: price - 0.02,
      ask: price + 0.02,
      change: price * 0.008,
      changePercent: 0.8,
      timestamp: Date.now(),
      feed: "mock",
      provider: this.name,
      lagMs: 0,
    }
  }

  subscribe(symbol: string, onQuote: (quote: Quote) => void) {
    let tick = 0
    const timer = window.setInterval(async () => {
      const quote = await this.getQuote(symbol)
      const move = Math.sin(tick++ / 2) * quote.price * 0.0003
      onQuote({ ...quote, price: quote.price + move, bid: quote.bid + move, ask: quote.ask + move })
    }, 750)
    return () => window.clearInterval(timer)
  }
}

export class HttpMarketData implements MarketData {
  readonly name: string
  readonly kind: FeedKind
  constructor(name: string, kind: FeedKind) {
    this.name = name
    this.kind = kind
  }
  async getQuote(symbol: string) {
    const response = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}`)
    if (!response.ok) throw new Error("Price feed unavailable")
    return (await response.json()).quote as Quote
  }
  async getCandles(symbol: string, limit = 120) {
    const response = await fetch(`/api/market?symbol=${encodeURIComponent(symbol)}&limit=${limit}`)
    if (!response.ok) throw new Error("Chart feed unavailable")
    return (await response.json()).candles as Candle[]
  }
  subscribe(symbol: string, onQuote: (quote: Quote) => void) {
    const events = new EventSource(`/api/market/stream?symbol=${encodeURIComponent(symbol)}`)
    events.onmessage = (event) => onQuote(JSON.parse(event.data) as Quote)
    return () => events.close()
  }
}

export function clientMarketData(): MarketData {
  const mode = process.env.NEXT_PUBLIC_MARKET_MODE
  return mode && mode !== "mock" ? new HttpMarketData(mode, mode === "yahoo" ? "delayed" : "live") : new MockMarketData()
}

export { mockCandles }
export type { Candle, FeedKind, MarketData, Quote } from "./types"
export type FeedStatus = "LIVE" | "DELAYED" | "MOCK"

export type Candle = {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Quote = {
  symbol: string
  price: number
  change: number
  changePercent: number
  asOf: string
  status: FeedStatus
  source: string
}

export interface MarketData {
  readonly name: string
  quote(symbol: string): Promise<Quote>
  candles(symbol: string): Promise<Candle[]>
}

const BASE_PRICES: Record<string, number> = {
  AAPL: 234.42,
  TSLA: 426.18,
  NVDA: 181.62,
  SPY: 659.77,
}

function hashSymbol(symbol: string) {
  return [...symbol].reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

export function mockCandles(symbol: string, count = 96): Candle[] {
  const seed = hashSymbol(symbol)
  const base = BASE_PRICES[symbol] ?? 40 + (seed % 180)
  const now = new Date()
  now.setSeconds(0, 0)
  const rows: Candle[] = []
  let last = base * 0.965

  for (let index = count - 1; index >= 0; index -= 1) {
    const time = new Date(now.getTime() - index * 5 * 60_000)
    const wave = Math.sin((index + seed) / 5) * base * 0.0018
    const drift = base * 0.00035
    const open = last
    const close = Math.max(1, open + wave + drift)
    const spread = base * (0.0015 + ((index + seed) % 4) * 0.00025)
    rows.push({
      time: time.toISOString().slice(0, 19),
      open: +open.toFixed(2),
      high: +(Math.max(open, close) + spread).toFixed(2),
      low: +(Math.min(open, close) - spread).toFixed(2),
      close: +close.toFixed(2),
      volume: 180_000 + ((index * seed * 7919) % 640_000),
    })
    last = close
  }
  return rows
}

export class MockMarketData implements MarketData {
  readonly name = "Jarvis simulation"

  async candles(symbol: string) {
    return mockCandles(symbol.toUpperCase())
  }

  async quote(symbol: string) {
    const normalized = symbol.toUpperCase()
    const candles = await this.candles(normalized)
    const price = candles.at(-1)?.close ?? BASE_PRICES[normalized] ?? 100
    const previous = candles.at(-2)?.close ?? price
    const change = price - previous
    return {
      symbol: normalized,
      price,
      change: +change.toFixed(2),
      changePercent: +((change / previous) * 100).toFixed(2),
      asOf: new Date().toISOString(),
      status: "MOCK" as const,
      source: this.name,
    }
  }
}

type YahooChart = {
  chart?: {
    result?: Array<{
      timestamp?: number[]
      meta?: { regularMarketPrice?: number; previousClose?: number }
      indicators?: {
        quote?: Array<{
          open?: Array<number | null>
          high?: Array<number | null>
          low?: Array<number | null>
          close?: Array<number | null>
          volume?: Array<number | null>
        }>
      }
    }>
  }
}

export class YahooMarketData implements MarketData {
  readonly name = "Yahoo Finance"

  private async load(symbol: string): Promise<YahooChart> {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=5m&range=5d`
    const response = await fetch(url, {
      headers: { "User-Agent": "JarvisTradingCockpit/1.0" },
      next: { revalidate: 30 },
    })
    if (!response.ok) throw new Error(`Yahoo feed returned ${response.status}`)
    return response.json()
  }

  async candles(symbol: string) {
    const data = await this.load(symbol)
    const result = data.chart?.result?.[0]
    const quote = result?.indicators?.quote?.[0]
    if (!result?.timestamp || !quote) throw new Error("No public candle data")
    return result.timestamp.flatMap((timestamp, index) => {
      const open = quote.open?.[index]
      const high = quote.high?.[index]
      const low = quote.low?.[index]
      const close = quote.close?.[index]
      if (open == null || high == null || low == null || close == null) return []
      return [{
        time: new Date(timestamp * 1000).toISOString().slice(0, 19),
        open, high, low, close,
        volume: quote.volume?.[index] ?? 0,
      }]
    })
  }

  async quote(symbol: string) {
    const data = await this.load(symbol)
    const meta = data.chart?.result?.[0]?.meta
    if (!meta?.regularMarketPrice) throw new Error("No public quote")
    const previous = meta.previousClose ?? meta.regularMarketPrice
    const change = meta.regularMarketPrice - previous
    return {
      symbol: symbol.toUpperCase(),
      price: meta.regularMarketPrice,
      change: +change.toFixed(2),
      changePercent: +((change / previous) * 100).toFixed(2),
      asOf: new Date().toISOString(),
      status: "DELAYED" as const,
      source: this.name,
    }
  }
}

export class PolygonMarketData implements MarketData {
  readonly name = "Polygon"
  constructor(private readonly key: string) {}

  async candles(symbol: string) {
    const end = new Date()
    const start = new Date(end.getTime() - 5 * 24 * 60 * 60_000)
    const date = (value: Date) => value.toISOString().slice(0, 10)
    const url = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/5/minute/${date(start)}/${date(end)}?adjusted=true&sort=asc&limit=5000&apiKey=${this.key}`
    const response = await fetch(url, { next: { revalidate: 15 } })
    if (!response.ok) throw new Error(`Polygon feed returned ${response.status}`)
    const data = await response.json() as { results?: Array<{ t: number; o: number; h: number; l: number; c: number; v: number }> }
    return (data.results ?? []).map((bar) => ({
      time: new Date(bar.t).toISOString().slice(0, 19),
      open: bar.o, high: bar.h, low: bar.l, close: bar.c, volume: bar.v,
    }))
  }

  async quote(symbol: string) {
    const candles = await this.candles(symbol)
    const latest = candles.at(-1)
    const previous = candles.at(-2)
    if (!latest) throw new Error("No Polygon quote")
    const change = latest.close - (previous?.close ?? latest.open)
    return {
      symbol: symbol.toUpperCase(),
      price: latest.close,
      change: +change.toFixed(2),
      changePercent: +((change / (previous?.close ?? latest.open)) * 100).toFixed(2),
      asOf: new Date().toISOString(),
      status: "LIVE" as const,
      source: this.name,
    }
  }
}

export function getMarketData(): MarketData {
  if (process.env.POLYGON_API_KEY) return new PolygonMarketData(process.env.POLYGON_API_KEY)
  if (process.env.MARKET_DATA_MODE === "mock") return new MockMarketData()
  return new YahooMarketData()
}
