export type FeedKind = "live" | "delayed" | "mock" | "polling"

export type Candle = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Quote = {
  symbol: string
  price: number
  bid: number
  ask: number
  change: number
  changePercent: number
  timestamp: number
  feed: FeedKind
  provider: string
  lagMs?: number
  delayMinutes?: number
}

export interface MarketData {
  readonly name: string
  readonly kind: FeedKind
  getQuote(symbol: string): Promise<Quote>
  getCandles(symbol: string, limit?: number): Promise<Candle[]>
  subscribe(symbol: string, onQuote: (quote: Quote) => void): () => void
}

export const feedLabel = (quote: Pick<Quote, "feed" | "lagMs" | "delayMinutes">) => {
  if (quote.feed === "live") return `Prices: Live · ${quote.lagMs ?? 0}ms`
  if (quote.feed === "delayed") return `Prices: Delayed · ~${quote.delayMinutes ?? 15}m`
  if (quote.feed === "polling") return "Prices: Polling (slower)"
  return "Prices: Mock demo"
}
