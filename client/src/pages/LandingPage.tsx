import Navbar from '../components/layout/Navbar'
import HeroSection from '../components/sections/HeroSection'

export default function LandingPage() {
  return (
    <div className="h-screen overflow-hidden" style={{ background: '#EFF6FF' }}>
      <Navbar />
      <HeroSection />
    </div>
  )
}
