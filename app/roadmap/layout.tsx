import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flight Plan | Nervia",
  description: "The future trajectory of the Nervia universe.",
};

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return children;
}
