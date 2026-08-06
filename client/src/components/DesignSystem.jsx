import { Link } from "react-router-dom";
import { Button, Card, Badge, Input, Textarea, Select, Field, SectionHeading } from "./ui";

/* ── Design System — the shared building blocks (light, on-brand) ──
   Documents the reusable <Button>, <Card>, <Badge>, form fields and
   <SectionHeading> used consistently across the whole site. Visit /design. */

const COLORS = [
  ["Terracotta (primary)", "bg-terracotta", "#b07d1f"],
  ["Terracotta Dark", "bg-terracotta-dark", "#916615"],
  ["Gold (accent)", "bg-gold", "#d9a441"],
  ["Forest", "bg-forest", "#3e564a"],
  ["Sage", "bg-sage", "#82a392"],
  ["Sage Light", "bg-sage-light", "#c6dbac"],
  ["Cream (bg)", "bg-cream", "#f6f1e6"],
  ["Sand (border)", "bg-sand", "#e7dcc9"],
  ["Charcoal (text)", "bg-charcoal", "#303a33"],
  ["Warm Gray", "bg-warm-gray", "#61706a"],
];

function Block({ title, children }) {
  return (
    <section className="mb-14">
      <h2 className="font-display text-[1.7rem] font-semibold text-charcoal mb-1">{title}</h2>
      <div className="h-px bg-sand mb-6" />
      {children}
    </section>
  );
}

export default function DesignSystem() {
  return (
    <div className="min-h-screen bg-cream relative z-[1]">
      <header className="bg-forest text-white px-[5%] py-12">
        <div className="max-w-[1000px] mx-auto">
          <Link to="/" className="text-[0.8rem] text-sage-light font-semibold hover:text-white transition-colors">← Lift &amp; Inspire</Link>
          <h1 className="font-display text-[clamp(2rem,5vw,3rem)] font-semibold mt-3">Design System</h1>
          <p className="text-white/70 mt-2 max-w-[560px]">Reusable building blocks — buttons, cards, fields and layout — used consistently across the whole site.</p>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-[5%] py-14">
        {/* Colors */}
        <Block title="Colors">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {COLORS.map(([name, cls, hex]) => (
              <Card key={name} className="overflow-hidden">
                <div className={`h-16 ${cls}`} />
                <div className="p-3">
                  <div className="text-[0.82rem] font-semibold text-charcoal">{name}</div>
                  <div className="text-[0.72rem] text-warm-gray font-mono mt-0.5">{hex}</div>
                </div>
              </Card>
            ))}
          </div>
        </Block>

        {/* Buttons */}
        <Block title="Button">
          <div className="flex flex-wrap items-center gap-4 mb-5">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="forest">Forest</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
          <p className="text-[0.8rem] text-warm-gray mt-4 font-mono">&lt;Button variant="primary" size="md"&gt;…&lt;/Button&gt;</p>
        </Block>

        {/* Cards */}
        <Block title="Card">
          <div className="grid sm:grid-cols-2 gap-5">
            <Card className="p-7">
              <h3 className="font-display text-[1.4rem] font-semibold text-charcoal mb-1">Standard card</h3>
              <p className="text-[0.9rem] text-warm-gray">Soft border, subtle shadow, 16px radius.</p>
            </Card>
            <Card featured className="p-7 relative">
              <Badge className="absolute top-0 right-8 -translate-y-1/2 uppercase tracking-[0.1em] !text-white !bg-terracotta">Featured</Badge>
              <h3 className="font-display text-[1.4rem] font-semibold text-charcoal mb-1">Featured card</h3>
              <p className="text-[0.9rem] text-warm-gray">Amber border for the highlighted option.</p>
            </Card>
          </div>
        </Block>

        {/* List row pattern (Hevy-style) */}
        <Block title="List row">
          <div className="grid gap-3 max-w-[640px]">
            {[
              ["Quads & hams", "Bulgarian Split Squat, Romanian Deadlift, Leg Press, Leg Curl…"],
              ["Upper body", "Bench Press, Overhead Press, Lat Pulldown, Bicep Curl…"],
            ].map(([name, items]) => (
              <Card key={name} className="p-5 hover:border-sage-light cursor-pointer">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-charcoal">{name}</h3>
                  <span className="text-warm-gray">⋯</span>
                </div>
                <p className="text-[0.85rem] text-warm-gray mt-1.5 leading-[1.5]">{items}</p>
              </Card>
            ))}
          </div>
        </Block>

        {/* Badges */}
        <Block title="Badge">
          <div className="flex flex-wrap gap-2.5">
            <Badge tone="amber">Amber</Badge>
            <Badge tone="sage">Sage</Badge>
            <Badge tone="gold">Gold</Badge>
            <Badge tone="neutral">Neutral</Badge>
          </div>
        </Block>

        {/* Form */}
        <Block title="Form fields">
          <Card className="p-6 grid gap-4 max-w-[440px]">
            <Field label="Text input"><Input placeholder="Your name" /></Field>
            <Field label="Select"><Select><option>Choose…</option><option>Option A</option></Select></Field>
            <Field label="Textarea"><Textarea rows="3" placeholder="Write something…" /></Field>
          </Card>
        </Block>

        {/* Section heading */}
        <Block title="Section heading">
          <Card className="p-7">
            <SectionHeading eyebrow="Programs & Pricing" title="Two simple ways to" em="finally stay consistent." sub="Used at the top of every major section for a consistent rhythm." />
          </Card>
        </Block>
      </main>
    </div>
  );
}
