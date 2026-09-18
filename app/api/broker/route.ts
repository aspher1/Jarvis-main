import { NextResponse } from "next/server"
import { selectedProvider } from "@/lib/market/server"
import type { Fill, OrderRequest } from "@/lib/paper"

const ACKNOWLEDGMENT = "I understand this can lose real money"

export async function POST(request: Request) {
  const started = performance.now()
  const body = (await request.json()) as {
    order: OrderRequest
    acknowledgment?: string
    safeUnlockPassed?: boolean
  }

  if (body.order.mode !== "live") {
    return NextResponse.json({ error: "Local paper orders do not use the live broker route." }, { status: 400 })
  }
  if (process.env.BROKER_MODE !== "live") {
    return NextResponse.json({ error: "Live broker is disabled on this server." }, { status: 403 })
  }
  if (!process.env.ALPACA_API_KEY || !process.env.ALPACA_API_SECRET) {
    return NextResponse.json({ error: "Alpaca credentials are not configured." }, { status: 503 })
  }
  if (body.acknowledgment !== ACKNOWLEDGMENT) {
    return NextResponse.json({ error: "Type the full real-money acknowledgment." }, { status: 400 })
  }
  if (!body.safeUnlockPassed) {
    return NextResponse.json({ error: "Complete 10 stopped paper trades before unlocking real money." }, { status: 403 })
  }
  if (selectedProvider().kind !== "live") {
    return NextResponse.json({ error: "A live feed is required for live orders." }, { status: 403 })
  }

  const response = await fetch("https://api.alpaca.markets/v2/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "APCA-API-KEY-ID": process.env.ALPACA_API_KEY,
      "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET,
    },
    body: JSON.stringify({
      symbol: body.order.symbol,
      qty: body.order.shares,
      side: body.order.side.toLowerCase(),
      type: "market",
      time_in_force: "day",
      client_order_id: `jarvis-${crypto.randomUUID()}`,
    }),
  })
  const result = await response.json()
  if (!response.ok) {
    return NextResponse.json({ error: result.message ?? "Broker rejected the order." }, { status: response.status })
  }

  const fill: Fill = {
    ...body.order,
    id: result.id,
    filledAt: Date.now(),
    status: "FILLED",
    ackMs: Math.round(performance.now() - started),
    pnl: 0,
    hasStop: Boolean(body.order.stop),
  }
  return NextResponse.json({ fill, brokerStatus: result.status })
}
