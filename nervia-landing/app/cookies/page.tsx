import Link from "next/link";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export const metadata = {
  title: "Cookie Policy – Nervia",
  description:
    "How Nervia uses cookies and similar technologies when you use our Visual Intelligence Universe.",
};

export default function CookiesPage() {
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
              Cookie Policy
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Last updated: February 2026
            </p>

            <div className="prose prose-invert mt-10 max-w-none space-y-8 text-slate-300">
              <section>
                <h2 className="text-xl font-semibold text-white">1. What Are Cookies?</h2>
                <p>
                  Cookies are small text files that are stored on your device (computer, tablet,
                  or mobile) when you visit a website. They are widely used to make websites
                  work more efficiently, to remember your preferences, and to provide information
                  to the site owners. Nervia and our service providers may also use similar
                  technologies such as local storage, session storage, and pixel tags where
                  relevant.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">2. How We Use Cookies</h2>
                <p>
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    <strong className="text-slate-200">Keep you signed in:</strong> After you sign
                    in with Google, GitHub, or Magic Link, we use cookies (or equivalent
                    mechanisms) to maintain your session so you do not have to log in on every
                    page. Our authentication provider (Supabase) may set and read cookies for this
                    purpose.
                  </li>
                  <li>
                    <strong className="text-slate-200">Secure the Service:</strong> Cookies help us
                    verify requests, prevent cross-site request forgery (CSRF), and protect
                    against abuse.
                  </li>
                  <li>
                    <strong className="text-slate-200">Remember preferences:</strong> We may store
                    your preferences (e.g., theme, UI state) so your experience is consistent
                    across visits.
                  </li>
                  <li>
                    <strong className="text-slate-200">Operate the product:</strong> Data stored in
                    your browser (e.g., local or session storage) may be used to cache graph data or
                    extension state for performance and offline capability.
                  </li>
                  <li>
                    <strong className="text-slate-200">Analytics and improvement:</strong> We may
                    use cookies or similar technologies to understand how the Service is used (e.g.,
                    page views, feature usage) in order to improve performance and user experience.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">3. Types of Cookies We Use</h2>
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-3 pr-4 font-medium text-white">Type</th>
                      <th className="py-3 pr-4 font-medium text-white">Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-400">
                    <tr className="border-b border-white/5">
                      <td className="py-3 pr-4">Strictly necessary</td>
                      <td className="py-3">
                        Required for authentication, security, and core functionality. These
                        cannot be disabled if you want to use the Service.
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="py-3 pr-4">Functional</td>
                      <td className="py-3">
                        Remember your preferences and settings to improve your experience.
                      </td>
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
                <h2 className="text-xl font-semibold text-white">4. Third-Party Cookies</h2>
                <p>
                  Our Service may integrate with third-party services (e.g., Supabase for
                  authentication, hosting or analytics providers) that may set their own cookies
                  or similar technologies. Their use of cookies is governed by their respective
                  privacy and cookie policies. We encourage you to review those policies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">5. Your Choices</h2>
                <p>
                  Most browsers allow you to control cookies through their settings. You can
                  typically refuse or delete cookies; however, disabling strictly necessary
                  cookies may prevent you from signing in or using core features of Nervia. For
                  more information, see your browser&apos;s help section or the documentation of
                  the device you use to access the Service.
                </p>
                <p>
                  If we use non-essential cookies for analytics or marketing in the future, we will
                  provide a way to manage your preferences (e.g., cookie banner or settings page)
                  where required by law.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">6. Updates</h2>
                <p>
                  We may update this Cookie Policy from time to time to reflect changes in our
                  practices or in applicable law. We will post the updated version on this page
                  and update the &quot;Last updated&quot; date. We encourage you to review this
                  policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white">7. Contact</h2>
                <p>
                  For questions about our use of cookies, please contact us through the contact
                  information provided on the Nervia website or application. For more on how we
                  process personal data, see our{" "}
                  <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 transition">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </section>
            </div>

            <p className="mt-12 pt-8 border-t border-white/10">
              <Link
                href="/"
                className="text-cyan-400 hover:text-cyan-300 transition"
              >
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
