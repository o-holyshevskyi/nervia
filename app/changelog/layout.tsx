import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog | Nervia",
  description: "The latest updates and improvements to the Nervia universe.",
};

export default function ChangelogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
