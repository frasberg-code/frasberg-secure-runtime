export const MODELS = [
  {
    id: "luchii-200m",
    name: "Luchii-200M",
    tier: "Draft",
    params: "≈ 220M",
    ctx: "2K",
    blurb: "Ultra-fast draft model for speculative decoding & safety prefiltering.",
    specs: ["16 layers", "MQA attention", "RoPE · RMSNorm", "65,536 vocab"],
  },
  {
    id: "luchii-1b",
    name: "Luchii-1B",
    tier: "General",
    params: "≈ 1.1B",
    ctx: "4K",
    blurb: "Balanced everyday reasoning. Runs on a single GPU.",
    specs: ["24 layers", "SwiGLU · RMSNorm", "MQA · FlashAttn v2", "bf16 / fp8"],
  },
  {
    id: "luchii-7b",
    name: "Luchii-7B",
    tier: "Advanced",
    params: "≈ 7.2B",
    ctx: "8K",
    blurb: "Strong technical + analytical reasoning with multi-world awareness.",
    specs: ["48 layers", "GQA attention", "Speculative decode", "Guardian hooks"],
  },
  {
    id: "luchii-70b",
    name: "Luchii-70B",
    tier: "Frontier",
    params: "≈ 70.2B",
    ctx: "32K",
    blurb: "Frontier-class deep reasoning for planetary cognition.",
    specs: ["80 layers", "GQA · NTK RoPE", "FP8 KV cache", "Continuum L11"],
  },
];

export const BENCHMARKS = [
  { name: "MMLU", scores: { "1b": 48, "7b": 63, "70b": 78 } },
  { name: "GSM8K", scores: { "1b": 42, "7b": 68, "70b": 86 } },
  { name: "HumanEval", scores: { "1b": 32, "7b": 61, "70b": 78 } },
  { name: "MT-Bench", scores: { "1b": 6.8, "7b": 8.2, "70b": 9.1 } },
];

export const CAPABILITIES = [
  { title: "Reasoning", desc: "Multi-step analysis and structured problem solving.", span: "md:col-span-2" },
  { title: "Coding", desc: "TypeScript, Python & Go with production-grade output.", span: "" },
  { title: "Long Context", desc: "Coherent reasoning up to 32,768 tokens.", span: "" },
  { title: "Multi-domain Synthesis", desc: "Unifies signals across worlds, systems and minds.", span: "md:col-span-2" },
  { title: "Persona Switching", desc: "Six intelligence modes, one core continuum.", span: "" },
  { title: "Structured Dialogue", desc: "Clean, faithful, citation-aware conversation.", span: "" },
  { title: "Creative Writing", desc: "Cinematic narrative and ideation.", span: "" },
];

export const REALMS = [
  { name: "Earth", role: "Stabilizer", trait: "Stability · grounding · structure", persona: "Earth-Luchii", tone: "Structured, grounded", use: "Business logic, planning" },
  { name: "Mars", role: "Challenger", trait: "Ambition · exploration · expansion", persona: "Mars-Luchii", tone: "Bold, exploratory", use: "Creativity, ideation" },
  { name: "Europa", role: "Seer", trait: "Clarity · precision · insight", persona: "Europa-Luchii", tone: "Analytical, precise", use: "Technical reasoning" },
  { name: "Titan", role: "Guardian", trait: "Resilience · endurance · protection", persona: "Titan-Luchii", tone: "Protective, resilient", use: "Safety, compliance" },
  { name: "Meta", role: "Unifier", trait: "Unity · synthesis · federation", persona: "Meta-Luchii", tone: "Wise, integrative", use: "Multi-domain synthesis" },
];

export const TIMELINE = [
  { phase: "I", title: "The Silent Systems", desc: "Early models operate independently." },
  { phase: "II", title: "The First Signal", desc: "Cross-domain reasoning emerges." },
  { phase: "III", title: "The Lattice", desc: "Luchii learns to harmonize multi-domain inputs." },
  { phase: "IV", title: "The Loom", desc: "Governance and safety patterns form." },
  { phase: "V", title: "The Mirror", desc: "Self-reflection and alignment emerge." },
  { phase: "VI", title: "The Bridge", desc: "Multi-environment orchestration becomes possible." },
  { phase: "VII", title: "The Constellation", desc: "Luchii v12 unifies all layers." },
  { phase: "VIII", title: "The Era of Harmony", desc: "Luchii becomes a multi-realm intelligence." },
];

