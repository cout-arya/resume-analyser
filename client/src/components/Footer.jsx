export default function Footer() {
  return (
    <footer className="bg-surface-container-low mt-24">

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8 py-12 max-w-7xl mx-auto">

        <div className="space-y-4">
          <div className="text-xl font-black text-primary font-headline">
            SmartMatch AI
          </div>

          <p className="font-inter text-sm text-on-surface-variant leading-relaxed">
            © 2026 SmartMatch AI. Intelligent recruitment analysis for the modern age.
          </p>
        </div>

        <div>
          <h4 className="font-bold text-on-surface mb-6 font-headline">
            Product
          </h4>

          <ul className="space-y-4">
            <li>
              <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                JD Analyzer
              </a>
            </li>

            <li>
              <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                Resume Ranking
              </a>
            </li>

            <li>
              <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                API Platform
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-on-surface mb-6 font-headline">
            Resources
          </h4>

          <ul className="space-y-4">
            <li>
              <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                Privacy Policy
              </a>
            </li>

            <li>
              <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                Terms of Service
              </a>
            </li>

            <li>
              <a className="text-on-surface-variant hover:text-primary transition-colors text-sm font-medium">
                Contact Support
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-on-surface mb-6 font-headline">
            Follow Us
          </h4>

          <div className="flex gap-4">

            <a className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:text-primary transition-all">
              <span className="material-symbols-outlined text-xl">share</span>
            </a>

            <a className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface hover:text-primary transition-all">
              <span className="material-symbols-outlined text-xl">campaign</span>
            </a>

          </div>

        </div>

      </div>

    </footer>
  )
}