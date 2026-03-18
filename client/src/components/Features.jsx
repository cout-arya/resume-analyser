export default function Features() {
  return (
    <section className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-8">
        
        <div className="text-center mb-20">
          <h2 className="font-headline font-extrabold text-4xl text-on-surface mb-4 tracking-tight">
            The Science of Selection
          </h2>

          <p className="text-on-surface-variant max-w-2xl mx-auto text-lg">
            We don't just find keywords. We understand context, seniorities, and the latent signals of a perfect hire.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Match Score */}
          <div className="md:col-span-2 bg-surface-container-low rounded-3xl p-10 flex flex-col md:flex-row gap-10 items-center overflow-hidden">
            
            <div className="flex-1">

              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-on-primary mb-6">
                <span className="material-symbols-outlined">analytics</span>
              </div>

              <h3 className="font-headline font-bold text-2xl mb-4">
                Real-time Match Score
              </h3>

              <p className="text-on-surface-variant leading-relaxed mb-6">
                Get an instant compatibility percentage based on 50+ semantic data points. 
                Our AI weighs skills by relevance and recency.
              </p>

              <div className="flex gap-4">
                <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold font-label">
                  98% Accuracy
                </span>

                <span className="bg-primary-fixed text-on-primary-fixed px-3 py-1 rounded-full text-xs font-bold font-label">
                  Deep Learning
                </span>
              </div>
            </div>

            {/* Circular Score */}
            <div className="relative w-64 h-64 flex items-center justify-center">

              <svg className="w-full h-full transform -rotate-90">

                <circle
                  className="text-surface-container-highest"
                  cx="128"
                  cy="128"
                  r="100"
                  stroke="currentColor"
                  strokeWidth="20"
                  fill="transparent"
                />

                <circle
                  className="text-primary"
                  cx="128"
                  cy="128"
                  r="100"
                  stroke="currentColor"
                  strokeWidth="20"
                  strokeDasharray="628"
                  strokeDashoffset="120"
                  fill="transparent"
                />

              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black font-headline text-primary">
                  82
                </span>

                <span className="text-sm font-bold text-on-surface-variant">
                  MATCH %
                </span>
              </div>

            </div>

          </div>


          {/* Semantic Mapping */}
          <div className="bg-tertiary-container rounded-3xl p-10 text-on-tertiary-container relative overflow-hidden">

            <div className="relative z-10">

              <div className="w-12 h-12 bg-tertiary-fixed text-on-tertiary-fixed rounded-xl flex items-center justify-center mb-6">
                <span className="material-symbols-outlined">language</span>
              </div>

              <h3 className="font-headline font-bold text-2xl mb-4">
                Semantic Mapping
              </h3>

              <p className="text-on-tertiary-container/80 leading-relaxed">
                It's not just "Java". It's "Spring Boot, MVC, and microservices architecture" detected through context.
              </p>

            </div>

            <div className="mt-8 space-y-2 relative z-10">

              <div className="bg-surface-container-lowest/20 p-3 rounded-xl border border-white/10 flex justify-between items-center">
                <span className="text-sm font-medium">
                  Cloud Architecture
                </span>

                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>

              <div className="bg-surface-container-lowest/20 p-3 rounded-xl border border-white/10 flex justify-between items-center">
                <span className="text-sm font-medium">
                  Strategic Vision
                </span>

                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
              </div>

            </div>

            <div className="absolute -bottom-10 -right-10 opacity-20 transform rotate-12">
              <span className="material-symbols-outlined text-[150px]">
                hub
              </span>
            </div>

          </div>


          {/* Skill Gap Analysis */}
          <div className="md:col-span-3 bg-surface-container-low rounded-3xl p-10">

            <div className="grid md:grid-cols-2 gap-16 items-center">

              <div>

                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-on-secondary mb-6">
                  <span className="material-symbols-outlined">
                    trending_up
                  </span>
                </div>

                <h3 className="font-headline font-bold text-2xl mb-4">
                  Dynamic Skill Gap Analysis
                </h3>

                <p className="text-on-surface-variant leading-relaxed mb-8">
                  Identify exactly what's missing and generate automated coaching advice for candidates to bridge the gap before the interview.
                </p>

                <button className="flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all">
                  Explore Gap Insights
                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>
                </button>

              </div>


              <div className="space-y-4">

                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border-l-4 border-error">

                  <div className="flex justify-between items-start mb-2">

                    <h4 className="font-bold text-on-surface">
                      Critical Gap: AWS Security
                    </h4>

                    <span className="text-xs bg-error-container text-on-error-container px-2 py-0.5 rounded font-bold">
                      High Risk
                    </span>

                  </div>

                  <p className="text-sm text-on-surface-variant mb-3">
                    Candidate lacks direct experience with IAM policies in large scale environments.
                  </p>

                  <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                    <div className="bg-error w-1/4 h-full"></div>
                  </div>

                </div>


                <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border-l-4 border-tertiary">

                  <div className="flex justify-between items-start mb-2">

                    <h4 className="font-bold text-on-surface">
                      Potential Gap: Team Leadership
                    </h4>

                    <span className="text-xs bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded font-bold">
                      Moderate
                    </span>

                  </div>

                  <p className="text-sm text-on-surface-variant mb-3">
                    While leading projects, direct line management history is limited.
                  </p>

                  <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                    <div className="bg-tertiary w-3/4 h-full"></div>
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