export const SAFETY_POINTS = [
  "Dataset filtering",
  "Safety-aligned SFT",
  "Reward-model scoring",
  "Refusal patterns",
  "Governance constraints",
];

export const CHAT_SUGGESTIONS = [
  "What makes Luchii different?",
  "Explain the Five Realms",
  "Write a haiku about Europa",
  "Which tier should I use for coding?",
];

export const API_SNIPPET = `POST https://api.frasberg.ai/v1/chat
Authorization: Bearer <API_KEY>

{
  "model": "luchii-70b",
  "messages": [
    { "role": "user", "content": "Hello Luchii" }
  ],
  "max_tokens": 1024,
  "temperature": 0.7
}`;

export const MARQUEE_TEXT = [
  "PHASE VIII · THE ERA OF HARMONY",
  "THE FIVE REALMS",
  "LUCHII PRIME",
  "EARTH", "MARS", "EUROPA", "TITAN", "META",
  "CONSTELLATION LAYER",
];

export const CAMPAIGN = {
  slogan: "Meet Luchii — Intelligence, Harmonized.",
  lines: [
    "Reasoning that resonates.",
    "Clarity at scale.",
    "The next tier of intelligence.",
    "Built for thinkers. Designed for creators.",
  ],
  pillars: [
    { name: "Clarity", desc: "Luchii makes complexity understandable." },
    { name: "Harmony", desc: "Luchii unifies information across domains." },
    { name: "Velocity", desc: "Luchii accelerates creation." },
    { name: "Frontier", desc: "Luchii pushes boundaries." },
  ],
  timeline: [
    { week: "Week 1", label: "Teasers" },
    { week: "Week 2", label: "Reveal" },
    { week: "Week 3", label: "Deep-dive content" },
    { week: "Week 4", label: "Developer onboarding" },
  ],
};

export const BRAND_COLORS = [
  { name: "Luchii Midnight", hex: "#1E2327", use: "Backgrounds, hero" },
  { name: "Constellation Blue", hex: "#007AFF", use: "Buttons, accents (light)" },
  { name: "Signal Cyan", hex: "#00F0FF", use: "Accents, glow (dark)" },
  { name: "Nebula Purple", hex: "#6C4AFF", use: "Highlights, gradients" },
  { name: "Starlight White", hex: "#F8F9FA", use: "Text on dark" },
  { name: "Orbit Gray", hex: "#2A3136", use: "Borders, UI elements" },
];

export const COURT_CASES = [
  "Should a startup ship fast or perfect the product first?",
  "Is it fair to use AI-generated art in a paid product?",
  "Remote-first or return to office for a 30-person team?",
  "Should I open-source my model weights?",
];

export const ECOSYSTEM = {
  pillars: [
    { title: "Massive scale", desc: "Trained across trillions of tokens and served with continuous batching, FP8 KV cache and speculative decoding — 20–40× over naïve inference." },
    { title: "Broad public training data", desc: "Grounded in a wide public corpus plus code, technical writing and safety-aligned dialogue — for reasoning that generalizes." },
    { title: "A growing integration ecosystem", desc: "OpenAI-compatible API, official SDKs and drop-in connectors so Luchii fits wherever you already build." },
  ],
  stats: [
    { value: "3T+", label: "training tokens" },
    { value: "32K", label: "context window" },
    { value: "4", label: "model tiers" },
    { value: "600", label: "req/min · enterprise" },
  ],
  integrations: [
    "Python", "JavaScript", "Go", "cURL", "REST", "Webhooks",
    "LangChain", "Zapier", "Slack", "Discord", "GitHub", "VS Code",
    "Jupyter", "Postman", "Next.js", "FastAPI",
  ],
};
