import { useJob } from "../hooks/useJob";
import { AssetViewer, SharePanel, ZeroPointViewer, SubstrateViewer, BedrockViewer, GroundTruthViewer, LawViewer, EnforcementViewer, IntegrityViewer, CoherenceViewer, SyncViewer, RhythmViewer, FlowViewer, CirculationViewer, ConduitViewer, ChannelViewer, PathViewer, RouteViewer, NavigationViewer, TravelViewer, MotionViewer, DynamicsViewer, ForceViewer, VectorViewer, FieldViewer, InfluenceViewer, InteractionViewer, ExchangeViewer } from "../components";
import { publish } from "../actions";
import { useState } from "react";
import ZeroPoint from "./ZeroPoint";
import Substrate from "./Substrate";
import Bedrock from "./Bedrock";
import GroundTruth from "./GroundTruth";
import Law from "./Law";
import Enforcement from "./Enforcement";
import Integrity from "./Integrity";
import Coherence from "./Coherence";
import Sync from "./Sync";
import Rhythm from "./Rhythm";
import Flow from "./Flow";
import Circulation from "./Circulation";
import Conduit from "./Conduit";
import Channel from "./Channel";
import Path from "./Path";
import Route from "./Route";
import Navigation from "./Navigation";
import Travel from "./Travel";
import Motion from "./Motion";
import Dynamics from "./Dynamics";
import Force from "./Force";
import Vector from "./Vector";
import Field from "./Field";
import Influence from "./Influence";
import Interaction from "./Interaction";
import Exchange from "./Exchange";

export default function RuntimeDashboard() {
  return (
    <div>
      <h1>Frasberg Runtime Dashboard</h1>
      <DiagnosticsPanel diagnostics={{}} />
      <ContinuityPanel continuity={{}} />
      <PolicyPanel policy={{}} />
      <RegionStatus regions={["us-west-2", "us-east-1", "eu-central-1"]} />
    </div>
  );
}

export default function Studio() {
  return (
    <div>
      <h1>Frasberg Studio</h1>
      <ActionPanel />
      <RuntimeDashboard />
    </div>
  );
}

export default function Jobs() {
  return (
    <div>
      <h1>Frasberg Studio — Jobs</h1>

      <JobOrchestrator type="music" payload={{ prompt: "lofi beat" }} />
      <JobOrchestrator type="video" payload={{ prompt: "cyberpunk city" }} />
      <JobOrchestrator type="image" payload={{ prompt: "sunset mountains" }} />
      <JobOrchestrator type="voice" payload={{ text: "Hello from Frasberg" }} />
      <JobOrchestrator type="tts" payload={{ text: "Welcome to Frasberg Studio" }} />
    </div>
  );
}

export default function Identity() {
  return (
    <div>
      <h1>Frasberg Identity Sync</h1>
      <IdentityGraph />
    </div>
  );
}

export default function Continuity() {
  return (
    <div>
      <h1>Frasberg Continuity</h1>
      <ContinuityTimeline />
    </div>
  );
}

export default function Policy() {
  return (
    <div>
      <h1>Frasberg Policy Engine</h1>
      <PolicyViewer />
    </div>
  );
}

export default function Diagnostics() {
  return (
    <div>
      <h1>Frasberg Diagnostics Engine</h1>
      <DiagnosticsTimeline />
    </div>
  );
}

export default function Governance() {
  return (
    <div>
      <h1>Frasberg Governance Engine</h1>
      <GovernanceViewer />
    </div>
  );
}

export default function PublicAsset({ id }) {
  const [meta, setMeta] = useState(null);

  useState(() => {
    fetch(`/public/asset/${id}`)
      .then(r => r.json())
      .then(setMeta);
  }, [id]);

  if (!meta) return null;

  return (
    <div>
      <h1>Frasberg Asset</h1>
      <img src={meta.asset} style={{ maxWidth: "100%" }} />
      <pre>{JSON.stringify(meta, null, 2)}</pre>
    </div>
  );
}

function JobOrchestrator({ type, payload }) {
  const job = useJob(type, payload);

  return (
    <div>
      <button onClick={job.run}>Start {type} Job</button>

      <h3>Status: {job.status}</h3>

      {job.result && (
        <AssetViewer asset={job.result.asset} />
      )}
    </div>
  );
}

function ActionPanel() {
  const [result, setResult] = useState(null);

  return (
    <div>
      <h2>Frasberg Studio Actions</h2>
      <button onClick={() => run(generateMusic, "lofi beat")}>Generate Music</button>
      <button onClick={() => run(generateVideo, "cyberpunk city")}>Generate Video</button>
      <button onClick={() => run(generateImage, "sunset mountains")}>Generate Image</button>
      <button onClick={() => run(generateVoice, "Hello from Frasberg")}>Generate Voice</button>
      <button onClick={() => run(synthesizeSpeech, "Welcome to Frasberg Studio")}>TTS</button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

export { ZeroPoint, Substrate, Bedrock, GroundTruth, Law, Enforcement, Integrity, Coherence, Sync, Rhythm, Flow, Circulation, Conduit, Channel, Path, Route, Navigation, Travel, Motion, Dynamics, Force, Vector, Field, Influence, Interaction, Exchange };
