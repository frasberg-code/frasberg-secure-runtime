import Navbar from "../components/site/Navbar";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Hero from "../components/site/Hero";
import EditorialMarquee from "../components/site/EditorialMarquee";
import Models from "../components/site/Models";
import Benchmarks from "../components/site/Benchmarks";
import Capabilities from "../components/site/Capabilities";
import Realms from "../components/site/Realms";
import MythosTimeline from "../components/site/MythosTimeline";
import Safety from "../components/site/Safety";
import Ecosystem from "../components/site/Ecosystem";
import Press from "../components/site/Press";
import ApiDocs from "../components/site/ApiDocs";
import { GallerySpotlight } from "../components/site/GallerySpotlight";
import { GalleryMarquee } from "../components/site/GalleryMarquee";
import { CollapsibleSection } from "../components/site/CollapsibleSection";
import Footer from "../components/site/Footer";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 640px)").matches;
    if (mobile && !sessionStorage.getItem("luchii-home-seen")) {
      sessionStorage.setItem("luchii-home-seen", "1");
      navigate("/chat", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="relative z-10 bg-lux-bg text-lux-text">
      <Navbar />
      <Hero />
      <EditorialMarquee />
      <Models />
      <GalleryMarquee />
      <CollapsibleSection anchor="gallery-spotlight" title="Builder Gallery Spotlight" subtitle="Community sites, apps and games built with Luchii">
        <GallerySpotlight />
      </CollapsibleSection>
      <CollapsibleSection anchor="benchmarks" title="Benchmarks" subtitle="How the Luchii family performs across reasoning suites">
        <Benchmarks />
      </CollapsibleSection>
      <CollapsibleSection anchor="capabilities" title="Capabilities" subtitle="What Luchii can do — writing, code, analysis and more">
        <Capabilities />
      </CollapsibleSection>
      <CollapsibleSection anchor="realms" title="Realms" subtitle="Domain-tuned intelligence realms">
        <Realms />
      </CollapsibleSection>
      <CollapsibleSection anchor="mythos" title="Mythos" subtitle="The Luchii story and constellation lore">
        <MythosTimeline />
      </CollapsibleSection>
      <CollapsibleSection anchor="ecosystem" title="Frasberg Ecosystem" subtitle="Products and platforms powered by Frasberg">
        <Ecosystem />
      </CollapsibleSection>
      <CollapsibleSection anchor="safety" title="Safety & Alignment" subtitle="How Luchii stays safe, grounded and governed">
        <Safety />
      </CollapsibleSection>
      <CollapsibleSection anchor="press" title="Press & Mentions" subtitle="Luchii in the news">
        <Press />
      </CollapsibleSection>
      <CollapsibleSection anchor="api" title="API & Documentation" subtitle="Integrate Luchii with luchii-sk keys — quickstart & examples">
        <ApiDocs />
      </CollapsibleSection>
      <Footer />
    </main>
  );
}
