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
