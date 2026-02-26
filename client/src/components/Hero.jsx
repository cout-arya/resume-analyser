export default function Hero({ onStart }) {
  return (
    <section className="bg-gradient-to-br from-[#004692] to-[#275fae] relative overflow-hidden pt-24 pb-32">
      <div className="max-w-7xl mx-auto px-8 relative z-10">

        <div className="grid lg:grid-cols-2 gap-16 items-center">

          <div className="text-on-primary">

            <span className="inline-block px-4 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label text-xs font-bold mb-6 tracking-wider uppercase">
              AI-Powered Recruitment
            </span>

            <h1 className="font-headline font-extrabold text-5xl md:text-7xl tracking-tighter leading-tight mb-8">
              Perfect Alignment,
              <span className="text-tertiary-fixed-dim"> Powered by AI.</span>
            </h1>

            <p className="text-lg md:text-xl text-on-primary-container mb-10 max-w-lg leading-relaxed">
              Eliminate the guesswork. Our neural analysis engine maps your professional DNA to market-leading job descriptions in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">

              <button
                onClick={onStart}
                className="bg-surface text-primary px-8 py-4 rounded-xl font-bold text-lg hover:bg-surface-container-lowest transition-all shadow-xl"
              >
                Analyze My Resume
              </button>

              <button className="border border-white/20 bg-white/10 backdrop-blur-md px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all">
                Watch Demo
              </button>

            </div>

          </div>

        </div>

      </div>

    </section>
  )
}