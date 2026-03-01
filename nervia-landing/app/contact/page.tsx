import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const metadata = {
  title: "Contact – Nervia",
  description:
    "Get in touch with Nervia. Questions, feedback, or support for your Visual Intelligence Universe.",
};

export default function ContactPage() {
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
              Contact
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              We&apos;d love to hear from you
            </p>

            <div className="prose prose-invert mt-10 max-w-none space-y-8 text-slate-300">
              <section>
                <h2 className="text-xl font-semibold text-white">General inquiries</h2>
                <p>
                  For questions about Nervia, feedback, or how we can help you get more from
                  your knowledge graph, reach out at:
                </p>
                <p className="mt-4">
                  <a
                    href="mailto:hello@nervia.app"
                    className="text-cyan-400 hover:text-cyan-300 transition font-medium"
                  >
                    hello@nervia.app
                  </a>
                </p>
                <p className="mt-2 text-sm text-slate-400">
                  We aim to respond within a few business days.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">Support</h2>
                <p>
                  If you need help using Nervia, troubleshooting, or account issues, check our{" "}
                  <Link href="/support" className="text-cyan-400 hover:text-cyan-300 transition">
                    Support
                  </Link>{" "}
                  page first. For direct support, email:
                </p>
                <p className="mt-4">
                  <a
                    href="mailto:support@nervia.app"
                    className="text-cyan-400 hover:text-cyan-300 transition font-medium"
                  >
                    support@nervia.app
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">Stay in the loop</h2>
                <p>
                  Follow us for product updates, tips, and news about the Visual Intelligence
                  Universe. Links to our social channels are available on the main Nervia
                  website.
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
