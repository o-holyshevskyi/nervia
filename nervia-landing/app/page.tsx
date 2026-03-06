"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "./components/Header";
import { SnapSection } from "./components/SnapSection";
import { Hero } from "./components/Hero";
import { WhySection } from "./components/WhySection";
import { FeaturesBento } from "./components/FeaturesBento";
import { Pricing } from "./components/Pricing";
import { Testimonials } from "./components/Testimonials";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import { DemoModal } from "./components/DemoModal";
import { SectionNav } from "./components/SectionNav";

export default function Home() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      <SectionNav />

      <div
        className="relative z-10 h-screen w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide bg-transparent"
        data-scrollbar-hide
      >
        <SnapSection id="hero" className="pt-20">
          <Hero onWatchDemo={() => setIsDemoOpen(true)} />
        </SnapSection>

        <SnapSection id="reason">
          <WhySection />
        </SnapSection>

        <SnapSection id="features" scrollable>
          <FeaturesBento />
        </SnapSection>

        <SnapSection id="pricing">
          <Pricing />
        </SnapSection>

        <SnapSection id="why-build">
          <Testimonials />
        </SnapSection>

        <SnapSection id="faq" scrollable>
          <FAQ />
        </SnapSection>

        <SnapSection id="footer" alignBottom>
          <Footer />
        </SnapSection>
      </div>

      <AnimatePresence mode="wait">
        {isDemoOpen && <DemoModal key="demo-modal" onClose={() => setIsDemoOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
