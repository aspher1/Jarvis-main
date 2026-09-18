import type { Metadata } from "next"
import "./globals.css"
import { AppShell } from "@/components/app-shell"
import { JarvisProvider } from "@/components/jarvis-provider"

export const metadata: Metadata = {
  title: "Jarvis — Trading Decision Overlay",
  description: "A risk-first trading cockpit with chart waypoints, simulated signals, and guarded broker routing.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body>
        <JarvisProvider>
          <AppShell>{children}</AppShell>
        </JarvisProvider>
      </body>
    </html>
  )
}
