import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | Nervia",
  description: "Your guide to the Nervia universe—spatial knowledge graph, Web Clipper, tags, and organization.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
