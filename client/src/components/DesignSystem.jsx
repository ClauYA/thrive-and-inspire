import { Link } from "react-router-dom";

/* ── Design System / living style guide ──
   A reference page documenting the real tokens and components used across the
   Lift & Inspire site. Visit at /design. Not linked in the public nav. */

const COLORS = [
  { group: "Primary accent — Amber / Gold", items: [
    { name: "Terracotta", cls: "bg-terracotta", hex: "#b07d1f", token: "terracotta", dark: true },
    { name: "Terracotta Light", cls: "bg-terracotta-light", hex: "#c99a3a", token: "terracotta-light", dark: true },
    { name: "Terracotta Dark", cls: "bg-terracotta-dark", hex: "#916615", token: "terracotta-dark", dark: true },
    { name: "Gold (warm accent)", cls: "bg-gold", hex: "#d9a441", token: "gold", dark: false },
  ]},
  { group: "Greens — Eucalyptus / Pistachio", items: [
    { name: "Forest", cls: "bg-forest", hex: "#3e564a", token: "forest", dark: true },
    { name: "Forest Light", cls: "bg-forest-light", hex: "#5a7567", token: "forest-light", dark: true },
    { name: "Sage", cls: "bg-sage", hex: "#82a392", token: "sage", dark: true },
    { name: "Sage Light (pistachio)", cls: "bg-sage-light", hex: "#c6dbac", token: "sage-light", dark: false },
  ]},
  { group: "Surfaces — Ivory", items: [
    { name: "Cream", cls: "bg-cream", hex: "#f6f1e6", token: "cream", dark: false },
    { name: "Warm White", cls: "bg-warm-white", hex: "#fdfaf3", token: "warm-white", dark: false },
    { name: "Sand", cls: "bg-sand", hex: "#e7dcc9", token: "sand", dark: false },
  ]},
  { group: "Text & neutrals", items: [
    { name: "Charcoal", cls: "bg-charcoal", hex: "#303a33", token: "charcoal", dark: true },
    { name: "Warm Gray", cls: "bg-warm-gray", hex: "#61706a", token: "warm-gray", dark: true },
    { name: "Light Gray", cls: "bg-light-gray", hex: "#bcc6bd", token: "light-gray", dark: false },
  ]},
];

function Section({ title, children }) {
  return (
    <section className="mb-16">
      <h2 className="font-display text-[1.8rem] font-semibold text-charcoal mb-1">{title}</h2>
      <div className="h-px bg-sand mb-6" />
      {children}
    </section>
  );
}

