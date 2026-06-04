import { TopBar } from "@/components/sainsberry/top-bar"
import { Hero } from "@/components/sainsberry/hero"
import { Steps } from "@/components/sainsberry/steps"
import { Grow } from "@/components/sainsberry/grow"
import { StatBand } from "@/components/sainsberry/stat-band"
import { Cta } from "@/components/sainsberry/cta"

export default function Page() {
  return (
    <main className="min-h-screen bg-background">
      <TopBar />
      <Hero />
      <Steps />
      <Grow />
      <StatBand />
      <Cta />
    </main>
  )
}
