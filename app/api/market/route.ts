import { NextResponse } from "next/server"
import { getServerSnapshot } from "@/lib/market/server"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const symbol = url.searchParams.get("symbol") ?? "AAPL"
  const limit = Math.min(300, Math.max(20, Number(url.searchParams.get("limit") ?? 120)))
  try {
    return NextResponse.json(await getServerSnapshot(symbol, limit))
  } catch {
    return NextResponse.json({ error: "Market feed unavailable." }, { status: 503 })
  }
}
