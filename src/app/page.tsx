import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto glass-panel rounded-full px-8 py-3 flex justify-between items-center">
          <div className="text-xl font-bold tracking-tight">Agent<span className="text-accent">Portal</span></div>
          <div className="hidden md:flex gap-8 items-center text-sm font-medium">
            <Link href="#opportunities" className="hover:text-accent transition-colors">Opportunities</Link>
            <Link href="#knowledge" className="hover:text-accent transition-colors">Resources</Link>
            <Link href="/apply" className="btn-primary">Apply Now</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
        </div>

        <div className="z-10 text-center max-w-4xl mx-auto mt-20">
          <div className="inline-block py-1 px-3 rounded-full border border-accent/30 text-accent text-xs font-semibold tracking-widest uppercase mb-8">
            The Premier Sales Network
          </div>
          <h1 className="text-5xl md:text-7xl heading-serif font-medium leading-tight mb-6">
            Be Your Own Boss.<br />
            Build Your <span className="italic text-accent">Empire.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 font-light">
            Join the elite sales agent network providing multiple income streams, complete flexibility, and limitless career growth.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/apply" className="btn-primary w-full sm:w-auto text-lg px-8 py-4">
              Start Your Journey
            </Link>
            <Link href="#opportunities" className="btn-outline w-full sm:w-auto text-lg px-8 py-4">
              Discover Opportunites
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="opportunities" className="py-24 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl heading-serif mb-4">Why Join Us?</h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">We provide the platform, the products, and the support. You provide the ambition.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl border border-gray-100 hover:border-accent/40 shadow-sm hover:shadow-md transition-all group bg-background">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-6 group-hover:bg-accent/30 transition-colors">
                <div className="w-6 h-6 bg-accent rounded-sm opacity-80"></div>
              </div>
              <h3 className="text-xl font-bold mb-3">Multiple Income Streams</h3>
              <p className="text-muted leading-relaxed">Access diverse product portfolios allowing you to earn commissions across various industries and tiers.</p>
            </div>
            {/* Feature 2 */}
            <div className="p-8 rounded-3xl border border-gray-100 hover:border-accent/40 shadow-sm hover:shadow-md transition-all group bg-background">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <div className="w-6 h-6 bg-primary rounded-full opacity-80"></div>
              </div>
              <h3 className="text-xl font-bold mb-3">Absolute Flexibility</h3>
              <p className="text-muted leading-relaxed">Work remotely on your own schedule. Build a career that wraps around your lifestyle, not the other way around.</p>
            </div>
            {/* Feature 3 */}
            <div className="p-8 rounded-3xl border border-gray-100 hover:border-accent/40 shadow-sm hover:shadow-md transition-all group bg-background">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-6 group-hover:bg-accent/30 transition-colors">
                <div className="w-6 h-6 border-2 border-accent rounded-sm opacity-80"></div>
              </div>
              <h3 className="text-xl font-bold mb-3">Career Advancement</h3>
              <p className="text-muted leading-relaxed">Clear performance-based progression with substantial bonuses, incentives, and leadership opportunities.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
