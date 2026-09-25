import Navbar from "@/components/Navigation/Navbar";
import Hero from "@/components/Hero/Hero";
import About from "@/components/About/About";
import SolarSystem from "@/components/SolarSystem/SolarSystem";
import Cursor from "@/components/Cursor/Cursor";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Cursor />
      <Navbar />
      <Hero />
      <About />
      <SolarSystem />
    </main>
  );
}