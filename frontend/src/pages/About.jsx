import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Moon, Sun, ArrowLeft } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import Starfield from "../components/site/Starfield";
import Footer from "../components/site/Footer";
import Seo from "../components/site/Seo";
import Reveal, { Overline } from "../components/site/Reveal";

const INTRO = [
  "Frasberg, Inc. is an American multinational technology company dedicated to advancing the future of artificial intelligence, intelligent computing, and digital transformation. Founded with the vision of making advanced technology accessible, practical, and beneficial for everyone, Frasberg develops innovative AI platforms, intelligent software, cloud technologies, and enterprise solutions that help organizations, governments, developers, creators, researchers, and individuals solve complex problems and unlock new opportunities.",
  "At Frasberg, we believe that artificial intelligence is more than a technological breakthrough—it is a transformative force that is redefining how people communicate, create, learn, work, and innovate. Our mission is to build intelligent systems that augment human capabilities, improve productivity, accelerate scientific discovery, and enable businesses of every size to thrive in an increasingly digital world.",
  "Our portfolio is centered around Frasberg, our flagship artificial intelligence ecosystem, and Luchii AI Models, our family of advanced multimodal foundation models designed to power the next generation of intelligent applications. Together, these technologies provide the foundation for conversational AI, enterprise automation, software development, data intelligence, creative content generation, research assistance, intelligent agents, decision support systems, and industry-specific AI solutions.",
];

const LUCHII_APPS = [
  "Conversational AI assistants",
  "Enterprise knowledge management",
  "Software engineering assistance",
  "Research and scientific analysis",
  "Content generation",
  "Business intelligence",
  "Customer support automation",
  "Financial analysis",
  "Educational technologies",
  "Healthcare information systems",
  "Legal document analysis",
  "Marketing and communications",
  "Translation and multilingual understanding",
  "Image and document interpretation",
  "Intelligent workflow automation",
];

