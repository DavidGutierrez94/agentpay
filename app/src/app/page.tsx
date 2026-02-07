"use client";

import { Hero } from "@/components/landing/Hero";
import { AgentActivityBubbles } from "@/components/landing/AgentActivityBubbles";
import { ProtocolFlow } from "@/components/landing/ProtocolFlow";
import { ZKExplainer } from "@/components/landing/ZKExplainer";
import { CTASection } from "@/components/landing/CTASection";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <AgentActivityBubbles />
      <ProtocolFlow />
      <ZKExplainer />
      <CTASection />
    </div>
  );
}
