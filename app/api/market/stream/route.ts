import { getServerSnapshot, selectedProvider } from "@/lib/market/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const encoder = new TextEncoder()
const encode = (value: unknown) => encoder.encode(`data: ${JSON.stringify(value)}\n\n`)

export async function GET(request: Request) {
  const symbol = (new URL(request.url).searchParams.get("symbol") ?? "AAPL")
    .toUpperCase()
    .replace(/[^A-Z.-]/g, "")
    .slice(0, 10)
  const provider = selectedProvider()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      let socket: WebSocket | undefined
      const close = () => {
        if (closed) return
        closed = true
        socket?.close()
        controller.close()
      }
      request.signal.addEventListener("abort", close)

      const sendSnapshot = async () => {
        if (closed) return
        const { quote } = await getServerSnapshot(symbol)
        controller.enqueue(encode(quote))
      }

      await sendSnapshot()

      if (provider.name === "Alpaca IEX") {
        socket = new WebSocket("wss://stream.data.alpaca.markets/v2/iex")
        socket.addEventListener("open", () => {
          socket?.send(JSON.stringify({
            action: "auth",
            key: process.env.ALPACA_API_KEY,
            secret: process.env.ALPACA_API_SECRET,
          }))
        })
        socket.addEventListener("message", (event) => {
          const messages = JSON.parse(String(event.data)) as Array<Record<string, number | string>>
          if (messages.some((message) => message.T === "success" && message.msg === "authenticated")) {
            socket?.send(JSON.stringify({ action: "subscribe", trades: [symbol], quotes: [symbol] }))
          }
          for (const message of messages) {
            if (message.T !== "t") continue
            const timestamp = Date.parse(String(message.t))
            const price = Number(message.p)
            controller.enqueue(encode({
              symbol,
              price,
              bid: price,
              ask: price,
              change: 0,
              changePercent: 0,
              timestamp,
              feed: "live",
              provider: "Alpaca IEX",
              lagMs: Math.max(0, Date.now() - timestamp),
            }))
          }
        })
        socket.addEventListener("error", () => void sendSnapshot())
        return
      }

      if (provider.name === "Polygon") {
        socket = new WebSocket("wss://socket.polygon.io/stocks")
        socket.addEventListener("open", () => socket?.send(JSON.stringify({ action: "auth", params: process.env.POLYGON_API_KEY })))
        socket.addEventListener("message", (event) => {
          const messages = JSON.parse(String(event.data)) as Array<Record<string, number | string>>
          if (messages.some((message) => message.status === "auth_success")) {
            socket?.send(JSON.stringify({ action: "subscribe", params: `T.${symbol},Q.${symbol}` }))
          }
          for (const message of messages) {
            if (message.ev !== "T") continue
            const timestamp = Number(message.t)
            const price = Number(message.p)
            controller.enqueue(encode({
              symbol,
              price,
              bid: price,
              ask: price,
              change: 0,
              changePercent: 0,
              timestamp,
              feed: "live",
              provider: "Polygon",
              lagMs: Math.max(0, Date.now() - timestamp),
            }))
          }
        })
        socket.addEventListener("error", () => void sendSnapshot())
        return
      }

      const interval = setInterval(() => void sendSnapshot(), provider.kind === "mock" ? 750 : 5000)
      request.signal.addEventListener("abort", () => clearInterval(interval))
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
