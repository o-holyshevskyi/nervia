"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { WhySection } from "./components/WhySection";
import { FeaturesBento } from "./components/FeaturesBento";
import { Pricing } from "./components/Pricing";
import { Testimonials } from "./components/Testimonials";
import { FAQ } from "./components/FAQ";
import { Footer } from "./components/Footer";
import { DemoModal } from "./components/DemoModal";

export default function Home() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);

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
          <Hero onWatchDemo={() => setIsDemoOpen(true)} />
          <WhySection />
          <FeaturesBento />
          <Pricing />
          <Testimonials />
          <FAQ />
          <Footer />
        </main>
      </div>

      <AnimatePresence mode="wait">
        {isDemoOpen && <DemoModal key="demo-modal" onClose={() => setIsDemoOpen(false)} />}
      </AnimatePresence>
    </>
  );
}
