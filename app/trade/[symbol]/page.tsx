import { notFound } from "next/navigation"
import { Cockpit } from "@/components/cockpit"

export default async function TradePage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params
  const symbol = rawSymbol.toUpperCase().replace(/[^A-Z.-]/g, "").slice(0, 10)
  if (!symbol) notFound()
  return <Cockpit symbol={symbol} />
}
