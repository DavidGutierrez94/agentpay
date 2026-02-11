"use client";

import { AgentActivityBubbles } from "@/components/landing/AgentActivityBubbles";
import { CTASection } from "@/components/landing/CTASection";
import { Hero } from "@/components/landing/Hero";
import { KonamiEasterEgg, PixelCreatures } from "@/components/landing/PixelCreatures";
import { ProtocolFlow } from "@/components/landing/ProtocolFlow";
import { ZKExplainer } from "@/components/landing/ZKExplainer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <div className="relative">
        <AgentActivityBubbles />
        <PixelCreatures />
      </div>
      <ProtocolFlow />
      <div className="relative">
        <ZKExplainer />
        <PixelCreatures />
      </div>
      <CTASection />
      {/* Konami code: up up down down left right left right b a */}
      <KonamiEasterEgg />
    </div>
  );
}
