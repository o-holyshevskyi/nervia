import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { HolographicArticle } from "../components/HolographicArticle";

export const metadata = {
  title: "Terms & Conditions – Nervia",
  description:
    "Terms and Conditions for using Nervia, the Visual Intelligence Universe and 3D Knowledge Graph platform.",
};

export default function TermsPage() {
  return (
    <>
      <div className="relative z-10 min-h-screen">
        <Header />
        <main className="px-6 py-16 md:py-24">
          <HolographicArticle
            kicker="Sys.Req // terms"
            title="Terms & Conditions"
            subtitle="Last updated: February 2026"
            footer={
              <Link href="/" className="text-indigo-300 hover:text-indigo-200 transition">
                ← Back to Nervia
              </Link>
            }
          >
            <section>
              <h2>1. Agreement to Terms</h2>
              <p>
                These Terms and Conditions (&quot;Terms&quot;) govern your access to and use of Nervia,
                including the website, application, browser extension, and related services (the
                &quot;Service&quot;) operated by Nervia. By accessing or using the Service - including
                signing in via Google, GitHub, or Magic Link - you agree to be bound by these Terms
                and our Privacy Policy. If you do not agree, you may not use the Service.
              </p>
            </section>

            <section>
              <h2>2. Description of the Service</h2>
              <p>
                Nervia provides a Visual Intelligence Universe: a 3D knowledge graph where you can
                create neurons (notes, sources, ideas), connect them visually, use AI-powered
                features (Neural Core, RAG), and benefit from auto-clustering and shared workspaces.
                The Service may be offered in Genesis, Constellation, and Singularity tiers as
                described on our pricing page.
              </p>
            </section>

            <section>
              <h2>3. Account and Eligibility</h2>
              <p>
                You must be at least 13 years old (or the age of consent in your jurisdiction) to
                use the Service. You are responsible for maintaining the confidentiality of your
                account credentials and for all activity under your account. You must provide
                accurate information when signing up and notify us of any unauthorized use.
              </p>
            </section>

            <section>
              <h2>4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use the Service for any illegal purpose or in violation of applicable laws</li>
                <li>
                  Infringe any third-party rights (intellectual property, privacy, or otherwise)
                </li>
                <li>Upload malware, spam, or content designed to harm or disrupt the Service</li>
                <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
                <li>Scrape, reverse-engineer, or automate access in ways not permitted by us</li>
                <li>Resell or sublicense the Service without our written permission</li>
              </ul>
              <p>
                We may suspend or terminate your access if we reasonably believe you have violated
                these Terms or abused the Service.
              </p>
            </section>

            <section>
              <h2>5. Your Content and Licenses</h2>
              <p>
                You retain ownership of the content you create in Nervia (neurons, connections,
                clusters, etc.). By using the Service, you grant us a limited, worldwide,
                non-exclusive, royalty-free license to host, store, process, and display your
                content solely to operate and improve the Service (e.g., to run the 3D graph and AI
                features). We do not claim ownership of your content.
              </p>
              <p>
                You are responsible for ensuring you have the rights to upload and use any content
                you provide. When you share content with others (e.g., publishing a cluster), you
                may grant them access as permitted by the sharing options you choose.
              </p>
            </section>

            <section>
              <h2>6. Intellectual Property</h2>
              <p>
                Nervia and its branding, design, software, and documentation are owned by us or our
                licensors. You may not copy, modify, or create derivative works of our Service or
                branding except as necessary to use the Service in accordance with these Terms.
              </p>
            </section>

            <section>
              <h2>7. Paid Plans and Billing</h2>
              <p>
                Paid plans (e.g., Constellation, Singularity) may be subject to separate billing
                terms and subscription conditions. Fees, renewal, and cancellation will be
                communicated at sign-up or in the application. We may change pricing with
                reasonable notice. Refunds are handled in accordance with our refund policy as
                stated at the time of purchase.
              </p>
            </section>

            <section>
              <h2>8. Disclaimers</h2>
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES
                OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT GUARANTEE THAT THE SERVICE WILL BE
                UNINTERRUPTED, ERROR-FREE, OR SECURE. AI-GENERATED OUTPUTS (E.G., NEURAL CORE) ARE
                FOR ASSISTANCE ONLY AND DO NOT CONSTITUTE LEGAL, MEDICAL, OR PROFESSIONAL ADVICE.
              </p>
            </section>

            <section>
              <h2>9. Limitation of Liability</h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, NERVIA AND ITS AFFILIATES SHALL NOT BE
                LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
                OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
                OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE TWELVE MONTHS
                PRECEDING THE CLAIM (OR ONE HUNDRED U.S. DOLLARS IF GREATER).
              </p>
            </section>

            <section>
              <h2>10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Nervia and its officers, directors,
                employees, and agents from any claims, damages, or expenses (including reasonable
                attorneys&apos; fees) arising from your use of the Service, your content, or your
                violation of these Terms.
              </p>
            </section>

            <section>
              <h2>11. Changes to the Terms</h2>
              <p>
                We may modify these Terms from time to time. We will post the updated Terms on this
                page and update the &quot;Last updated&quot; date. Material changes may be communicated
                via the Service or email. Continued use after changes constitutes acceptance. If
                you do not agree, you must stop using the Service.
              </p>
            </section>

            <section>
              <h2>12. Governing Law and Disputes</h2>
              <p>
                These Terms are governed by the laws of the jurisdiction in which Nervia operates,
                without regard to conflict of law principles. Any disputes shall be resolved in the
                courts of that jurisdiction, except where prohibited.
              </p>
            </section>

            <section>
              <h2>13. Contact</h2>
              <p>
                For questions about these Terms, please contact us through the contact information
                provided on the Nervia website or application.
              </p>
            </section>
          </HolographicArticle>
        </main>
        <Footer />
      </div>
    </>
  );
}
