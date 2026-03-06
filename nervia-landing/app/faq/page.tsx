import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { HolographicArticle } from "../components/HolographicArticle";

export const metadata = {
  title: "FAQ – Nervia",
  description:
    "Frequently asked questions about Nervia. Learn about neurons, graphs, AI features, pricing, and more.",
};

const faqs = [
  { q: "What is a Neuron?", slug: "what-is-a-neuron", a: "A Neuron is a single unit of knowledge - a note, a bookmark, a source, or an idea - that lives in your graph. You connect neurons to each other; clusters form automatically as related ideas group together." },
  { q: "What is the difference between 2D and 3D graph?", slug: "2d-vs-3d-graph", a: "Genesis includes a 2D knowledge graph to build and explore your connections. Singularity unlocks the full 3D graph: fly through your knowledge in 3D, zoom into clusters, and navigate your universe spatially." },
  { q: "How do I sign in?", slug: "how-do-i-sign-in", a: "You can sign in with Google, GitHub, or Magic Link (email). No password required for Magic Link - we send you a one-time link to access your account." },
  { q: "What is the Neural Core?", slug: "what-is-neural-core", a: "The Neural Core is Nervia's AI layer (Singularity tier). It uses RAG over your graph so you can chat with your knowledge: ask questions, get summaries, and surface connections across your neurons in real time." },
  { q: "What are clusters?", slug: "what-are-clusters", a: "Clusters are groups of connected neurons that form automatically as you add and link content. You can focus on one cluster, share it (e.g. as a 3D world on higher tiers), and use it to organize your thinking." },
  { q: "What is the Browser Web Clipper?", slug: "browser-web-clipper", a: "Our browser extension lets you save pages, highlights, and ideas from the web straight into your graph. One click creates a new neuron and keeps your browsing connected to your knowledge base." },
  { q: "Can I export my data?", slug: "export-data", a: "Yes. Data import and export are available on Constellation and Singularity. You can export your graph and content to use or back up outside Nervia." },
  { q: "What are Pathfinder and Zen Mode?", slug: "pathfinder-zen-mode", a: "Pathfinder helps you navigate between neurons and clusters in your graph. Zen Mode is a focused view so you can work without distraction. Both are included in Constellation and above." },
  { q: "What is Time Machine and the Evolution Journal?", slug: "time-machine-evolution-journal", a: "Time Machine and the Evolution Journal (Singularity) let you see how your knowledge graph changed over time. Revisit past states and track the growth of your universe." },
  { q: "What are Shared Universes?", slug: "shared-universes", a: "On Singularity you can publish clusters as interactive 3D worlds - Shared Universes - that others can explore. Great for sharing research, portfolios, or curated knowledge." },
  { q: "What happens if I hit the 60-neuron limit on Genesis?", slug: "60-neuron-limit", a: "Genesis is free and includes up to 60 neurons. When you need more, upgrade to Constellation for unlimited neurons and more features. You can also try Singularity with a free trial." },
  { q: "Can I try Singularity for free?", slug: "singularity-free-trial", a: "Yes. Singularity comes with a free trial. No credit card required to start. You can explore the Neural Core, 3D graph, and other Singularity features before subscribing." },
  { q: "Is my data private?", slug: "data-privacy", a: "Yes. Your graph lives in your workspace. We never train on your content. For full details, see our Privacy Policy." },
];

export default function FAQPage() {
  return (
    <>
      <div className="relative z-10 min-h-screen">
        <Header />
        <main className="px-6 py-16 md:py-24">
          <HolographicArticle
            kicker="Sys.Req // faq"
            title="Frequently Asked Questions"
            subtitle="Everything you need to know about Nervia"
            footer={
              <Link href="/" className="text-indigo-300 hover:text-indigo-200 transition">
                ← Back to Nervia
              </Link>
            }
          >
            {faqs.map((faq) => (
              <section key={faq.q} id={faq.slug} className="scroll-mt-24">
                <h2>{faq.q}</h2>
                <p>{faq.a}</p>
              </section>
            ))}
          </HolographicArticle>
        </main>
        <Footer />
      </div>
    </>
  );
}
