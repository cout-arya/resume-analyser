export default function Hero({ onStart }) {
  return (
    <section className="relative overflow-hidden bg-[#0A0F1C] pt-32 pb-40">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Text Content */}
          <div className="text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary font-bold text-xs mb-8 tracking-wider uppercase backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              The Next Generation of Hiring
            </div>

            <h1 className="font-headline font-extrabold text-5xl md:text-7xl tracking-tighter leading-tight mb-6">
              Recruitment, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Perfectly Aligned.</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-lg leading-relaxed">
              JDFit uses advanced RAG architecture and Deep Learning to instantly map your professional DNA against market-leading job descriptions with 98% accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <button
                onClick={onStart}
                className="group relative px-8 py-4 bg-primary text-on-primary rounded-xl font-bold text-lg hover:bg-primary/90 transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span className="relative flex items-center gap-2">
                  Analyze Resume
                  <span className="material-symbols-outlined text-base transition-transform group-hover:translate-x-1">arrow_forward</span>
                </span>
              </button>

              <button className="flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-all backdrop-blur-md">
                <span className="material-symbols-outlined text-xl">play_circle</span>
                See How It Works
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-4 text-sm text-gray-500 font-medium">
              <div className="flex -space-x-3">
                <img src="https://i.pravatar.cc/100?img=1" alt="User" className="w-10 h-10 rounded-full border-2 border-[#0A0F1C]" />
                <img src="https://i.pravatar.cc/100?img=2" alt="User" className="w-10 h-10 rounded-full border-2 border-[#0A0F1C]" />
                <img src="https://i.pravatar.cc/100?img=3" alt="User" className="w-10 h-10 rounded-full border-2 border-[#0A0F1C]" />
              </div>
              <p>Trusted by 10,000+ top candidates and recruiters globally.</p>
            </div>
          </div>

          {/* Right UI Mockup */}
          <div className="relative hidden lg:block">
            {/* Main Glass Panel */}
            <div className="relative bg-surface-container-low/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-error"></div>
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                </div>
                <div className="text-xs font-mono text-gray-400">JDFit Analysis Engine</div>
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">description</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">Senior Software Engineer</h3>
                      <p className="text-gray-400 text-sm">Resume vs Job Description Match</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-success">92%</div>
                    <div className="text-xs font-bold text-success uppercase tracking-wider">Excellent Fit</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Semantic Alignment</span>
                      <span className="text-white font-bold">28/30</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div className="bg-gradient-to-r from-primary to-secondary w-[93%] h-full rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">Keyword Coverage</span>
                      <span className="text-white font-bold">22/25</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2">
                      <div className="bg-primary w-[88%] h-full rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-10 -left-10 bg-surface-container-highest border border-white/10 rounded-2xl p-5 shadow-2xl transform -rotate-3 animate-float backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-success">check_circle</span>
                <span className="font-bold text-white text-sm">Skill Gap Identified</span>
              </div>
              <p className="text-xs text-gray-400 max-w-[200px]">Candidate shows strong React experience, but lacks recent AWS Lambda exposure. View suggested prep.</p>
            </div>
          </div>

        </div>
      </div>
      
      {/* Tailwind Animation for Shimmer and Float */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-3deg); }
          50% { transform: translateY(-10px) rotate(-3deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}} />
    </section>
  )
}