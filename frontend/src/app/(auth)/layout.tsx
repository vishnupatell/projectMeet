import { Video, Sparkles, ShieldCheck } from 'lucide-react';
import { APP_NAME } from '@/lib/config';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mist-100 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-3xl border border-mist-200 bg-white shadow-soft lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden border-r border-mist-200 bg-ink-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(58,154,177,0.45),transparent_36%),radial-gradient(circle_at_80%_0%,rgba(106,184,203,0.26),transparent_42%),linear-gradient(165deg,#0E161A_0%,#073B47_100%)]" />
          <div className="relative z-10">
            <div className="mb-8 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-400/30">
                <Video className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
            </div>
            <h1 className="max-w-md text-4xl font-bold leading-tight">
              Design-rich meetings built for focused teams.
            </h1>
            <p className="mt-4 max-w-md text-sm text-slate-200/90">
              Secure video, fast join links, and clean collaboration flows in one place.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            <div className="frosted-panel rounded-2xl p-4 text-sm text-ink-800">
              <div className="mb-2 flex items-center gap-2 font-semibold text-ink-900">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                End-to-end protected rooms
              </div>
              Trusted controls for hosts, participants, and meeting history.
            </div>
            <div className="frosted-panel rounded-2xl p-4 text-sm text-ink-800">
              <div className="mb-2 flex items-center gap-2 font-semibold text-ink-900">
                <Sparkles className="h-4 w-4 text-brand-600" />
                One-click scheduling
              </div>
              Launch instantly or plan sessions with share-ready links.
            </div>
          </div>
        </aside>

        <main className="flex min-h-[70vh] items-center justify-center bg-[linear-gradient(170deg,#F8FBFC_0%,#EEF4F7_100%)] p-4 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
