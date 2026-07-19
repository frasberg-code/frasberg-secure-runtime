import Navbar from "../components/site/Navbar";
import Hero from "../components/site/Hero";
import EditorialMarquee from "../components/site/EditorialMarquee";
import Models from "../components/site/Models";
import Benchmarks from "../components/site/Benchmarks";
import Capabilities from "../components/site/Capabilities";
import Realms from "../components/site/Realms";
import MythosTimeline from "../components/site/MythosTimeline";
import Safety from "../components/site/Safety";
import ApiDocs from "../components/site/ApiDocs";
import Footer from "../components/site/Footer";

export default function Landing() {
  return (
    <main className="relative z-10 bg-lux-bg text-lux-text">
      <Navbar />
      <Hero />
      <EditorialMarquee />
      <Models />
      <Benchmarks />
      <Capabilities />
      <Realms />
      <MythosTimeline />
      <Safety />
      <ApiDocs />
      <Footer />
    </main>
  );
}
