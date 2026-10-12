import React from "react";
import { Link } from "react-router-dom";
import { Activity, Stethoscope, Brain, ShieldCheck, LineChart, Layers } from "lucide-react";

const feats = [
  { icon: Layers, title: "Patient Digital Twin", body: "A unified multimodal representation of every patient across EHR, labs, vitals, imaging and lifestyle." },
  { icon: Brain, title: "Explainable Risk AI", body: "Rule-based clinical scoring with SHAP-style feature attribution and LIME-style local explanations." },
  { icon: LineChart, title: "Progression Signals", body: "Vitals trends, timeline analytics and risk stratification updated in real time." },
  { icon: ShieldCheck, title: "Role-based & Audited", body: "JWT auth, admin controls, audit logs — designed for clinical trust from day one." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900" data-testid="landing-page">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-stone-50/80 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-emerald-900 grid place-items-center text-white">
              <Activity className="h-4 w-4" />
            </div>
            <div className="font-heading font-black tracking-tight text-lg">HealthTwin<span className="text-emerald-800">.AI</span></div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-stone-600">
            <a href="#features" className="hover:text-stone-900">Framework</a>
            <a href="#arch" className="hover:text-stone-900">Architecture</a>
            <a href="#roles" className="hover:text-stone-900">Roles</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" data-testid="nav-login-btn" className="px-4 py-2 text-sm font-semibold rounded-lg border border-stone-200 hover:bg-stone-100">Sign in</Link>
            <Link to="/register" data-testid="nav-register-btn" className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-900 text-white hover:bg-emerald-800">Create account</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="overline mb-4">Semester 1 · Hybrid Multimodal XAI + Digital Twin</div>
            <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl leading-[1.02] tracking-tight">
              A <span className="text-emerald-900">clinical decision</span> layer,
              <br /> for every patient's <span className="italic font-serif text-stone-700">digital twin</span>.
            </h1>
            <p className="mt-6 text-stone-600 text-base sm:text-lg max-w-2xl leading-relaxed">
              A hybrid framework that fuses EHR, labs, imaging and lifestyle signals into a single
              patient twin — then produces transparent, explainable disease-risk predictions for
              patients, physicians and hospital administrators.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <Link to="/register" data-testid="hero-cta-primary" className="px-5 py-3 rounded-lg bg-emerald-900 text-white text-sm font-semibold hover:bg-emerald-800">Start with a Digital Twin</Link>
              <Link to="/login" data-testid="hero-cta-secondary" className="px-5 py-3 rounded-lg border border-stone-300 text-sm font-semibold hover:bg-stone-100">Clinician sign in</Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-xs text-stone-500 font-mono">
              <span>· SHAP + LIME explainability</span>
              <span>· 5 disease models</span>
              <span>· Audit-ready</span>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-white">
              <img
                alt="Digital twin"
                src="https://images.unsplash.com/photo-1763198302243-51142ba5b24a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHxodW1hbiUyMGJvZHklMjAzRCUyMG1lZGljYWx8ZW58MHx8fHwxNzgzMDY2MTA2fDA&ixlib=rb-4.1.0&q=85"
                className="w-full h-[520px] object-cover"
              />
              <div className="absolute top-4 left-4 backdrop-blur-xl bg-white/80 border border-stone-200 rounded-xl p-3">
                <div className="overline">Aggregate risk</div>
                <div className="font-mono text-2xl font-bold text-emerald-900">32.4%</div>
                <div className="text-xs text-stone-500">Moderate · updated 3s ago</div>
              </div>
              <div className="absolute bottom-4 right-4 backdrop-blur-xl bg-white/80 border border-stone-200 rounded-xl p-3 w-56">
                <div className="overline mb-1">Top contributors</div>
                <div className="text-xs font-mono flex items-center justify-between"><span>HbA1c</span><span className="text-orange-700">+18%</span></div>
                <div className="text-xs font-mono flex items-center justify-between"><span>Systolic BP</span><span className="text-orange-700">+12%</span></div>
                <div className="text-xs font-mono flex items-center justify-between"><span>Activity</span><span className="text-emerald-700">-9%</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <div className="overline mb-2">01 · The framework</div>
            <h2 className="font-heading text-3xl font-bold">Multimodal foundation. Explainable output.</h2>
            <p className="text-stone-600 mt-3">Every module is transparent, auditable and clinically interpretable.</p>
          </div>
          <div className="md:col-span-8 grid sm:grid-cols-2 gap-4">
            {feats.map((f) => (
              <div key={f.title} className="border border-stone-200 rounded-xl p-5 bg-white">
                <f.icon className="h-5 w-5 text-emerald-900" />
                <div className="mt-3 font-heading font-semibold">{f.title}</div>
                <div className="text-sm text-stone-600 mt-1">{f.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="max-w-7xl mx-auto px-6 py-16">
        <div className="overline mb-2">02 · Roles</div>
        <h2 className="font-heading text-3xl font-bold mb-8">Built for three surfaces of care.</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Stethoscope, t: "Doctor", d: "Search patients, review AI predictions, inspect SHAP/LIME explanations, add diagnostic notes." },
            { icon: Activity, t: "Patient", d: "Upload reports and images, view your digital twin, monitor your personal health risk score." },
            { icon: ShieldCheck, t: "Admin", d: "Manage users, monitor AI model performance, review audit logs and system analytics." },
          ].map((r) => (
            <div key={r.t} className="border border-stone-200 rounded-xl p-6 bg-white">
              <r.icon className="h-5 w-5 text-emerald-900" />
              <div className="font-heading font-semibold mt-3 text-lg">{r.t}</div>
              <div className="text-sm text-stone-600 mt-2">{r.d}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-stone-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8 text-xs text-stone-500 flex items-center justify-between">
          <div>© 2026 HealthTwin.AI — Hybrid Multimodal Explainable AI Framework</div>
          <div className="font-mono">v1.0 · Semester 1</div>
        </div>
      </footer>
    </div>
  );
}