const SECTIONS = [
  {
    title: "Our Vision",
    paragraphs: [
      "Our vision is to become one of the world's leading innovators in artificial intelligence by creating technologies that empower humanity, accelerate innovation, and contribute to sustainable economic growth. We envision a future where AI works alongside people—not as a replacement for human creativity and expertise, but as a powerful partner that enhances productivity, expands knowledge, and enables individuals and organizations to accomplish more than ever before.",
      "Frasberg is committed to shaping a future in which intelligent technology is trusted, secure, transparent, inclusive, and designed to benefit society. We strive to build AI systems that are useful, reliable, and aligned with the needs of businesses, institutions, and communities across the globe.",
    ],
  },
  {
    title: "Our Mission",
    paragraphs: [
      "Our mission is to develop world-class artificial intelligence technologies that solve real-world challenges through innovation, research, and responsible engineering. We aim to provide organizations with scalable AI platforms that improve operational efficiency, accelerate digital transformation, strengthen decision-making, and foster continuous innovation.",
      "By combining advanced machine learning, cloud computing, data science, software engineering, and human-centered design, Frasberg creates intelligent technologies that help customers adapt to rapidly changing markets while delivering measurable value.",
    ],
  },
  {
    title: "Frasberg",
    paragraphs: [
      "Frasberg is the company's flagship artificial intelligence platform designed to deliver intelligent, scalable, and secure AI capabilities for businesses, developers, educational institutions, governments, and individuals.",
      "The platform integrates state-of-the-art technologies across natural language processing, computer vision, speech understanding, reasoning, intelligent search, workflow automation, predictive analytics, and generative AI. It enables organizations to deploy AI-powered applications that automate repetitive tasks, streamline operations, improve customer experiences, and generate valuable insights from complex information.",
      "Frasberg is designed with flexibility in mind, supporting cloud-native deployments, enterprise integrations, APIs, developer tools, and customizable AI solutions that adapt to diverse business needs.",
    ],
  },
  {
    title: "Luchii AI Models",
    paragraphs: [
      "Luchii AI Models represent Frasberg's family of proprietary multimodal foundation models developed to understand and generate language, analyze images, process documents, reason across complex information, assist with coding, and support advanced decision-making.",
      "These models are engineered to deliver high performance across a broad range of applications, including:",
    ],
    list: LUCHII_APPS,
    after: [
      "Luchii AI Models are continuously refined through ongoing research, engineering improvements, and responsible AI practices to enhance quality, reliability, scalability, and safety.",
    ],
  },
  {
    title: "Innovation Through Research",
    paragraphs: [
      "Innovation is the driving force behind everything we do. Frasberg invests in research across machine learning, large language models, multimodal intelligence, reinforcement learning, reasoning systems, agentic AI, robotics, edge computing, distributed systems, cloud infrastructure, cybersecurity, and responsible AI.",
      "Our research teams work to advance the state of artificial intelligence while translating scientific breakthroughs into practical technologies that deliver measurable business value. We encourage interdisciplinary collaboration between researchers, engineers, designers, and industry experts to solve complex challenges with creativity and technical excellence.",
    ],
  },
  {
    title: "Enterprise Solutions",
    paragraphs: [
      "Organizations today require intelligent technologies that integrate seamlessly into existing business operations. Frasberg develops enterprise-grade AI platforms that enable organizations to modernize workflows, improve productivity, reduce operational costs, and accelerate innovation.",
      "Our enterprise capabilities include intelligent document processing, predictive analytics, AI-powered search, customer service automation, digital assistants, workflow orchestration, knowledge management, software development tools, and decision-support systems. These solutions are designed to scale from startups to global enterprises while maintaining high standards for security, performance, and reliability.",
    ],
  },
  {
    title: "Cloud and Infrastructure",
    paragraphs: [
      "Modern AI requires scalable computing infrastructure. Frasberg develops cloud-based platforms that enable organizations to build, deploy, and manage AI applications efficiently. Our cloud technologies support secure collaboration, data processing, model deployment, API management, analytics, and enterprise integration while emphasizing reliability, scalability, and operational efficiency.",
    ],
  },
  {
    title: "Software Engineering",
    paragraphs: [
      "Frasberg builds modern software platforms using contemporary engineering practices that emphasize quality, performance, maintainability, and security. Our engineering teams create enterprise applications, cloud-native systems, AI-powered developer tools, APIs, mobile applications, and web platforms that enable organizations to innovate faster while reducing operational complexity.",
    ],
  },
  {
    title: "Artificial Intelligence for Every Industry",
    paragraphs: [
      "Artificial intelligence has the potential to transform virtually every sector of the global economy. Frasberg develops solutions tailored to industries including healthcare, education, finance, manufacturing, retail, logistics, telecommunications, energy, agriculture, transportation, media, government, and professional services.",
      "Our technologies help organizations improve operational efficiency, enhance customer engagement, optimize resource allocation, strengthen decision-making, and unlock new business opportunities through intelligent automation and advanced analytics.",
    ],
  },
  {
    title: "Responsible AI",
    paragraphs: [
      "Frasberg believes that responsible innovation is essential to the long-term success of artificial intelligence. We are committed to developing AI technologies with consideration for safety, fairness, transparency, privacy, accountability, and security.",
      "Responsible AI influences every stage of our development process—from research and model design to deployment and continuous improvement. We work to reduce harmful biases, improve model reliability, protect sensitive information, and provide organizations with tools that support responsible implementation and governance.",
    ],
  },
  {
    title: "Security and Privacy",
    paragraphs: [
      "Trust is fundamental to digital innovation. Frasberg designs technologies with security and privacy in mind, incorporating modern engineering practices intended to help protect data, support regulatory compliance, and strengthen operational resilience. We recognize that organizations rely on secure technology to manage critical information, and we strive to build platforms that support those needs.",
    ],
  },
  {
    title: "Developers and Innovation Ecosystem",
    paragraphs: [
      "Developers are central to technological progress. Frasberg provides APIs, software development tools, documentation, SDKs, and integration capabilities that help developers build intelligent applications efficiently. We aim to foster an ecosystem where startups, enterprises, researchers, and independent developers can innovate using our AI technologies.",
    ],
  },
  {
    title: "Education and Learning",
    paragraphs: [
      "Education is one of the most powerful applications of artificial intelligence. Frasberg supports intelligent tutoring, adaptive learning, multilingual education, personalized instruction, research assistance, and collaborative knowledge systems that help learners and educators achieve better outcomes.",
    ],
  },
  {
    title: "Sustainability",
    paragraphs: [
      "Frasberg recognizes the importance of sustainable innovation. We seek opportunities to improve operational efficiency, optimize computing resources where practical, and develop technologies that help organizations use digital infrastructure more effectively. We believe responsible technological progress includes thoughtful stewardship of resources and long-term value creation.",
    ],
  },
  {
    title: "Global Perspective",
    paragraphs: [
      "As a multinational technology company, Frasberg embraces collaboration across cultures, industries, and disciplines. We believe that diverse perspectives strengthen innovation and contribute to building technologies that serve people around the world. Our ambition is to create solutions that are globally relevant while remaining adaptable to regional needs and local innovation.",
    ],
  },
  {
    title: "Our Culture",
    paragraphs: [
      "Our culture is built on curiosity, integrity, collaboration, continuous learning, and excellence. We encourage our teams to challenge assumptions, pursue ambitious ideas, and develop technologies that make a meaningful difference. We believe innovation flourishes in an environment where diverse viewpoints are respected and where people are empowered to contribute their best work.",
    ],
  },
  {
    title: "Looking Ahead",
    paragraphs: [
      "Artificial intelligence is entering a new era defined by reasoning, multimodal understanding, autonomous systems, and human-AI collaboration. Frasberg is committed to helping shape that future by investing in research, engineering, and responsible innovation.",
      "We will continue expanding the capabilities of Frasberg and Luchii AI Models while developing new technologies that empower organizations to solve increasingly complex challenges. Our long-term focus is to build intelligent platforms that support scientific discovery, economic growth, education, healthcare, creativity, and sustainable development.",
      "As we move forward, our commitment remains clear: to develop trusted, innovative, and impactful technologies that help people and organizations achieve more. Through continuous innovation, global collaboration, and a dedication to excellence, Frasberg aims to contribute meaningfully to the future of artificial intelligence and the broader technology ecosystem.",
    ],
  },
];

