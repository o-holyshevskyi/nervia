import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { HolographicArticle } from "../components/HolographicArticle";

export const metadata = {
  title: "Cookie Policy – Nervia",
  description:
    "How Nervia uses cookies and similar technologies when you use our Visual Intelligence Universe.",
};

export default function CookiesPage() {
  return (
    <>
      <div className="relative z-10 min-h-screen">
        <Header />
        <main className="px-6 py-16 md:py-24">
          <HolographicArticle
            kicker="Sys.Req // cookies"
            title="Cookie Policy"
            subtitle="Last updated: February 2026"
            footer={
              <Link href="/" className="text-indigo-300 hover:text-indigo-200 transition">
                ← Back to Nervia
              </Link>
            }
          >
            <section>
              <h2>1. What Are Cookies?</h2>
              <p>
                Cookies are small text files that are stored on your device (computer, tablet, or
                mobile) when you visit a website. They are widely used to make websites work more
                efficiently, to remember your preferences, and to provide information to the site
                owners. Nervia and our service providers may also use similar technologies such as
                local storage, session storage, and pixel tags where relevant.
              </p>
            </section>

            <section>
              <h2>2. How We Use Cookies</h2>
              <p>We use cookies and similar technologies to:</p>
              <ul>
                <li>
                  <strong>Keep you signed in:</strong> After you sign in with Google, GitHub, or
                  Magic Link, we use cookies (or equivalent mechanisms) to maintain your session so
                  you do not have to log in on every page. Our authentication provider (Supabase)
                  may set and read cookies for this purpose.
                </li>
                <li>
                  <strong>Secure the Service:</strong> Cookies help us verify requests, prevent
                  cross-site request forgery (CSRF), and protect against abuse.
                </li>
                <li>
                  <strong>Remember preferences:</strong> We may store your preferences (e.g., theme,
                  UI state) so your experience is consistent across visits.
                </li>
                <li>
                  <strong>Operate the product:</strong> Data stored in your browser (e.g., local or
                  session storage) may be used to cache graph data or extension state for
                  performance and offline capability.
                </li>
                <li>
                  <strong>Analytics and improvement:</strong> We may use cookies or similar
                  technologies to understand how the Service is used (e.g., page views, feature
                  usage) in order to improve performance and user experience.
                </li>
              </ul>
            </section>

            <section>
              <h2>3. Types of Cookies We Use</h2>
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="py-3 pr-4 font-medium text-white">Type</th>
                    <th className="py-3 pr-4 font-medium text-white">Purpose</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-400">
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4">Strictly necessary</td>
                    <td className="py-3">
                      Required for authentication, security, and core functionality. These cannot
                      be disabled if you want to use the Service.
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4">Functional</td>
                    <td className="py-3">Remember your preferences and settings to improve your experience.</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 pr-4">Analytics / performance</td>
                    <td className="py-3">
                      Help us understand how the Service is used so we can improve it (e.g.,
                      aggregate page views, errors).
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section>
              <h2>4. Third-Party Cookies</h2>
              <p>
                Our Service may integrate with third-party services (e.g., Supabase for authentication, hosting
                or analytics providers) that may set their own cookies or similar technologies. Their use of
                cookies is governed by their respective privacy and cookie policies. We encourage you to
                review those policies.
              </p>
            </section>

            <section>
              <h2>5. Your Choices</h2>
              <p>
                Most browsers allow you to control cookies through their settings. You can typically refuse or
                delete cookies; however, disabling strictly necessary cookies may prevent you from signing in
                or using core features of Nervia. For more information, see your browser&apos;s help section or
                the documentation of the device you use to access the Service.
              </p>
              <p>
                If we use non-essential cookies for analytics or marketing in the future, we will provide a
                way to manage your preferences (e.g., cookie banner or settings page) where required by law.
              </p>
            </section>

            <section>
              <h2>6. Updates</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices or in
                applicable law. We will post the updated version on this page and update the &quot;Last updated&quot;
                date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2>7. Contact</h2>
              <p>
                For questions about our use of cookies, please contact us through the contact information
                provided on the Nervia website or application. For more on how we process personal data,
                see our <Link href="/privacy">Privacy Policy</Link>.
              </p>
            </section>
          </HolographicArticle>
        </main>
        <Footer />
      </div>
    </>
  );
}
