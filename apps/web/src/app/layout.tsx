import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Beat >X< RAY — See Inside the Beat",
  description: "AI-assisted song reconstruction for FL Studio and Ableton Live. A product of the ZeroHype Organization.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="zerohype-parent-badge" href="https://zerohype.org" aria-label="ZER0 HYPE Technologies LLC" title="A ZER0 HYPE Technologies LLC company"><Image src="/images/zerohype-technologies-badge.png" alt="ZER0 HYPE Technologies LLC" width={460} height={153} priority /></a>{children}</body></html>;
}
