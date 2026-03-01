import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const metadata = {
  title: "About – Nervia",
  description:
    "Learn about Nervia, your Visual Intelligence Universe. Our mission, what we build, and how we help you think in 3D.",
};

export default function AboutPage() {
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
              About Nervia
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Your Visual Intelligence Universe
            </p>

            <div className="prose prose-invert mt-10 max-w-none space-y-8 text-slate-300">
              <section>
                <h2 className="text-xl font-semibold text-white">Our Mission</h2>
                <p>
                  Nervia is built for people who think in connections, not just lists. We believe
                  knowledge is a graph: ideas link to sources, sources to people, and everything
                  lives in a living 3D space. Our mission is to give you a Visual Intelligence
                  Universe where you can capture, connect, and explore your knowledge the way your
                  brain actually works.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">What We Build</h2>
                <p>
                  Nervia is a 3D knowledge graph. You create <strong className="text-slate-200">neurons</strong> - 
                  notes, bookmarks, sources, ideas - and connect them. Clusters form automatically,
                  and you can navigate your graph in 3D, zoom in on clusters, and use the Neural
                  Core (AI) to summarize, extend, and reason over your content. We offer a browser
                  extension to save and sync content into your graph.
                </p>
                <p>
                  We offer tiers from Genesis to Constellation and Singularity for power users. Your data stays in your workspace; we don&apos;t train on your content.
                  See our <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 transition">Privacy Policy</Link> for details.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">Why &quot;Nervia&quot;</h2>
                <p>
                  The name reflects the idea of a nervous system for your knowledge: neurons
                  (nodes), synapses (connections), and clusters (regions) that light up as you
                  think and learn. We want Nervia to feel like an extension of how you already
                  reason - just visualized and supercharged with structure and AI.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">Contact</h2>
                <p>
                  For questions about Nervia or support, reach out through the contact information
                  provided on the Nervia website or application. We&apos;re building this with our
                  users and would love to hear from you.
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
