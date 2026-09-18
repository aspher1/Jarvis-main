import Link from "next/link"
import { ArrowRight, Crosshair, Eye, ShieldCheck, Target } from "lucide-react"
import { Button } from "@/components/ui/button"

const STEPS = [
  { icon: Crosshair, title: "1. Pick a stock", text: "Choose a symbol from your watchlist. The chart and last price use the same price stream." },
  { icon: Eye, title: "2. Turn on helpers", text: "ESP Levels shows where to buy. Waypoints show where to take profit and where to get out if wrong." },
  { icon: Target, title: "3. Check the plan", text: "Jarvis gives exact Entry, Stop, Target, and Shares. Open “Why this plan?” only when you want more detail." },
  { icon: ShieldCheck, title: "4. You confirm", text: "Jarvis blocks too much risk, weak reward, Skip plans, and daily-loss breaches before you can place the order." },
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-[1120px] p-4">
      <section className="border border-[#2a2a2a] bg-[#141414]">
        <div className="border-b border-[#2a2a2a] p-6">
          <div className="micro !text-[#00d4aa]">How Jarvis works</div>
          <h1 className="mt-2 text-2xl font-semibold text-white">See the plan. Limit the loss. You make the decision.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#999]">Jarvis helps you take better trades and lose less. It does not know the future and does not guarantee profit.</p>
        </div>
        <div className="grid grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="min-h-52 border-r border-[#2a2a2a] p-5 last:border-r-0">
              <span className="flex size-8 items-center justify-center border border-[#00d4aa] text-[#00d4aa]"><Icon className="size-4" /></span>
              <h2 className="mt-4 text-sm font-semibold text-white">{title}</h2>
              <p className="mt-2 text-xs leading-5 text-[#888]">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-3 grid grid-cols-2 border border-[#2a2a2a] bg-[#111]">
        <div className="border-r border-[#2a2a2a] p-5">
          <div className="micro">Practice money (Paper)</div>
          <h2 className="mt-2 text-lg text-[#00d4aa]">Learn without moving real money.</h2>
          <p className="mt-2 text-xs leading-5 text-[#888]">Paper is always the default. Use it to learn the workflow, test your rules, and complete at least 10 stopped trades before considering Live.</p>
        </div>
        <div className="p-5">
          <div className="micro">Real money (Live)</div>
          <h2 className="mt-2 text-lg text-[#ff6a77]">Every safety lock must pass.</h2>
          <p className="mt-2 text-xs leading-5 text-[#888]">Live needs server credentials, a truly LIVE resolved quote, a typed loss warning, process proof, and server-side risk approval. You remain responsible for the order.</p>
        </div>
      </section>

      <section className="mt-3 flex items-center justify-between border border-[#ffb800] bg-[#19160d] p-5">
        <div>
          <strong className="text-sm text-[#ffd05a]">Not financial advice.</strong>
          <p className="mt-1 text-xs text-[#a89970]">Trading can lose money, including your full account. Past or simulated results do not predict future results.</p>
        </div>
        <Button asChild variant="primary" size="lg"><Link href="/trade/AAPL">Open the practice cockpit <ArrowRight className="size-4" /></Link></Button>
      </section>
    </div>
  )
}
