import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="bg-[#f3f6ec] sticky w-full top-0 z-50 border-b-2 border-zinc-200/50 backdrop-blur-md bg-opacity-80">
      <div className="flex justify-between items-center w-full px-6 md:px-8 py-4 max-w-7xl mx-auto">

        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-lime-400 text-zinc-900 rounded-xl border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] flex items-center justify-center font-black group-hover:-translate-y-1 transition-transform">
            <span className="material-symbols-outlined text-[20px]">bolt</span>
          </div>
          <div className="text-2xl font-black text-zinc-900 tracking-tighter font-headline ml-1">
            JDFit
          </div>
        </Link>

        <div className="hidden md:flex gap-10 items-center">
          <a href="#features" className="text-zinc-900 font-black border-b-4 border-lime-400 pb-1 font-headline tracking-tight uppercase text-sm">
            Platform
          </a>

          <a href="#features" className="text-zinc-500 hover:text-zinc-900 font-bold transition-colors font-headline tracking-tight uppercase text-sm">
            Features
          </a>

          <a className="text-zinc-500 hover:text-zinc-900 font-bold transition-colors font-headline tracking-tight uppercase text-sm cursor-pointer">
            Solutions
          </a>

          <a className="text-zinc-500 hover:text-zinc-900 font-bold transition-colors font-headline tracking-tight uppercase text-sm cursor-pointer">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <Link
              to="/dashboard"
              className="bg-lime-400 hover:bg-lime-300 text-zinc-900 border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] px-6 py-2.5 rounded-[2rem] font-black transition-all hover:-translate-y-1"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-zinc-900 hover:bg-zinc-100 border-2 border-transparent hover:border-zinc-200 transition-colors font-bold px-6 py-2.5 rounded-[2rem] uppercase text-sm"
              >
                Sign In
              </Link>

              <Link
                to="/signup"
                className="bg-zinc-900 hover:bg-zinc-800 text-white shadow-[4px_4px_0px_#a3e635] border-2 border-zinc-900 px-6 py-2.5 rounded-[2rem] font-bold transition-all hover:-translate-y-1 uppercase text-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

      </div>
    </nav>
  )
}