import type { Metadata } from "next";
import { getShareMetadata } from "@/src/lib/share-metadata";
import ShareViewClient from "./ShareViewClient";

const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof process.env.VERCEL_URL === "string"
    ? `https://${process.env.VERCEL_URL}`
    : "https://nervia.app");

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { clusterName } = await getShareMetadata(slug);
  const title = clusterName
    ? `Explore the '${clusterName}' intelligence cluster`
    : "Explore my Nervia Universe";
  const description = "An interactive 3D knowledge graph created on Nervia.";
  const ogImage = `${SITE_URL}/banner.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/share/${slug}`,
      siteName: "Nervia",
      images: [
        { url: ogImage, width: 1200, height: 630, alt: "Nervia knowledge graph" },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default function SharePage(_props: Props) {
  return <ShareViewClient />;
}
