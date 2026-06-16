import { Link } from "react-router-dom";

/* ── Design System — Hevy-inspired dark UI ──
   A living style guide showing the dark, card-based components for the
   workout-tracker area. Visit at /design. Not linked in the public nav. */

// Sample routines (mirrors the Hevy "Routines" screen layout).
const ROUTINES = [
  { name: "Quads and hams", items: "Bulgarian Split Squat, Deadlift (Smith Machine), Hip Abduction (Machine), Seated Leg…" },
  { name: "Shoulders · Back · Biceps", items: "Chin Up, Lat Pulldown (Cable), Single Arm Lateral Raise (Cable), Front Raise (Dumbbell…" },
  { name: "Leg day", items: "Squat (Barbell), Split Squat (Dumbbell), Back Extension (Weighted Hyperextension)…" },
  { name: "Upper body", items: "Iso-Lateral Row (Machine), Seated Lateral Raise (Dumbbell), Shoulder Press (Dumbbell…" },
];

const SURFACES = [
  { name: "Background", hex: "#0c0d0f", cls: "bg-[#0c0d0f]" },
  { name: "Card", hex: "#18191c", cls: "bg-[#18191c]" },
  { name: "Card hover", hex: "#212327", cls: "bg-[#212327]" },
  { name: "Border", hex: "#2a2c31", cls: "bg-[#2a2c31]" },
];
const ACCENTS = [
  { name: "Accent (Amber)", hex: "#d9a441", cls: "bg-gold" },
  { name: "Accent dark", hex: "#b07d1f", cls: "bg-terracotta" },
  { name: "Text", hex: "#f2f3f5", cls: "bg-[#f2f3f5]" },
  { name: "Muted text", hex: "#9aa0a6", cls: "bg-[#9aa0a6]" },
];

function Section({ title, children }) {
  return (
    <section className="mb-14">
      <h2 className="text-[1.4rem] font-bold text-white mb-1">{title}</h2>
      <div className="h-px bg-[#2a2c31] mb-6" />
      {children}
    </section>
  );
}

function Swatch({ c }) {
  return (
    <div className="rounded-xl overflow-hidden border border-[#2a2c31] bg-[#18191c]">
      <div className={`h-16 ${c.cls}`} />
      <div className="p-2.5">
        <div className="text-[0.82rem] font-semibold text-white">{c.name}</div>
        <div className="text-[0.72rem] text-[#9aa0a6] mt-0.5 font-mono">{c.hex}</div>
      </div>
    </div>
  );
}