function Swatch({ c }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-sand bg-white">
      <div className={`h-20 ${c.cls} ${c.dark ? "" : "border-b border-sand"}`} />
      <div className="p-3">
        <div className="text-[0.85rem] font-semibold text-charcoal">{c.name}</div>
        <div className="text-[0.74rem] text-warm-gray mt-0.5">{c.hex}</div>
        <div className="text-[0.72rem] text-light-gray mt-1 font-mono">bg-{c.token}</div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-[18px] py-3 border-[1.5px] border-sand rounded-2xl text-[0.9rem] text-charcoal bg-cream outline-none transition-all placeholder:text-light-gray focus:border-terracotta-light focus:bg-white focus:ring-[3px] focus:ring-terracotta/10";

export default function DesignSystem() {
  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      {/* Header */}
      <header className="bg-forest text-white px-[5%] py-12">
        <div className="max-w-[1000px] mx-auto">
          <Link to="/" className="text-[0.8rem] text-sage-light font-semibold hover:text-white transition-colors">← Lift &amp; Inspire</Link>
          <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-semibold mt-3">Design System</h1>
          <p className="text-white/70 mt-2 max-w-[560px]">The colors, type and components that make up the Lift &amp; Inspire brand.</p>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-[5%] py-14">
        {/* Colors */}
        <Section title="Colors">
          {COLORS.map((grp) => (
            <div key={grp.group} className="mb-7">
              <div className="text-[0.75rem] font-semibold tracking-[0.12em] uppercase text-terracotta mb-3">{grp.group}</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {grp.items.map((c) => <Swatch key={c.token} c={c} />)}
              </div>
            </div>
          ))}
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="grid gap-6">
            <div className="bg-white rounded-2xl border border-sand p-6">
              <div className="text-[0.72rem] uppercase tracking-[0.14em] text-warm-gray mb-3">Display — Cormorant Garamond</div>
              <p className="font-display text-[3rem] font-semibold leading-[1.1] text-charcoal">Build habits that <em className="italic text-terracotta">actually stick.</em></p>
              <p className="font-display text-[2rem] font-semibold text-charcoal mt-3">Heading two</p>
              <p className="font-display text-[1.4rem] font-semibold text-charcoal mt-2">Heading three</p>
            </div>
            <div className="bg-white rounded-2xl border border-sand p-6">
              <div className="text-[0.72rem] uppercase tracking-[0.14em] text-warm-gray mb-3">Body — DM Sans</div>
              <div className="inline-block text-[0.75rem] font-semibold tracking-[0.14em] uppercase text-terracotta mb-3">Eyebrow label</div>
              <p className="text-[1.05rem] text-warm-gray leading-[1.75] font-light max-w-[560px]">
                Body copy uses DM Sans in a warm gray for comfortable reading. Emphasis is shown with
                <strong className="text-charcoal font-semibold"> charcoal bold</strong> and links in
                <span className="text-terracotta font-semibold"> terracotta</span>.
              </p>
            </div>
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-4 mb-5">
            <button className="bg-terracotta text-white px-6 py-3 rounded-full text-[0.95rem] font-semibold shadow-[0_8px_24px_rgba(176,125,31,0.3)] hover:bg-terracotta-dark hover:-translate-y-0.5 transition-all">Primary</button>
            <button className="border-2 border-terracotta text-terracotta px-6 py-3 rounded-full text-[0.95rem] font-semibold hover:bg-terracotta hover:text-white transition-all">Outline</button>
            <button className="bg-forest text-white px-6 py-3 rounded-full text-[0.95rem] font-semibold hover:bg-forest-light transition-colors">Forest</button>
            <button className="bg-terracotta text-white text-[0.82rem] font-semibold px-4 py-2 rounded-full hover:bg-terracotta-dark transition-colors">Small</button>
          </div>
          <div className="bg-charcoal rounded-2xl p-6 flex flex-wrap items-center gap-4">
            <button className="bg-white text-charcoal px-6 py-3 rounded-full text-[0.95rem] font-semibold hover:-translate-y-0.5 transition-all">On dark</button>
            <button className="border-2 border-white/25 text-white/80 px-6 py-3 rounded-full text-[0.95rem] font-medium hover:border-white hover:text-white transition-all">Ghost on dark</button>
          </div>
        </Section>

        {/* Cards */}
        <Section title="Cards">
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-white rounded-[28px] border border-sand p-7 shadow-[0_8px_24px_rgba(44,44,42,0.05)]">
              <h3 className="font-display text-[1.4rem] font-semibold text-charcoal mb-1">Standard card</h3>
              <p className="text-[0.9rem] text-warm-gray">Soft border, subtle shadow, generous radius (28px).</p>
            </div>
            <div className="relative bg-white rounded-[28px] border-2 border-terracotta p-7 shadow-[0_20px_50px_rgba(176,125,31,0.18)]">
              <span className="absolute top-0 right-8 -translate-y-1/2 bg-terracotta text-white text-[0.68rem] font-semibold uppercase tracking-[0.1em] px-4 py-1.5 rounded-full">Featured</span>
              <h3 className="font-display text-[1.4rem] font-semibold text-charcoal mb-1">Featured card</h3>
              <p className="text-[0.9rem] text-warm-gray">Amber border + badge for the highlighted option.</p>
            </div>
          </div>
        </Section>

        {/* Chips & badges */}
        <Section title="Chips & badges">
          <div className="flex flex-wrap gap-2.5 mb-5">
            <span className="text-[0.74rem] font-semibold text-terracotta bg-terracotta/10 px-3 py-1.5 rounded-full">Terracotta pill</span>
            <span className="text-[0.74rem] font-semibold text-forest bg-sage-light/50 px-3 py-1.5 rounded-full">Sage pill</span>
            <span className="text-[0.74rem] font-semibold text-charcoal bg-gold/20 px-3 py-1.5 rounded-full">Gold pill</span>
          </div>
          <div className="text-[0.72rem] uppercase tracking-[0.12em] text-warm-gray mb-2">Recommendation tones (tracker)</div>
          <div className="flex flex-wrap gap-2.5">
            <span className="px-3 py-1.5 rounded-full text-[0.78rem] font-medium bg-terracotta/15 text-terracotta-dark">⬆️ Increase</span>
            <span className="px-3 py-1.5 rounded-full text-[0.78rem] font-medium bg-gold/20 text-charcoal">💥 Push</span>
            <span className="px-3 py-1.5 rounded-full text-[0.78rem] font-medium bg-sage/15 text-forest">➡️ Maintain</span>
            <span className="px-3 py-1.5 rounded-full text-[0.78rem] font-medium bg-sage-light/40 text-forest">✨ First time</span>
          </div>
        </Section>

        {/* Forms */}
        <Section title="Form fields">
          <div className="bg-white rounded-2xl border border-sand p-6 grid gap-4 max-w-[460px]">
            <div>
              <label className="block text-[0.82rem] font-semibold text-charcoal mb-2">Text input</label>
              <input type="text" placeholder="Your name" className={inputClass} />
            </div>
            <div>
              <label className="block text-[0.82rem] font-semibold text-charcoal mb-2">Select</label>
              <select className={`${inputClass} cursor-pointer`}>
                <option>Choose an option…</option>
                <option>Option A</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.82rem] font-semibold text-charcoal mb-2">Textarea</label>
              <textarea rows="3" placeholder="Write something…" className={`${inputClass} resize-none`} />
            </div>
          </div>
        </Section>

        {/* Radius & shadow */}
        <Section title="Radius & elevation">
          <div className="flex flex-wrap gap-5">
            {[
              { r: "rounded-xl", label: "xl · 12px" },
              { r: "rounded-2xl", label: "2xl · 16px" },
              { r: "rounded-[28px]", label: "card · 28px" },
              { r: "rounded-full", label: "full · pill" },
            ].map((x) => (
              <div key={x.r} className="text-center">
                <div className={`w-24 h-24 bg-white border border-sand shadow-[0_8px_24px_rgba(44,44,42,0.08)] ${x.r}`} />
                <div className="text-[0.74rem] text-warm-gray mt-2">{x.label}</div>
              </div>
            ))}
          </div>
        </Section>
      </main>
    </div>
  );
}
