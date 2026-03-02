import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const metadata = {
  title: "Privacy Policy – Nervia",
  description:
    "Privacy Policy for Nervia. How we collect, use, and protect your data when you use our Visual Intelligence Universe.",
};

export default function PrivacyPage() {
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
              Privacy Policy
            </h1>
            <p className="mt-2 text-sm text-slate-400">Last updated: February 2026</p>

            <div className="prose prose-invert mt-10 max-w-none space-y-8 text-slate-300">
              <section>
                <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
                <p>
                  Nervia (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the Nervia platform and
                  related services, including the website and application (the &quot;Service&quot;). This
                  Privacy Policy explains how we collect, use, disclose, and safeguard your
                  information when you use our Visual Intelligence Universe - including our 3D
                  knowledge graph, neurons, clusters, and AI-powered features.
                </p>
                <p>
                  By using the Service, you agree to the collection and use of information in
                  accordance with this policy. If you do not agree, please do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
                <h3 className="text-lg font-medium text-slate-200">Account and authentication</h3>
                <p>
                  When you sign in via Google, GitHub, or Magic Link (email), we receive and store
                  identifiers (e.g., email, name, profile picture) provided by the authentication
                  provider. We use Supabase for authentication; their processing is subject to
                  their privacy policy.
                </p>
                <h3 className="mt-4 text-lg font-medium text-slate-200">Content you create</h3>
                <p>
                  We store the content you create in Nervia: neurons (notes, sources, ideas),
                  connections, clusters, tags, and any text or metadata you add. This data is stored
                  to provide the Service and to power features such as the Neural Core (AI) and
                  auto-clustering. We do not use your content to train third-party AI models for
                  purposes unrelated to your use of the Service.
                </p>
                <h3 className="mt-4 text-lg font-medium text-slate-200">Usage and technical data</h3>
                <p>
                  We may collect usage data (e.g., feature usage, session duration) and technical
                  data (e.g., browser type, IP address, device information) to operate, secure, and
                  improve the Service. If you use the Nervia browser extension, we may process
                  data necessary to sync bookmarks or saved items to your graph.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">3. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Provide, maintain, and improve the Service</li>
                  <li>Authenticate you and manage your account</li>
                  <li>Power the 3D graph, AI (RAG), and clustering features</li>
                  <li>Send you service-related communications (e.g., magic link emails)</li>
                  <li>Respond to support requests and enforce our terms</li>
                  <li>Comply with legal obligations and protect our rights</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">4. Sharing and Disclosure</h2>
                <p>We do not sell your personal information. We may share data with:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong className="text-slate-200">Service providers</strong> (e.g., Supabase,
                    hosting) who process data on our behalf under strict agreements
                  </li>
                  <li>
                    <strong className="text-slate-200">Legal authorities</strong> when required by
                    law or to protect our rights and safety
                  </li>
                  <li>
                    <strong className="text-slate-200">Other users</strong> only when you
                    explicitly share content (e.g., publishing a cluster as a shared 3D world)
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">5. Data Retention and Security</h2>
                <p>
                  We retain your account and content for as long as your account is active or as
                  needed to provide the Service. You may request deletion of your account and
                  associated data; we will process such requests in accordance with applicable law.
                </p>
                <p>
                  We implement appropriate technical and organizational measures to protect your
                  data. No method of transmission or storage is 100% secure; we cannot guarantee
                  absolute security.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
                <p>
                  Depending on your jurisdiction, you may have the right to access, correct, delete,
                  or port your personal data, or to object to or restrict certain processing. To
                  exercise these rights, contact us using the details below. You may also have the
                  right to lodge a complaint with a supervisory authority.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">7. Children</h2>
                <p>
                  The Service is not directed at children under 13 (or the applicable age in your
                  region). We do not knowingly collect personal information from children.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">8. Changes</h2>
                <p>
                  We may update this Privacy Policy from time to time. We will post the updated
                  version on this page and update the &quot;Last updated&quot; date. Continued use
                  of the Service after changes constitutes acceptance of the revised policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">9. Contact</h2>
                <p>
                  For privacy-related questions or requests, contact us at the contact information
                  provided on the Nervia website or application.
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
