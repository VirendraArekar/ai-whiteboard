import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  Layers,
  Users,
  BarChart3,
  PenTool,
  CheckCircle2,
  Shield,
  Download,
  Bot,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Navbar } from '../components/layout/Navbar';
import { useAuthStore } from '../store/authStore';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B0F19] text-gray-900 dark:text-white flex flex-col font-sans transition-colors">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F5E9] dark:bg-emerald-950/60 border border-[#52B788]/30 dark:border-emerald-800 text-[#1B4332] dark:text-emerald-300 text-xs font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" />
            <span>Powered by Google Gemini AI & Real-Time Socket.IO</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white font-heading max-w-4xl mx-auto leading-[1.1]">
            Brainstorm, Diagram & Collaborate on an{' '}
            <span className="text-[#2D6A4F] dark:text-emerald-400 underline decoration-[#52B788]/50 decoration-wavy">
              AI-Powered
            </span>{' '}
            Canvas
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-normal">
            An infinite workspace where teams sketch architectures, generate editable charts, and
            transform ideas into production-ready diagrams with Google Gemini AI.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={isAuthenticated ? '/dashboard' : '/register'}>
              <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-[#2D6A4F]/25 text-base cursor-pointer">
                {isAuthenticated ? 'Open Dashboard' : 'Start Creating for Free'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-base cursor-pointer">
                Sign In to Canvas
              </Button>
            </Link>
          </div>

          {/* Interactive Hero Visual Showcase */}
          <div className="mt-14 relative max-w-5xl mx-auto rounded-3xl p-3 bg-gradient-to-b from-[#2D6A4F]/15 via-gray-200/40 dark:via-gray-800/40 to-transparent shadow-2xl border border-gray-200/80 dark:border-gray-800">
            <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-inner border border-gray-200 dark:border-gray-800 aspect-[16/9] flex flex-col relative select-none">
              {/* Canvas mock topbar */}
              <div className="h-10 bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 ml-2">
                    E-Commerce Microservices & Architecture
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2D6A4F] dark:text-emerald-300 bg-[#E8F5E9] dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#2D6A4F] dark:bg-emerald-400 animate-pulse" />
                    3 Active Collaborators
                  </span>
                </div>
              </div>

              {/* Canvas mock elements */}
              <div className="flex-1 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] p-8 relative overflow-hidden bg-[#F8F9FA] dark:bg-gray-950">
                {/* AI Diagram Node 1 */}
                <div className="absolute top-10 left-12 bg-sky-50 dark:bg-sky-950/60 border-2 border-sky-500 rounded-xl p-3 shadow-md w-44">
                  <p className="text-xs font-bold text-sky-900 dark:text-sky-200">API Gateway</p>
                  <p className="text-[10px] text-sky-700 dark:text-sky-300">Reverse proxy & Auth token check</p>
                </div>

                {/* AI Diagram Node 2 */}
                <div className="absolute top-10 left-80 bg-emerald-50 dark:bg-emerald-950/60 border-2 border-[#2D6A4F] dark:border-emerald-500 rounded-xl p-3 shadow-md w-44">
                  <p className="text-xs font-bold text-[#1B4332] dark:text-emerald-200">Order Service</p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300">Checkout & Payment processing</p>
                </div>

                {/* Sticky Note */}
                <div className="absolute bottom-12 left-16 bg-[#FEF08A] rounded-xl p-4 shadow-md w-48 rotate-[-2deg] border border-yellow-200">
                  <p className="text-xs font-bold text-yellow-900 font-heading">AI Brainstorm</p>
                  <p className="text-xs text-yellow-800 font-handwriting mt-1 text-sm">
                    Add Stripe webhook retries and idempotent keys for payments!
                  </p>
                </div>

                {/* AI Chart preview */}
                <div className="absolute bottom-10 right-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-lg w-64">
                  <p className="text-xs font-bold text-gray-800 dark:text-white flex items-center justify-between">
                    <span>Monthly GMV Growth</span>
                    <BarChart3 className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-emerald-400" />
                  </p>
                  <div className="mt-3 flex items-end gap-3 h-20">
                    <div className="w-1/4 bg-[#2D6A4F]/60 rounded-t h-[40%]" />
                    <div className="w-1/4 bg-[#2D6A4F]/75 rounded-t h-[65%]" />
                    <div className="w-1/4 bg-[#2D6A4F]/90 rounded-t h-[80%]" />
                    <div className="w-1/4 bg-[#2D6A4F] rounded-t h-[100%]" />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>Q1</span>
                    <span>Q2</span>
                    <span>Q3</span>
                    <span>Q4</span>
                  </div>
                </div>

                {/* Live collaborator cursor 1 */}
                <div className="absolute top-28 left-64 flex items-center gap-1.5 pointer-events-none">
                  <svg className="w-5 h-5 text-[#E63946] drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 2l16 11.5-6.5 1.5 4 7-2.5 1.5-4-7-5 5.5z" />
                  </svg>
                  <span className="text-[10px] font-bold bg-[#E63946] text-white px-1.5 py-0.5 rounded-md shadow">
                    Sarah (Architect)
                  </span>
                </div>

                {/* Live collaborator cursor 2 */}
                <div className="absolute top-44 right-80 flex items-center gap-1.5 pointer-events-none">
                  <svg className="w-5 h-5 text-[#2D6A4F] drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 2l16 11.5-6.5 1.5 4 7-2.5 1.5-4-7-5 5.5z" />
                  </svg>
                  <span className="text-[10px] font-bold bg-[#2D6A4F] text-white px-1.5 py-0.5 rounded-md shadow">
                    Alex (Engineering)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-20 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs uppercase font-extrabold text-[#2D6A4F] dark:text-emerald-400 tracking-widest">
              Built for Modern Product Teams
            </h2>
            <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-heading">
              Everything you need from initial sketch to engineering blueprint
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#F8F9FA] dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-[#2D6A4F]/30 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] dark:bg-emerald-950/60 flex items-center justify-center text-[#2D6A4F] dark:text-emerald-400 mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-heading">Infinite Responsive Canvas</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Smooth zoom, multi-touch panning, configurable dot/grid backgrounds, and layer stacking
                capable of organizing complex architecture maps.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F9FA] dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-[#2D6A4F]/30 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] dark:bg-emerald-950/60 flex items-center justify-center text-[#2D6A4F] dark:text-emerald-400 mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-heading">Gemini AI Assistant</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Generate architecture diagrams, brainstormed sticky notes, interactive charts, and board
                summaries directly from natural language prompts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F9FA] dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-[#2D6A4F]/30 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] dark:bg-emerald-950/60 flex items-center justify-center text-[#2D6A4F] dark:text-emerald-400 mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-heading">Real-Time Teamwork</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Socket.IO WebSocket syncing with live colored cursors, presence indicators, freehand
                drawing sync, and granular role permissions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F9FA] dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-[#2D6A4F]/30 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] dark:bg-emerald-950/60 flex items-center justify-center text-[#2D6A4F] dark:text-emerald-400 mb-4">
                <PenTool className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-heading">Precision Drawing Tools</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Pressure-sensitive freehand pens with Perfect Freehand, geometric shapes, sticky notes,
                rich text, and smart connectors with auto-routing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F9FA] dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-[#2D6A4F]/30 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] dark:bg-emerald-950/60 flex items-center justify-center text-[#2D6A4F] dark:text-emerald-400 mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-heading">PostgreSQL & S3 Security</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Standard PostgreSQL with JSONB element serialization, bcrypt auth, JWT token rotation,
                and S3-compatible image asset storage.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F9FA] dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 hover:border-[#2D6A4F]/30 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] dark:bg-emerald-950/60 flex items-center justify-center text-[#2D6A4F] dark:text-emerald-400 mb-4">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white font-heading">High-Fidelity Exports</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Export boards or selected regions to crystal-clear PNG, SVG and JSON preserving exact coordinates,
                colors, charts, typography, and connector lines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section Preview */}
      <section className="py-20 bg-[#F8F9FA] dark:bg-[#0B0F19] border-t border-gray-200 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs uppercase font-extrabold text-[#2D6A4F] dark:text-emerald-400 tracking-widest">
              Simple, Transparent Plans
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 dark:text-white font-heading">
              Ready for individuals and fast-scaling teams
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Tier */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between shadow-xs transition-colors">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Starter</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">For individuals and quick brainstorming</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">$0</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">/ forever</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> Unlimited local whiteboards</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> Up to 3 active collaborators</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> 50 AI Gemini generations / mo</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> PNG, SVG and JSON export</li>
                </ul>
              </div>
              <Link to="/register" className="mt-8">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Pro Tier (Featured) */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border-2 border-[#2D6A4F] dark:border-emerald-500 flex flex-col justify-between shadow-xl relative transition-colors">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2D6A4F] dark:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full">
                Most Popular
              </span>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pro Team</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">For growing startups and engineering squads</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">$12</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">/ user / mo</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> Unlimited shared whiteboards</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> Unlimited real-time collaborators</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> Unlimited Gemini AI generation & charts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> S3 image asset storage & history</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> Role-based permissions (Owner/Editor/Viewer)</li>
                </ul>
              </div>
              <Link to="/register" className="mt-8">
                <Button className="w-full shadow-md shadow-[#2D6A4F]/20">Start 14-Day Free Trial</Button>
              </Link>
            </div>

            {/* Enterprise Tier */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between shadow-xs transition-colors">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Enterprise</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Dedicated cloud hosting & compliance</p>
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900 dark:text-white">$39</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">/ user / mo</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> Dedicated PostgreSQL & MinIO cluster</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> SSO, SAML & audit log exports</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> Custom Gemini model integration</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#2D6A4F] dark:text-emerald-400" /> 99.9% uptime SLA & priority support</li>
                </ul>
              </div>
              <Link to="/register" className="mt-8">
                <Button variant="outline" className="w-full">Contact Sales</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4 text-emerald-200" />
            </div>
            <span className="font-heading font-bold text-base text-white">AI Whiteboard</span>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} AI Whiteboard. Full-stack collaborative canvas powered by React 19, NestJS, PostgreSQL & Google Gemini.
          </p>
          <div className="flex gap-4 text-xs">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
            <a href="https://github.com/VirendraArekar/ai-whiteboard" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
