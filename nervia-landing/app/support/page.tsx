import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const metadata = {
  title: "Support – Nervia",
  description:
    "Get help with Nervia. FAQs, troubleshooting, and how to reach support for your Visual Intelligence Universe.",
};

export default function SupportPage() {
  return (
    <>
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="absolute -top-1/2 -left-1/4 h-[80vh] w-[80vh] rounded-full orb-cyan"
          style={{ width: "80vmax", height: "80vmax" }}
        />
        <div
          className="absolute -bottom-1/2 -right-1/4 h-[80vh] w-[80vh] rounded-full orb-purple"
          style={{ width: "80vmax", height: "80vmax" }}
        />
      </div>
      <div className="relative z-10 min-h-screen">
        <Header />
        <main className="px-6 py-16 md:py-24">
          <article className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl md:p-12">
            <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Support
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Help and resources for Nervia
            </p>

            <div className="prose prose-invert mt-10 max-w-none space-y-8 text-slate-300">
              <section>
                <h2 className="text-xl font-semibold text-white">FAQ</h2>
                <p>
                  Many common questions about features, pricing, and how Nervia works are
                  answered on our main site. Scroll to the{" "}
                  <Link href="/#faq" className="text-cyan-400 hover:text-cyan-300 transition">
                    FAQ section
                  </Link>{" "}
                  on the homepage for quick answers on neurons, the 3D graph, Neural Core (AI),
                  tiers, and data privacy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">Getting started</h2>
                <p>
                  New to Nervia? Sign in with Google, GitHub, or Magic Link (email). Create
                  neurons - notes, bookmarks, ideas - and connect them. Your graph grows as you
                  add content; clusters form automatically. Use the Neural Core to summarize
                  and extend your thinking. The browser extension lets you save and sync
                  content from the web into your graph.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">Account and billing</h2>
                <p>
                  Account and billing settings are available inside the Nervia application
                  once you&apos;re signed in. For subscription changes, payment issues, or
                  account access, we can help - see the contact options below.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">Contact support</h2>
                <p>
                  If you can&apos;t find what you need in the FAQ or in-app help, email us at:
                </p>
                <p className="mt-4">
                  <a
                    href="mailto:support@nervia.app"
                    className="text-cyan-400 hover:text-cyan-300 transition font-medium"
                  >
                    support@nervia.app
                  </a>
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  Include a short description of your issue or question. We aim to respond
                  within a few business days.
                </p>
                <p className="mt-4">
                  For general inquiries (not support), see our{" "}
                  <Link href="/contact" className="text-cyan-400 hover:text-cyan-300 transition">
                    Contact
                  </Link>{" "}
                  page.
                </p>
              </section>
            </div>

            <p className="mt-12 pt-8 border-t border-white/10">
              <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition">
                ← Back to Nervia
              </Link>
            </p>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
}
