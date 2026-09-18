"use client"

import { useState } from "react"
import { Check, KeyRound, LockKeyhole, ShieldAlert } from "lucide-react"
import { useJarvis } from "@/components/jarvis-provider"
import { Button } from "@/components/ui/button"

const ACK = "I understand this can lose real money"

export default function SettingsPage() {
  const { preferences, updatePreferences, config, paperProofCount, flattenAll } = useJarvis()
  const [draft, setDraft] = useState(preferences)
  const [saved, setSaved] = useState("")
  const liveReady = config.brokerModeAllowed && config.alpacaConfigured && draft.liveAcknowledgment === ACK && (!draft.safeUnlock || paperProofCount >= 10)

  const field = "mono mt-1 h-9 w-full border border-[#2a2a2a] bg-[#0d0d0d] px-3 text-xs text-white outline-none focus:border-[#00d4aa]"

  return (
    <div className="mx-auto grid max-w-[1180px] grid-cols-[1fr_360px] p-4">
      <section className="border border-[#2a2a2a] bg-[#141414]">
        <div className="panel-title"><span className="micro !text-[#ccc]">Trading controls</span><span className="micro">Safe defaults</span></div>
        <form className="p-5" onSubmit={(event) => { event.preventDefault(); updatePreferences(draft); setSaved("Settings saved locally."); }}>
          <div className="mb-6">
            <div className="micro mb-3">Experience level</div>
            <div className="grid grid-cols-2 border border-[#2a2a2a]">
              <button type="button" onClick={() => setDraft({ ...draft, beginnerMode: true })} className={`p-4 text-left ${draft.beginnerMode ? "bg-[#0d211d] text-[#00d4aa]" : "text-[#777]"}`}>
                <strong className="block text-xs uppercase">Beginner · Recommended</strong>
                <span className="mt-1 block text-[11px] leading-4">Big decision numbers. Plain English. Details hidden until asked.</span>
              </button>
              <button type="button" onClick={() => setDraft({ ...draft, beginnerMode: false })} className={`border-l border-[#2a2a2a] p-4 text-left ${!draft.beginnerMode ? "bg-[#171717] text-white" : "text-[#777]"}`}>
                <strong className="block text-xs uppercase">Pro</strong>
                <span className="mt-1 block text-[11px] leading-4">More diagnostics and signal internals in the expert hub.</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[#2a2a2a] pt-5">
            <label className="micro">Account equity ($)<input className={field} type="number" min="100" value={draft.equity} onChange={(event) => setDraft({ ...draft, equity: Number(event.target.value) })} /></label>
            <label className="micro">Risk per trade (%)<input className={field} type="number" min="0.1" max={draft.maxRiskPercent} step="0.1" value={draft.riskPercent} onChange={(event) => setDraft({ ...draft, riskPercent: Number(event.target.value) })} /></label>
            <label className="micro">Maximum risk allowed (%)<input className={field} type="number" min="0.1" max="1" step="0.1" value={draft.maxRiskPercent} onChange={(event) => setDraft({ ...draft, maxRiskPercent: Number(event.target.value) })} /></label>
            <label className="micro">Minimum reward vs risk<input className={field} type="number" min="2" max="10" step="0.1" value={draft.minRewardRisk} onChange={(event) => setDraft({ ...draft, minRewardRisk: Number(event.target.value) })} /></label>
            <label className="micro">Daily loss kill switch (%)<input className={field} type="number" min="0.5" max="3" step="0.5" value={draft.dailyLossPercent} onChange={(event) => setDraft({ ...draft, dailyLossPercent: Number(event.target.value) })} /></label>
          </div>

          <div className="mt-6 border-t border-[#2a2a2a] pt-5">
            <div className="micro mb-3">Broker mode</div>
            <div className="grid grid-cols-2 border border-[#2a2a2a]">
              <button type="button" onClick={() => setDraft({ ...draft, brokerMode: "paper" })} className={`p-4 text-left ${draft.brokerMode === "paper" ? "bg-[#0d211d] text-[#00d4aa]" : "text-[#777]"}`}>
                <strong className="block text-xs uppercase">Practice money (Paper)</strong>
                <span className="mt-1 block text-[11px]">Default. No real money can move.</span>
              </button>
              <button type="button" disabled={!liveReady} onClick={() => setDraft({ ...draft, brokerMode: "live" })} className={`border-l border-[#2a2a2a] p-4 text-left disabled:cursor-not-allowed disabled:opacity-40 ${draft.brokerMode === "live" ? "bg-[#241012] text-[#ff6a77]" : "text-[#777]"}`}>
                <strong className="block text-xs uppercase">Real money (Live)</strong>
                <span className="mt-1 block text-[11px]">Only after every safety gate passes.</span>
              </button>
            </div>
            <label className="mt-4 flex items-start gap-3 border border-[#2a2a2a] bg-[#101010] p-3">
              <span className="mt-0.5 flex size-4 items-center justify-center border border-[#00d4aa] bg-[#00d4aa] text-black"><Check className="size-3" /></span>
              <span><strong className="block text-xs text-white">LIVE prices required for LIVE orders</strong><span className="mt-1 block text-[10px] text-[#777]">Always on. The server checks the resolved quote and cannot be bypassed here.</span></span>
            </label>
            <label className="mt-3 flex items-start gap-3 text-xs text-white">
              <input type="checkbox" checked={draft.safeUnlock} onChange={(event) => setDraft({ ...draft, safeUnlock: event.target.checked })} />
              <span>Safe unlock: complete 10 stopped Paper trades first <small className="block text-[#777]">{paperProofCount}/10 completed</small></span>
            </label>
            <label className="micro mt-4 block">Type exactly: {ACK}
              <input className={field} autoComplete="off" value={draft.liveAcknowledgment} onChange={(event) => setDraft({ ...draft, liveAcknowledgment: event.target.value })} />
            </label>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-[#2a2a2a] pt-5">
            <Button type="submit" variant="primary" size="lg">Save safety settings</Button>
            <span className="text-[10px] text-[#00d4aa]">{saved}</span>
          </div>
        </form>
      </section>

      <aside className="border-y border-r border-[#2a2a2a] bg-[#111]">
        <div className="panel-title"><span className="micro !text-[#ccc]">Server connections</span><LockKeyhole className="size-3.5 text-[#00d4aa]" /></div>
        <div className="p-4">
          <p className="text-[11px] leading-5 text-[#999]">Keys are read from server environment variables. Jarvis never saves provider secrets in browser storage.</p>
          {[
            ["Alpaca market + broker", config.alpacaConfigured, "ALPACA_API_KEY + ALPACA_API_SECRET"],
            ["Polygon market data", false, "Disabled until snapshot adapter is verified"],
            ["Finnhub market data", false, "Disabled until snapshot adapter is verified"],
          ].map(([name, configured, detail]) => (
            <div key={String(name)} className="mt-3 border border-[#2a2a2a] p-3">
              <div className="flex items-center justify-between"><strong className="text-[11px] text-white">{name}</strong><span className={`text-[9px] font-bold uppercase ${configured ? "text-[#00d4aa]" : "text-[#777]"}`}>{configured ? "Configured" : "Not active"}</span></div>
              <div className="mono mt-2 text-[9px] text-[#666]">{detail}</div>
            </div>
          ))}
          <div className="mt-5 border border-[#ff4757] p-3">
            <div className="flex items-center gap-2 text-[#ff6a77]"><ShieldAlert className="size-4" /><strong className="text-xs">Emergency kill switch</strong></div>
            <p className="mt-2 text-[10px] leading-4 text-[#888]">Closes local Paper positions. Live flattening requires the broker connection and is never triggered silently.</p>
            <Button type="button" variant="danger" className="mt-3 w-full" onClick={flattenAll}>Flatten Paper positions</Button>
          </div>
          <div className="mt-4 flex gap-2 text-[10px] leading-4 text-[#777]"><KeyRound className="mt-0.5 size-3.5 shrink-0" />Set secrets in `.env.local`; never paste them into chat or commit them.</div>
        </div>
      </aside>
    </div>
  )
}
