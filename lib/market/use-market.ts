"use client"

import { useEffect, useMemo, useState } from "react"
import { useJarvis } from "@/components/jarvis-provider"
import { clientMarketData, type Candle, type Quote } from "."

export function useMarket(symbol: string) {
  const adapter = useMemo(() => clientMarketData(), [])
  const [quote, setQuote] = useState<Quote | null>(null)
  const [candles, setCandles] = useState<Candle[]>([])
  const [error, setError] = useState("")
  const { updatePrice } = useJarvis()

  useEffect(() => {
    let active = true
    setError("")
    Promise.all([adapter.getQuote(symbol), adapter.getCandles(symbol)])
      .then(([nextQuote, nextCandles]) => {
        if (!active) return
        setQuote(nextQuote)
        setCandles(nextCandles)
        updatePrice(symbol, nextQuote.price)
      })
      .catch(() => setError("Feed unavailable"))
    const unsubscribe = adapter.subscribe(symbol, (nextQuote) => {
      if (!active) return
      setQuote(nextQuote)
      updatePrice(symbol, nextQuote.price)
      setCandles((current) => {
        if (!current.length) return current
        const last = current.at(-1)!
        const nowBucket = Math.floor(Date.now() / 300_000) * 300
        if (last.time === nowBucket) {
          return [...current.slice(0, -1), { ...last, high: Math.max(last.high, nextQuote.price), low: Math.min(last.low, nextQuote.price), close: nextQuote.price }]
        }
        return [...current.slice(-119), { time: nowBucket, open: last.close, high: nextQuote.price, low: nextQuote.price, close: nextQuote.price, volume: 0 }]
      })
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [adapter, symbol, updatePrice])

  return { quote, candles, error }
}