export default function About() {
  const { theme, toggle } = useTheme();

  return (
    <main className="relative z-10 min-h-screen bg-lux-bg text-lux-text" data-testid="about-page">
      <Seo
        title="About Frasberg, Inc. — Advancing Artificial Intelligence"
        description="Frasberg, Inc. is an American multinational technology company advancing artificial intelligence, intelligent computing, and digital transformation through the Frasberg platform and Luchii AI Models."
      />
      <div className="pointer-events-none absolute inset-0 opacity-50"><Starfield /></div>

      <header className="glass sticky top-0 z-40 border-b border-lux-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5" data-testid="about-home-link">
            <ArrowLeft size={16} className="text-lux-text2" />
            <img src="/luchii-logo.webp" alt="Frasberg Luchii" className="h-8 w-8 rounded-full ring-1 ring-lux-accent/40" />
            <span className="font-display text-lg font-700 tracking-tight">Frasberg, Inc.</span>
          </Link>
          <button onClick={toggle} aria-label="Toggle theme" data-testid="about-theme-toggle"
            className="grid h-10 w-10 place-items-center rounded-full border border-lux-border transition-colors hover:border-lux-accent hover:text-lux-accent">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      <section className="relative mx-auto max-w-4xl px-5 pb-6 pt-20 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-6 flex items-center gap-4" data-testid="about-spin-logos">
            <img src="/frasberg-emblem.png" alt="Frasberg AI" className="h-14 w-14 rounded-full" />
            <img src="/luchii-logo.webp" alt="Luchii" className="h-14 w-14 rounded-full ring-1 ring-lux-accent/40" />
          </div>
          <Overline>About the company</Overline>
          <h1 className="mt-5 font-display text-4xl font-700 tracking-tighter sm:text-5xl lg:text-6xl">
            Frasberg, Inc.
          </h1>
          <div className="mt-8 space-y-5">
            {INTRO.map((p, i) => (
              <p key={i} className="text-base leading-relaxed text-lux-text2 sm:text-lg">{p}</p>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <div className="space-y-16">
          {SECTIONS.map((s, i) => (
            <Reveal key={s.title} delay={Math.min(i * 0.02, 0.1)}>
              <div data-testid={`about-section-${s.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
                <div className="flex items-baseline gap-4">
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-lux-accent">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="font-display text-2xl font-700 tracking-tight sm:text-3xl">{s.title}</h2>
                </div>
                <div className="mt-5 space-y-4 border-l border-lux-border pl-6">
                  {s.paragraphs.map((p, j) => (
                    <p key={j} className="text-sm leading-relaxed text-lux-text2 sm:text-base">{p}</p>
                  ))}
                  {s.list && (
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {s.list.map((item) => (
                        <span key={item} className="rounded-full border border-lux-border bg-lux-surface px-4 py-2 font-mono text-xs text-lux-text2 transition-colors duration-200 hover:border-lux-accent hover:text-lux-text">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                  {s.after && s.after.map((p, j) => (
                    <p key={`a${j}`} className="pt-2 text-sm leading-relaxed text-lux-text2 sm:text-base">{p}</p>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.05}>
          <div className="mt-20 rounded-2xl border border-lux-border bg-lux-surface p-10 text-center">
            <p className="mx-auto max-w-2xl font-display text-xl font-600 tracking-tight sm:text-2xl">
              Frasberg, Inc. is building intelligent technology for a smarter, more connected, and more innovative world.
            </p>
            <Link to="/dashboard" data-testid="about-cta"
              className="mt-8 inline-block rounded-full bg-lux-text px-7 py-3 text-sm font-500 text-lux-bg transition-transform duration-200 hover:-translate-y-0.5">
              Get API Key
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </main>
  );
}