export default function DesignSystem() {
  return (
    <div className="min-h-screen bg-[#0c0d0f] text-[#f2f3f5] relative z-[1]">
      <header className="px-[5%] py-8 border-b border-[#2a2c31]">
        <div className="max-w-[1040px] mx-auto">
          <Link to="/" className="text-[0.8rem] text-[#9aa0a6] font-semibold hover:text-white transition-colors">← Lift &amp; Inspire</Link>
          <h1 className="text-[clamp(1.8rem,4vw,2.6rem)] font-bold mt-3">Design System</h1>
          <p className="text-[#9aa0a6] mt-2 max-w-[560px]">Dark, card-based UI for the workout tracker — inspired by Hevy.</p>
        </div>
      </header>

      <main className="max-w-[1040px] mx-auto px-[5%] py-12">
        {/* Routines layout (the Hevy screen) */}
        <Section title="Routines screen">
          <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
            <div>
              <button className="flex items-center gap-2 text-[#9aa0a6] text-[0.85rem] font-medium mb-3">
                <span>▾</span> My Routines (4)
              </button>
              <div className="grid gap-3">
                {ROUTINES.map((r) => (
                  <div key={r.name} className="bg-[#18191c] hover:bg-[#212327] border border-[#2a2c31] rounded-2xl p-5 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[1.05rem] font-bold text-white">{r.name}</h3>
                      <button className="text-[#9aa0a6] hover:text-white text-lg leading-none">⋯</button>
                    </div>
                    <p className="text-[0.85rem] text-[#9aa0a6] mt-1.5 leading-[1.5]">{r.items}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Side panel */}
            <div className="bg-[#18191c] border border-[#2a2c31] rounded-2xl p-3">
              {[
                { icon: "📋", label: "New Routine" },
                { icon: "📁", label: "New Folder" },
              ].map((a, i) => (
                <button key={a.label} className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#212327] transition-colors text-left ${i ? "mt-1" : ""}`}>
                  <span className="w-9 h-9 rounded-lg bg-[#0c0d0f] border border-[#2a2c31] flex items-center justify-center">{a.icon}</span>
                  <span className="flex-1 font-semibold text-white text-[0.92rem]">{a.label}</span>
                  <span className="text-[#9aa0a6]">›</span>
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Colors */}
        <Section title="Surfaces & accents">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {SURFACES.map((c) => <Swatch key={c.name} c={c} />)}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ACCENTS.map((c) => <Swatch key={c.name} c={c} />)}
          </div>
        </Section>

        {/* Buttons */}
        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-4">
            <button className="bg-gold text-[#0c0d0f] px-6 py-3 rounded-xl text-[0.92rem] font-bold hover:brightness-110 transition-all">Primary</button>
            <button className="bg-[#212327] text-white px-6 py-3 rounded-xl text-[0.92rem] font-semibold border border-[#2a2c31] hover:bg-[#2a2c31] transition-colors">Secondary</button>
            <button className="border border-[#3a3d43] text-[#9aa0a6] px-6 py-3 rounded-xl text-[0.92rem] font-semibold hover:text-white hover:border-white transition-colors">Ghost</button>
            <button className="bg-gold text-[#0c0d0f] text-[0.82rem] font-bold px-4 py-2 rounded-lg">Small</button>
          </div>
        </Section>

        {/* Inputs */}
        <Section title="Form fields">
          <div className="grid gap-4 max-w-[440px]">
            <input type="text" placeholder="Routine name" className="w-full px-4 py-3 rounded-xl bg-[#18191c] border border-[#2a2c31] text-white placeholder:text-[#6b7178] outline-none focus:border-gold transition-colors" />
            <select className="w-full px-4 py-3 rounded-xl bg-[#18191c] border border-[#2a2c31] text-white outline-none focus:border-gold transition-colors cursor-pointer">
              <option>Choose an exercise…</option>
            </select>
          </div>
        </Section>

        {/* Chips & stat */}
        <Section title="Chips & stats">
          <div className="flex flex-wrap gap-2.5 mb-5">
            <span className="text-[0.76rem] font-semibold text-gold bg-gold/15 px-3 py-1.5 rounded-full">🔥 28-Day Streak</span>
            <span className="text-[0.76rem] font-semibold text-[#9aa0a6] bg-[#212327] px-3 py-1.5 rounded-full">RIR 2</span>
            <span className="text-[0.76rem] font-semibold text-emerald-300 bg-emerald-500/15 px-3 py-1.5 rounded-full">↑ Strength</span>
          </div>
          <div className="inline-flex gap-6 bg-[#18191c] border border-[#2a2c31] rounded-2xl px-6 py-4">
            {[["12", "Workouts"], ["3", "Routines"], ["28", "Day streak"]].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-[1.8rem] font-bold text-white leading-none">{n}</div>
                <div className="text-[0.74rem] text-[#9aa0a6] mt-1">{l}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="bg-[#18191c] border border-[#2a2c31] rounded-2xl p-6">
            <p className="text-[2rem] font-bold text-white">Routines</p>
            <p className="text-[1.1rem] font-semibold text-white mt-3">Section heading</p>
            <p className="text-[0.92rem] text-[#9aa0a6] mt-2 max-w-[560px]">Body / secondary text uses a muted gray on dark surfaces for comfortable reading and clear hierarchy.</p>
          </div>
        </Section>
      </main>
    </div>
  );
}
