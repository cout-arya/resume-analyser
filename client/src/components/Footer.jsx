export default function Footer() {
  return (
    <footer className="bg-zinc-900 border-t-[8px] border-lime-400 mt-24 text-white relative">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 py-16 max-w-7xl mx-auto">

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-lime-400 text-zinc-900 rounded-xl flex items-center justify-center font-black">
              <span className="material-symbols-outlined text-[20px]">bolt</span>
            </div>
            <div className="text-2xl font-black text-white tracking-tighter font-headline">
              JDFit
            </div>
          </div>

          <p className="font-inter text-sm text-zinc-400 leading-relaxed max-w-[250px]">
            © 2026 JDFit. Intelligent recruitment analysis mapped strictly for the modern age.
          </p>
        </div>

        <div>
          <h4 className="font-black text-white uppercase text-xs tracking-widest mb-6 font-headline">
            Product
          </h4>

          <ul className="space-y-3">
            <li>
              <a className="text-zinc-400 hover:text-lime-400 transition-colors text-sm font-medium cursor-pointer">
                JD Analyzer
              </a>
            </li>
            <li>
              <a className="text-zinc-400 hover:text-lime-400 transition-colors text-sm font-medium cursor-pointer">
                Resume Ranking
              </a>
            </li>
            <li>
              <a className="text-zinc-400 hover:text-lime-400 transition-colors text-sm font-medium cursor-pointer">
                API Platform
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-black text-white uppercase text-xs tracking-widest mb-6 font-headline">
            Resources
          </h4>

          <ul className="space-y-3">
            <li>
              <a className="text-zinc-400 hover:text-lime-400 transition-colors text-sm font-medium cursor-pointer">
                Privacy Policy
              </a>
            </li>
            <li>
              <a className="text-zinc-400 hover:text-lime-400 transition-colors text-sm font-medium cursor-pointer">
                Terms of Service
              </a>
            </li>
            <li>
              <a className="text-zinc-400 hover:text-lime-400 transition-colors text-sm font-medium cursor-pointer">
                Contact Support
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-black text-white uppercase text-xs tracking-widest mb-6 font-headline">
            Socials
          </h4>

          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-lime-400 border border-zinc-700 hover:border-lime-400 flex items-center justify-center text-zinc-300 hover:text-zinc-900 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-xl">share</span>
            </a>
            <a className="w-10 h-10 rounded-xl bg-zinc-800 hover:bg-lime-400 border border-zinc-700 hover:border-lime-400 flex items-center justify-center text-zinc-300 hover:text-zinc-900 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-xl">campaign</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  )
}