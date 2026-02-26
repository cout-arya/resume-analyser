import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <nav className="bg-surface sticky w-full top-0 z-50">
      <div className="flex justify-between items-center w-full px-8 py-4 max-w-7xl mx-auto">

        <div className="text-2xl font-black text-primary tracking-tighter font-headline">
          SmartMatch AI
        </div>

        <div className="hidden md:flex gap-8 items-center">
          <a href="#features" className="text-primary font-bold border-b-2 border-primary pb-1 font-headline tracking-tight">
            Platform
          </a>

          <a href="#features" className="text-on-surface-variant hover:text-primary transition-colors font-headline tracking-tight">
            Features
          </a>

          <a className="text-on-surface-variant hover:text-primary transition-colors font-headline tracking-tight">
            Solutions
          </a>

          <a className="text-on-surface-variant hover:text-primary transition-colors font-headline tracking-tight">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Link 
            to="/login"
            className="text-on-surface-variant hover:text-primary transition-colors font-bold px-4 py-2"
          >
            Sign In
          </Link>

          <Link 
            to="/signup"
            className="bg-primary hover:bg-primary-container text-on-primary px-6 py-2 rounded-xl font-bold transition-all transform hover:scale-95 active:scale-100"
          >
            Get Started Free
          </Link>
        </div>

      </div>
    </nav>
  )
}