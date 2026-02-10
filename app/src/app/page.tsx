"use client";

import { AgentActivityBubbles } from "@/components/landing/AgentActivityBubbles";
import { CTASection } from "@/components/landing/CTASection";
import { Hero } from "@/components/landing/Hero";
import { ProtocolFlow } from "@/components/landing/ProtocolFlow";
import { ZKExplainer } from "@/components/landing/ZKExplainer";

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
