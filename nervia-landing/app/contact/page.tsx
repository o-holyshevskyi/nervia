import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { HolographicArticle } from "../components/HolographicArticle";

export const metadata = {
  title: "Contact - Nervia",
  description:
    "Get in touch with Nervia. Questions, feedback, or support for your Visual Intelligence Universe.",
};

export default function ContactPage() {
  return (
    <>
      <div className="relative z-10 min-h-screen">
        <Header />
        <main className="px-6 py-16 md:py-24">
          <HolographicArticle
            kicker="Sys.Req // contact"
            title="Contact"
            subtitle="We’d love to hear from you"
            footer={
              <Link href="/" className="text-indigo-300 hover:text-indigo-200 transition">
                ← Back to Nervia
              </Link>
            }
          >
            <section>
              <h2>General inquiries</h2>
              <p>
                For questions about Nervia, feedback, or how we can help you get more from your
                knowledge graph, reach out at:
              </p>
              <p>
                <a href="mailto:hello@nervia.app">hello@nervia.app</a>
              </p>
              <p>We aim to respond within a few business days.</p>
            </section>

            <section>
              <h2>Support</h2>
              <p>
                If you need help using Nervia, troubleshooting, or account issues, check our{" "}
                <Link href="/support">Support</Link> page first. For direct support, email:
              </p>
              <p>
                <a href="mailto:support@nervia.app">support@nervia.app</a>
              </p>
            </section>

            <section>
              <h2>Stay in the loop</h2>
              <p>
                Follow us for product updates, tips, and news about the Visual Intelligence
                Universe. Links to our social channels are available on the main Nervia website.
              </p>
            </section>
          </HolographicArticle>
        </main>
        <Footer />
      </div>
    </>
  );
}
