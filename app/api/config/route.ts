import { NextResponse } from "next/server"
import { selectedProvider } from "@/lib/market/server"

export function GET() {
  const feed = selectedProvider()
  return NextResponse.json({
    feed,
    brokerModeAllowed: process.env.BROKER_MODE === "live",
    alpacaConfigured: Boolean(process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET),
    polygonConfigured: Boolean(process.env.POLYGON_API_KEY),
    finnhubConfigured: Boolean(process.env.FINNHUB_API_KEY),
  })
}
