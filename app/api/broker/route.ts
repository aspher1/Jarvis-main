import { NextResponse } from "next/server"
import { getServerSnapshot } from "@/lib/market/server"
import { checkRisk, type Fill, type OrderRequest, type RiskRules } from "@/lib/paper"

const ACKNOWLEDGMENT = "I understand this can lose real money"

export async function POST(request: Request) {
  const started = performance.now()
  const body = (await request.json()) as {
    order: OrderRequest
    acknowledgment?: string
    safeUnlockPassed?: boolean
    riskRules?: RiskRules
    riskState?: { dailyPnl?: number; consecutiveLosses?: number }
  }

  if (body.order.mode !== "live") {
    return NextResponse.json({ error: "Local paper orders do not use the live broker route." }, { status: 400 })
  }
  if (!["Strong", "Okay", "Skip"].includes(body.order.planQuality)) {
    return NextResponse.json({ error: "A server-verifiable plan quality is required." }, { status: 400 })
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
  const headers = {
    "Content-Type": "application/json",
    "APCA-API-KEY-ID": process.env.ALPACA_API_KEY,
    "APCA-API-SECRET-KEY": process.env.ALPACA_API_SECRET,
  }
  const [{ quote }, accountResponse] = await Promise.all([
    getServerSnapshot(body.order.symbol),
    fetch("https://api.alpaca.markets/v2/account", { headers, cache: "no-store" }),
  ])
  if (quote.feed !== "live") {
    return NextResponse.json({ error: `Live orders require an actual LIVE quote. Resolved feed was ${quote.feed.toUpperCase()}.` }, { status: 403 })
  }
  if (!accountResponse.ok) {
    return NextResponse.json({ error: "Could not verify live account risk limits." }, { status: 503 })
  }
  const account = await accountResponse.json() as { equity?: string; last_equity?: string; trading_blocked?: boolean }
  if (account.trading_blocked) {
    return NextResponse.json({ error: "Alpaca reports that trading is blocked on this account." }, { status: 403 })
  }
  const equity = Number(account.equity)
  const lastEquity = Number(account.last_equity)
  if (!Number.isFinite(equity) || equity <= 0) {
    return NextResponse.json({ error: "Could not verify live account equity." }, { status: 503 })
  }
  const requestedRules = body.riskRules
  const serverRules: RiskRules = {
    equity,
    maxRiskPercent: Math.min(1, Math.max(0.1, requestedRules?.maxRiskPercent ?? 1)),
    minRewardRisk: Math.max(2, requestedRules?.minRewardRisk ?? 2),
    dailyLossPercent: Math.min(3, Math.max(0.5, requestedRules?.dailyLossPercent ?? 3)),
  }
  const brokerDailyPnl = Number.isFinite(lastEquity) ? equity - lastEquity : 0
  const reportedDailyPnl = Number(body.riskState?.dailyPnl ?? 0)
  const dailyPnl = Math.min(brokerDailyPnl, Number.isFinite(reportedDailyPnl) ? reportedDailyPnl : 0)
  const consecutiveLosses = Math.max(0, Math.floor(Number(body.riskState?.consecutiveLosses ?? 0)))
  const serverOrder: OrderRequest = {
    ...body.order,
    price: body.order.side === "BUY" ? quote.ask : quote.bid,
  }
  const risk = checkRisk(serverOrder, serverRules, dailyPnl, consecutiveLosses)
  if (!risk.allowed) {
    return NextResponse.json({ error: risk.reasons.join(" "), risk }, { status: 422 })
  }

  const response = await fetch("https://api.alpaca.markets/v2/orders", {
    method: "POST",
    headers,
    body: JSON.stringify({
      symbol: serverOrder.symbol,
      qty: serverOrder.shares,
      side: serverOrder.side.toLowerCase(),
      type: "market",
      time_in_force: "day",
      order_class: "bracket",
      take_profit: { limit_price: serverOrder.target },
      stop_loss: { stop_price: serverOrder.stop },
      client_order_id: `jarvis-${crypto.randomUUID()}`,
    }),
  })
  const result = await response.json()
  if (!response.ok) {
    return NextResponse.json({ error: result.message ?? "Broker rejected the order." }, { status: response.status })
  }

  const fill: Fill = {
    ...serverOrder,
    id: result.id,
    filledAt: Date.now(),
    status: "FILLED",
    ackMs: Math.round(performance.now() - started),
    pnl: 0,
    hasStop: Boolean(body.order.stop),
  }
  return NextResponse.json({ fill, brokerStatus: result.status })
}
