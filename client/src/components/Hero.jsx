export default function Hero({ onStart }) {
  return (
    <section className="relative overflow-hidden bg-[#f3f6ec] pt-32 pb-40">

      {/* Subtle modern gradients matching the landing page reference */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-br from-[#effff0] to-[#f4f7ed] -z-10"></div>
      <div className="absolute bottom-0 left-0 w-full h-[500px] bg-gradient-to-t from-[#e4ecc9]/30 to-transparent -z-10"></div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left Text Content */}
          <div className="text-zinc-900 relative z-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-zinc-200 text-zinc-900 font-bold text-xs mb-8 tracking-wider uppercase shadow-[2px_2px_0px_#18181b]">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-lime-400">
                <span className="material-symbols-outlined text-[12px] text-zinc-900">bolt</span>
              </div>
              GetReady AI
            </div>

            <h1 className="font-headline font-extrabold text-5xl md:text-7xl tracking-tighter leading-tight mb-6 text-zinc-900">
              Real Interview Practice <br />
              with Instant AI <br />
              <span className="relative inline-block mt-2">
                <span className="relative z-10">Feedback</span>
                <span className="absolute bottom-0 left-0 w-full h-4 bg-lime-400/50 -rotate-1 z-0"></span>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-600 mb-10 max-w-lg leading-relaxed font-medium">
              JDFit helps you practice real interview questions and receive AI feedback on your resume matching and answers — instantly.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <button
                onClick={onStart}
                className="group flex flex-row items-center gap-3 px-8 py-4 bg-zinc-900 text-white rounded-[2rem] font-bold text-lg hover:bg-zinc-800 hover:-translate-y-1 transition-all shadow-[0px_8px_20px_rgba(0,0,0,0.15)] shadow-[0px_4px_0px_#4d4d4d]"
              >
                PRACTICE
                <span className="material-symbols-outlined bg-white text-zinc-900 rounded-full w-8 h-8 flex items-center justify-center text-sm group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </button>

              <button className="flex items-center gap-3 px-8 py-4 rounded-[2rem] font-bold text-lg text-zinc-900 bg-white hover:bg-zinc-50 transition-all shadow-[0px_8px_20px_rgba(0,0,0,0.05)] shadow-[0px_4px_0px_#e5e7eb] border border-zinc-200">
                VIEW DEMO
              </button>
            </div>

            <div className="mt-16 flex flex-wrap items-center gap-3 text-sm text-zinc-600 font-bold">
              <span className="px-4 py-2 bg-white rounded-full shadow-[2px_2px_0px_#e5e7eb] border border-zinc-100">real mock interviews</span>
              <span className="px-4 py-2 bg-lime-400 text-zinc-900 rounded-full shadow-[2px_2px_0px_#65a30d]">interview analytics</span>
              <span className="px-4 py-2 bg-white rounded-full shadow-[2px_2px_0px_#e5e7eb] border border-zinc-100">instant ai feedback</span>
            </div>
          </div>

          {/* Right UI Mockup / 3D Layout */}
          <div className="relative hidden lg:block h-[600px]">

            {/* Main Center Image */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[480px] bg-zinc-200 rounded-[2.5rem] overflow-hidden shadow-[0px_20px_50px_-10px_rgba(0,0,0,0.3)] z-10 transform rotate-2 hover:rotate-0 transition-transform duration-500 border-[8px] border-white ring-1 ring-zinc-200">
              <img src="/images/interview_illustration.png" alt="Interview" className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&q=80' }} />

              {/* Glass overlay text */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-4/5 bg-white/80 backdrop-blur-md px-4 py-3 rounded-2xl shadow-sm text-center border border-white">
                <span className="font-bold text-zinc-800 text-sm">Tell me about yourself.</span>
              </div>
            </div>

            {/* Floating Card: 50+ Roles (Lime) */}
            <div className="absolute top-10 left-0 bg-lime-400 rounded-2xl p-5 shadow-[4px_8px_0px_#18181b] border-2 border-zinc-900 z-20 transform -rotate-3 animate-float">
              <div className="flex items-center justify-between gap-4 mb-2">
                <span className="text-3xl font-black text-zinc-900">50+</span>
                <span className="material-symbols-outlined text-zinc-900 text-xl">work</span>
              </div>
              <p className="text-xs font-bold text-zinc-800 max-w-[100px] leading-tight">roles and interview scenarios</p>
            </div>

            {/* Floating Card: 100+ Questions (Dark) */}
            <div className="absolute top-40 -left-12 bg-zinc-900 rounded-3xl p-5 shadow-[8px_16px_30px_-5px_rgba(0,0,0,0.2)] border border-zinc-700 z-20 animate-float" style={{ animationDelay: '1s' }}>
              <div className="flex items-center justify-between gap-6 mb-2">
                <span className="text-3xl font-black text-white">100+</span>
                <span className="material-symbols-outlined text-lime-400">mic</span>
              </div>
              <p className="text-xs font-medium text-zinc-400 max-w-[120px] leading-tight">interview questions covered</p>
            </div>

            {/* Floating Card: 95% Confidence (White) */}
            <div className="absolute top-20 -right-8 bg-white rounded-3xl p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.1)] border border-zinc-100 z-0 transform rotate-6 animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-start justify-between gap-8 mb-3">
                <span className="text-4xl font-headline font-black text-zinc-900">95%</span>
                <span className="material-symbols-outlined bg-zinc-100 p-2 rounded-xl text-zinc-900">trending_up</span>
              </div>
              <p className="text-xs font-bold text-zinc-500 max-w-[120px] leading-relaxed">of candidates feel more confident after practicing</p>
            </div>

            {/* Floating Small Video Portrait */}
            <div className="absolute bottom-20 -left-16 w-32 h-40 bg-zinc-800 rounded-2xl overflow-hidden shadow-[4px_4px_0px_#a3e635] border-4 border-zinc-900 z-20 animate-float" style={{ animationDelay: '2s' }}>
              <img src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=300&q=80" alt="Student" className="w-full h-full object-cover opacity-80" />
              <div className="absolute bottom-2 left-0 w-full text-center">
                <span className="text-[9px] bg-black/60 text-white px-2 py-1 rounded-full">What are your weaknesses?</span>
              </div>
            </div>

            {/* Floating Small Video Portrait 2 */}
            <div className="absolute top-1/2 -translate-y-1/2 -right-10 w-24 h-32 bg-white rounded-2xl overflow-hidden shadow-xl border-4 border-white z-20 animate-float" style={{ animationDelay: '1.5s' }}>
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" alt="Interviewer" className="w-full h-full object-cover" />
            </div>

          </div>

        </div>
      </div>

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}} />
    </section>
  )
}
