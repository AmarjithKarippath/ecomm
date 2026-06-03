import { TopBar } from "@/components/lucky-rabbit/top-bar"
import { Hero } from "@/components/lucky-rabbit/hero"
import { Steps } from "@/components/lucky-rabbit/steps"
import { Grow } from "@/components/lucky-rabbit/grow"
import { StatBand } from "@/components/lucky-rabbit/stat-band"
import { Cta } from "@/components/lucky-rabbit/cta"

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
