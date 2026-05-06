import type { Metadata } from "next";
import type { JSX } from "react";
import { LandingHeader } from "./components/landing-header";
import { HeroSection } from "./components/hero-section";
import { FeaturesSection } from "./components/features-section";
import { CtaSection } from "./components/cta-section";
import { LandingFooter } from "./components/landing-footer";

export const metadata: Metadata = {
  title: "MiniSlack — Team Messaging",
  description:
    "A fast, focused messaging app for small teams. Real-time channels, workspaces, and file sharing — without the noise.",
};

export default function LandingPage(): JSX.Element {
  return (
    <>
      <LandingHeader />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </>
  );
}
