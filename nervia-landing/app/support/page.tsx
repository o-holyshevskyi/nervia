import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { HolographicArticle } from "../components/HolographicArticle";

export const metadata = {
  title: "Support – Nervia",
  description:
    "Get help with Nervia. FAQs, troubleshooting, and how to reach support for your Visual Intelligence Universe.",
};

export default function SupportPage() {
  return (
    <>
      <div className="relative z-10 min-h-screen">
        <Header />
        <main className="px-6 py-16 md:py-24">
          <HolographicArticle
            kicker="Sys.Req // support"
            title="Support"
            subtitle="Help and resources for Nervia"
            footer={
              <Link href="/" className="text-indigo-300 hover:text-indigo-200 transition">
                ← Back to Nervia
              </Link>
            }
          >
            <section>
              <h2>FAQ</h2>
              <p>
                Many common questions about features, pricing, and how Nervia works are answered on
                our main site. Scroll to the <Link href="/#faq">FAQ section</Link> on the homepage
                for quick answers on neurons, the 3D graph, Neural Core (AI), tiers, and data
                privacy.
              </p>
            </section>

            <section>
              <h2>Getting started</h2>
              <p>
                New to Nervia? Sign in with Google, GitHub, or Magic Link (email). Create neurons -
                notes, bookmarks, ideas - and connect them. Your graph grows as you add content;
                clusters form automatically. Use the Neural Core to summarize and extend your
                thinking. The browser extension lets you save and sync content from the web into
                your graph.
              </p>
            </section>

            <section>
              <h2>Account and billing</h2>
              <p>
                Account and billing settings are available inside the Nervia application once
                you&apos;re signed in. For subscription changes, payment issues, or account access,
                we can help - see the contact options below.
              </p>
            </section>

            <section>
              <h2>Contact support</h2>
              <p>If you can&apos;t find what you need in the FAQ or in-app help, email us at:</p>
              <p>
                <a href="mailto:support@nervia.app">support@nervia.app</a>
              </p>
              <p>
                Include a short description of your issue or question. We aim to respond within a
                few business days.
              </p>
              <p>
                For general inquiries (not support), see our <Link href="/contact">Contact</Link>{" "}
                page.
              </p>
            </section>
          </HolographicArticle>
        </main>
        <Footer />
      </div>
    </>
  );
}
