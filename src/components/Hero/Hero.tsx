import HeroBackground from "./Background/HeroBackground";
import HeroContent from "./HeroContent";
import ScrollIndicator from "./ScrollIndicator";

export default function Hero() {
  return (
    <section id="home" className="relative min-h-screen overflow-hidden">
      <HeroBackground />

      <HeroContent />

      <ScrollIndicator />
    </section>
  );
}