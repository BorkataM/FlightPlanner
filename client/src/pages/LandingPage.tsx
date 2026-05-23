import Navbar from '../components/layout/Navbar'
import HeroSection from '../components/sections/HeroSection'
import StatsStrip from '../components/sections/StatsStrip'
import GuaranteeStrip from '../components/sections/GuaranteeStrip'
import PopularDestinations from '../features/destinations/PopularDestinations'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0D1E35' }}>
      <Navbar />
      <HeroSection />
      <StatsStrip />
      <GuaranteeStrip />
      <PopularDestinations />
    </div>
  )
}
