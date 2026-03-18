import Navbar from "../components/Navbar"
import Hero from "../components/Hero"
import Features from "../components/Features"
import Footer from "../components/Footer"

export default function LandingPage({ onStart }) {
  return (
    <div className="bg-surface font-body text-on-surface">
      <Navbar />
      <Hero onStart={onStart} />
      <Features />
      <Footer />
    </div>
  )
}