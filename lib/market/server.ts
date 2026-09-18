import "server-only"
import { mockCandles, type Candle, type FeedKind, type Quote } from "."

type Snapshot = { quote: Quote; candles: Candle[] }

const cleanSymbol = (symbol: string) => symbol.toUpperCase().replace(/[^A-Z.-]/g, "").slice(0, 10)

export function selectedProvider(): { name: string; kind: FeedKind } {
  if (process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET) return { name: "Alpaca IEX", kind: "live" }
  if (process.env.POLYGON_API_KEY) return { name: "Polygon", kind: "live" }
  if (process.env.FINNHUB_API_KEY) return { name: "Finnhub", kind: "live" }
  if (process.env.MARKET_DATA_MODE === "yahoo") return { name: "Yahoo Finance", kind: "delayed" }
  return { name: "Jarvis demo stream", kind: "mock" }
}

async function yahooSnapshot(symbol: string, limit: number): Promise<Snapshot> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=5d`
  const response = await fetch(url, { cache: "no-store", headers: { "User-Agent": "Jarvis/1.0" } })
  if (!response.ok) throw new Error("Yahoo feed unavailable")
  const result = (await response.json()).chart.result[0]
  const timestamps: number[] = result.timestamp ?? []
  const quoteData = result.indicators.quote[0]
  const candles = timestamps
    .map((time, index) => ({
      time,
      open: quoteData.open[index],
      high: quoteData.high[index],
      low: quoteData.low[index],
      close: quoteData.close[index],
      volume: quoteData.volume[index],
    }))
    .filter((candle) => Object.values(candle).every((value) => value != null))
    .slice(-limit) as Candle[]
  const price = result.meta.regularMarketPrice
  const previous = result.meta.chartPreviousClose ?? price
  return {
    candles,
    quote: {
      symbol,
      price,
      bid: result.meta.bid ?? price,
      ask: result.meta.ask ?? price,
      change: price - previous,
      changePercent: ((price - previous) / previous) * 100,
      timestamp: (result.meta.regularMarketTime ?? Date.now() / 1000) * 1000,
      feed: "delayed",
      provider: "Yahoo Finance",
      delayMinutes: 15,
    },
  }
}

async function alpacaSnapshot(symbol: string, limit: number): Promise<Snapshot> {
  const headers = {
    "APCA-API-KEY-ID": process.env.ALPACA_API_KEY!,
    "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET!,
  }
  const [snapshotResponse, barsResponse] = await Promise.all([
    fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/snapshot?feed=iex`, { headers, cache: "no-store" }),
    fetch(`https://data.alpaca.markets/v2/stocks/${symbol}/bars?timeframe=5Min&limit=${limit}&feed=iex`, { headers, cache: "no-store" }),
  ])
  if (!snapshotResponse.ok || !barsResponse.ok) throw new Error("Alpaca feed unavailable")
  const snapshot = await snapshotResponse.json()
  const bars = (await barsResponse.json()).bars ?? []
  const trade = snapshot.latestTrade
  const quote = snapshot.latestQuote
  const previous = snapshot.prevDailyBar?.c ?? trade.p
  const eventTime = Date.parse(trade.t)
  return {
    candles: bars.map((bar: { t: string; o: number; h: number; l: number; c: number; v: number }) => ({
      time: Math.floor(Date.parse(bar.t) / 1000),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    })),
    quote: {
      symbol,
      price: trade.p,
      bid: quote.bp,
      ask: quote.ap,
      change: trade.p - previous,
      changePercent: ((trade.p - previous) / previous) * 100,
      timestamp: eventTime,
      feed: "live",
      provider: "Alpaca IEX",
      lagMs: Math.max(0, Date.now() - eventTime),
    },
  }
}

export async function getServerSnapshot(rawSymbol: string, limit = 120): Promise<Snapshot> {
  const symbol = cleanSymbol(rawSymbol)
  const provider = selectedProvider()
  try {
    if (provider.name === "Alpaca IEX") return await alpacaSnapshot(symbol, limit)
    if (provider.name === "Yahoo Finance") return await yahooSnapshot(symbol, limit)
  } catch {
    // Safe, clearly labeled fallback keeps the demo usable.
  }
  const candles = mockCandles(symbol, limit)
  const price = candles.at(-1)?.close ?? 100
  return {
    candles,
    quote: {
      symbol,
      price,
      bid: price - 0.02,
      ask: price + 0.02,
      change: price * 0.008,
      changePercent: 0.8,
      timestamp: Date.now(),
      feed: "mock",
      provider: "Jarvis demo stream",
      lagMs: 0,
    },
  }
}
