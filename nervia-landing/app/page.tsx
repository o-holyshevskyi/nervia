import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { WhySection } from "./components/WhySection";
import { FeaturesBento } from "./components/FeaturesBento";
import { Pricing } from "./components/Pricing";
import { Testimonials } from "./components/Testimonials";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";

export default function Home() {
  return (
    <>
      {/* Animated orbs background */}
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

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        <Header />
        <main>
          <Hero />
          <WhySection />
          <FeaturesBento />
          <Pricing />
          <Testimonials />
          <FAQ />
          <Footer />
        </main>
      </div>
    </>
  );
}
