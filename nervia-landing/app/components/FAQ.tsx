"use client";

import { FadeIn } from "./FadeIn";

const faqs = [
  {
    q: "What is a Neuron?",
    a: "A Neuron is a single unit of knowledge - a note, a source, or an idea - that can connect to others in your 3D graph.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your graph lives in your workspace. We never train on your content. See our Privacy Policy for details.",
  },
  {
    q: "Can I try Pro for free?",
    a: "Singularity (Pro) comes with a free trial. No credit card required to start.",
  },
];

export function FAQ() {
  return (
    <section className="relative px-6 py-24 md:py-32" id="faq">
      <div className="mx-auto max-w-3xl">
        <FadeIn className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Frequently asked questions
          </h2>
        </FadeIn>
        <ul className="mt-16 space-y-6">
          {faqs.map((faq, i) => (
            <FadeIn key={faq.q} delay={0.1 * (i + 1)}>
              <li className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
                <h3 className="font-semibold text-white">{faq.q}</h3>
                <p className="mt-2 text-slate-400">{faq.a}</p>
              </li>
            </FadeIn>
          ))}
        </ul>
      </div>
    </section>
  );
}
