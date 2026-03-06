import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { HolographicArticle } from "../components/HolographicArticle";

export const metadata = {
  title: "About - Nervia",
  description:
    "Learn about Nervia, your Visual Intelligence Universe. Our mission, what we build, and how we help you think in 3D.",
};

export default function AboutPage() {
  return (
    <>
      <div className="relative z-10 min-h-screen">
        <Header />
        <main className="px-6 py-16 md:py-24">
          <HolographicArticle
            kicker="Sys.Req // about"
            title="About Nervia"
            subtitle="Your Visual Intelligence Universe"
            footer={
              <Link href="/" className="text-indigo-300 hover:text-indigo-200 transition">
                ← Back to Nervia
              </Link>
            }
          >
            <section>
              <h2>Our Mission</h2>
              <p>
                Nervia is built for people who think in connections, not just lists. We believe
                knowledge is a graph: ideas link to sources, sources to people, and everything
                lives in a living 3D space. Our mission is to give you a Visual Intelligence
                Universe where you can capture, connect, and explore your knowledge the way your
                brain actually works.
              </p>
            </section>

            <section>
              <h2>What We Build</h2>
              <p>
                Nervia is a 3D knowledge graph. You create <strong>neurons</strong> - notes,
                bookmarks, sources, ideas - and connect them. Clusters form automatically, and you
                can navigate your graph in 3D, zoom in on clusters, and use the Neural Core (AI)
                to summarize, extend, and reason over your content. We offer a browser extension
                to save and sync content into your graph.
              </p>
              <p>
                We offer tiers from Genesis to Constellation and Singularity for power users. Your
                data stays in your workspace; we don&apos;t train on your content. See our{" "}
                <Link href="/privacy">Privacy Policy</Link> for details.
              </p>
            </section>

            <section>
              <h2>Why &quot;Nervia&quot;</h2>
              <p>
                The name reflects the idea of a nervous system for your knowledge: neurons (nodes),
                synapses (connections), and clusters (regions) that light up as you think and learn.
                We want Nervia to feel like an extension of how you already reason - just visualized
                and supercharged with structure and AI.
              </p>
            </section>

            <section>
              <h2>Contact</h2>
              <p>
                For questions about Nervia or support, reach out through the contact information
                provided on the Nervia website or application. We&apos;re building this with our
                users and would love to hear from you.
              </p>
            </section>
          </HolographicArticle>
        </main>
        <Footer />
      </div>
    </>
  );
}
