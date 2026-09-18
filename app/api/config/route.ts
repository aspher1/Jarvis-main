import { NextResponse } from "next/server"
import { selectedProvider } from "@/lib/market/server"

export function GET() {
  const feed = selectedProvider()
  return NextResponse.json({
    feed,
    brokerModeAllowed: process.env.BROKER_MODE === "live",
    alpacaConfigured: Boolean(process.env.ALPACA_API_KEY && process.env.ALPACA_API_SECRET),
    polygonConfigured: false,
    finnhubConfigured: false,
    disabledAdapters: {
      polygon: "Disabled until its snapshot path is implemented and verified.",
      finnhub: "Disabled until its snapshot path is implemented and verified.",
    },
  })
}
