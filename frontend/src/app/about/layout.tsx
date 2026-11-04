import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | Holiday Expertz — Luxury Stays & Extraordinary Getaways",
  description:
    "Discover Holiday Expertz, your destination for exceptional holiday stays, luxury villas, resorts, inspiring destinations and memorable travel experiences.",
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

