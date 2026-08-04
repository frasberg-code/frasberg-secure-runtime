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
      <GallerySpotlight />
      <Benchmarks />
      <Capabilities />
      <Realms />
      <MythosTimeline />
      <Ecosystem />
      <Safety />
      <Press />
      <ApiDocs />
      <Footer />
    </main>
  );
}
