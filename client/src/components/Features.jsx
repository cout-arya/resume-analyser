export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-8">

        <div className="text-center mb-20 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-lime-400/20 blur-[80px] -z-10 rounded-full"></div>
          <h2 className="font-headline font-black text-4xl md:text-5xl text-zinc-900 mb-6 tracking-tight">
            The Science of Selection
          </h2>

          <p className="text-zinc-600 max-w-2xl mx-auto text-lg font-medium">
            We don't just find keywords. We understand context, seniorities, and the latent signals of a perfect hire.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Match Score (3D Card style) */}
          <div className="md:col-span-2 bg-zinc-50 rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-10 items-center border-4 border-zinc-900 shadow-[8px_8px_0px_#18181b] hover:-translate-y-1 transition-transform overflow-hidden relative">
            <div className="flex-1 relative z-10">
              <div className="w-16 h-16 bg-lime-400 rounded-2xl flex items-center justify-center text-zinc-900 mb-6 border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b]">
                <span className="material-symbols-outlined text-3xl">analytics</span>
              </div>

              <h3 className="font-headline font-black text-3xl mb-4 text-zinc-900">
                Real-time Match Score
              </h3>

              <p className="text-zinc-600 leading-relaxed mb-8 font-medium">
                Get an instant compatibility percentage based on 50+ semantic data points.
                Our AI weighs skills by relevance and recency.
              </p>

              <div className="flex gap-4">
                <span className="bg-zinc-900 text-white px-4 py-2 rounded-full text-sm font-bold border-2 border-transparent shadow-md">
                  98% Accuracy
                </span>

                <span className="bg-white text-zinc-900 px-4 py-2 rounded-full text-sm font-bold border-2 border-zinc-200">
                  Deep Learning
                </span>
              </div>
            </div>

            {/* Circular Score */}
            <div className="relative w-64 h-64 flex items-center justify-center shrink-0 z-10">
              <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
                <circle
                  className="text-zinc-200"
                  cx="128"
                  cy="128"
                  r="100"
                  stroke="currentColor"
                  strokeWidth="24"
                  fill="transparent"
                />
                <circle
                  className="text-lime-400"
                  cx="128"
                  cy="128"
                  r="100"
                  stroke="currentColor"
                  strokeWidth="24"
                  strokeDasharray="628"
                  strokeDashoffset="120"
                  fill="transparent"
                  strokeLinecap="round"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full w-[160px] h-[160px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-[inset_0px_4px_10px_rgba(0,0,0,0.05)] border-[6px] border-zinc-50">
                <span className="text-5xl font-black font-headline text-zinc-900">
                  82
                </span>
                <span className="text-sm font-black text-zinc-400">
                  MATCH %
                </span>
              </div>
            </div>
          </div>


          {/* Semantic Mapping */}
          <div className="bg-zinc-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-[8px_8px_0px_#a3e635] hover:-translate-y-1 transition-transform group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/10 rounded-full blur-[60px] group-hover:bg-lime-400/20 transition-colors"></div>

            <div className="relative z-10">
              <div className="w-14 h-14 bg-zinc-800 text-lime-400 rounded-2xl flex items-center justify-center mb-6 border border-zinc-700">
                <span className="material-symbols-outlined text-2xl">language</span>
              </div>

              <h3 className="font-headline font-black text-2xl mb-4">
                Semantic Mapping
              </h3>

              <p className="text-zinc-400 font-medium leading-relaxed mb-10">
                It's not just "Java". It's "Spring Boot, MVC, and microservices architecture" detected through context.
              </p>
            </div>

            <div className="space-y-3 relative z-10">
              <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700 flex justify-between items-center backdrop-blur-sm">
                <span className="text-sm font-bold text-zinc-200">Cloud Architecture</span>
                <span className="material-symbols-outlined text-lime-400 text-lg">check_circle</span>
              </div>

              <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700 flex justify-between items-center backdrop-blur-sm">
                <span className="text-sm font-bold text-zinc-200">Strategic Vision</span>
                <span className="material-symbols-outlined text-lime-400 text-lg">check_circle</span>
              </div>
            </div>
          </div>


          {/* Skill Gap Analysis */}
          <div className="md:col-span-3 bg-white rounded-[2.5rem] p-10 border-4 border-zinc-900 shadow-[8px_8px_0px_#18181b] mt-4">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-900 mb-6 border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b]">
                  <span className="material-symbols-outlined text-3xl">trending_up</span>
                </div>

                <h3 className="font-headline font-black text-3xl mb-4 text-zinc-900">
                  Dynamic Skill Gap Analysis
                </h3>

                <p className="text-zinc-600 leading-relaxed mb-8 font-medium">
                  Identify exactly what's missing and generate automated coaching advice for candidates to bridge the gap before the interview.
                </p>

                <button className="flex items-center gap-2 text-zinc-900 font-black hover:gap-4 transition-all uppercase tracking-wider text-sm">
                  Explore Gap Insights
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </button>
              </div>

              <div className="space-y-5">
                {/* 3D Gap Card 1 */}
                <div className="bg-white p-6 rounded-2xl border-4 border-zinc-900 shadow-[4px_4px_0px_#f43f5e] relative hover:-translate-y-1 transition-transform">
                  <div className="absolute top-0 left-0 w-2 h-full bg-rose-500 rounded-l-xl"></div>
                  <div className="flex justify-between items-start mb-3 ml-2">
                    <h4 className="font-black text-zinc-900 text-lg">
                      Critical Gap: AWS Security
                    </h4>
                    <span className="text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded-lg font-bold border border-rose-200">
                      High Risk
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 mb-4 ml-2 font-medium">
                    Candidate lacks direct experience with IAM policies in large scale environments.
                  </p>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden ml-2 shadow-inner">
                    <div className="bg-rose-500 w-1/4 h-full rounded-full"></div>
                  </div>
                </div>

                {/* 3D Gap Card 2 */}
                <div className="bg-white p-6 rounded-2xl border-4 border-zinc-900 shadow-[4px_4px_0px_#eab308] relative hover:-translate-y-1 transition-transform">
                  <div className="absolute top-0 left-0 w-2 h-full bg-yellow-500 rounded-l-xl"></div>
                  <div className="flex justify-between items-start mb-3 ml-2">
                    <h4 className="font-black text-zinc-900 text-lg">
                      Potential Gap: Team Leadership
                    </h4>
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg font-bold border border-yellow-200">
                      Moderate
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 mb-4 ml-2 font-medium">
                    While leading projects, direct line management history is limited.
                  </p>
                  <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden ml-2 shadow-inner">
                    <div className="bg-yellow-500 w-3/4 h-full rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

