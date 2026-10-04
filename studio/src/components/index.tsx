import { useFrasbergClient } from "../hooks/useFrasbergClient";
import { useState } from "react";
import ZeroPointViewer from "./ZeroPointViewer";
import SubstrateViewer from "./SubstrateViewer";
import BedrockViewer from "./BedrockViewer";
import GroundTruthViewer from "./GroundTruthViewer";
import LawViewer from "./LawViewer";
import EnforcementViewer from "./EnforcementViewer";
import IntegrityViewer from "./IntegrityViewer";
import CoherenceViewer from "./CoherenceViewer";
import SyncViewer from "./SyncViewer";
import RhythmViewer from "./RhythmViewer";
import FlowViewer from "./FlowViewer";
import CirculationViewer from "./CirculationViewer";

export { ZeroPointViewer, SubstrateViewer, BedrockViewer, GroundTruthViewer, LawViewer, EnforcementViewer, IntegrityViewer, CoherenceViewer, SyncViewer, RhythmViewer, FlowViewer, CirculationViewer };

export default function WorldGraphPanel() {
  const client = useFrasbergClient();
  const [result, setResult] = useState(null);

  async function ping() {
    const res = await client.request("/v1/worldgraph", { ping: true });
    setResult(res);
  }

  return (
    <div>
      <button onClick={ping}>Ping WorldGraph</button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

export function JobLifecycle({ job }) {
  return (
    <div>
      <h3>Job Lifecycle</h3>
      <ul>
        <li>Queued: {job.queued ? "✔" : "—"}</li>
        <li>Running: {job.running ? "✔" : "—"}</li>
        <li>Completed: {job.completed ? "✔" : "—"}</li>
        <li>Failed: {job.failed ? "✔" : "—"}</li>
      </ul>
    </div>
  );
}

export function DiagnosticsPanel({ diagnostics }) {
  return (
    <div>
      <h3>Diagnostics</h3>
      <pre>{JSON.stringify(diagnostics, null, 2)}</pre>
    </div>
  );
}

export function ContinuityPanel({ continuity }) {
  return (
    <div>
      <h3>Continuity</h3>
      <pre>{JSON.stringify(continuity, null, 2)}</pre>
    </div>
  );
}

export function PolicyPanel({ policy }) {
  return (
    <div>
      <h3>Policy</h3>
      <pre>{JSON.stringify(policy, null, 2)}</pre>
    </div>
  );
}

export function RegionStatus({ regions }) {
  return (
    <div>
      <h3>Regions</h3>
      <ul>
        {regions.map(r => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

export function AssetViewer({ asset }) {
  if (!asset) return null;

  const isImage = asset.endsWith(".png") || asset.endsWith(".jpg") || asset.endsWith(".jpeg");
  const isAudio = asset.endsWith(".mp3") || asset.endsWith(".wav");
  const isVideo = asset.endsWith(".mp4") || asset.endsWith(".webm");

  return (
    <div>
      {isImage && <img src={asset} style={{ maxWidth: "100%" }} />}
      {isAudio && <audio controls src={asset} />}
      {isVideo && <video controls src={asset} style={{ maxWidth: "100%" }} />}
    </div>
  );
}

export function SharePanel({ asset, shortlink, embed }) {
  return (
    <div>
      <h3>Share</h3>

      <div>
        <strong>Direct Link:</strong>
        <input value={asset} readOnly />
      </div>

      <div>
        <strong>Short Link:</strong>
        <input value={shortlink} readOnly />
      </div>

      <div>
        <strong>Embed Card:</strong>
        <pre>{JSON.stringify(embed, null, 2)}</pre>
      </div>
    </div>
  );
}

export function IdentityGraph() {
  const client = useFrasbergClient();
  const [graph, setGraph] = useState(null);

  import { useEffect } from "react";
  useEffect(() => {
    client.request("/v1/worldgraph", { identity: true }).then(res => {
      setGraph(res.payload.identity);
    });
  }, []);

  return (
    <div>
      <h3>Identity Graph</h3>
      <pre>{JSON.stringify(graph, null, 2)}</pre>
    </div>
  );
}

export function ContinuityTimeline() {
  const client = useFrasbergClient();
  const [events, setEvents] = useState([]);

  import { useEffect } from "react";
  useEffect(() => {
    client.request("/v1/continuity", {}).then(res => {
      setEvents(res.continuity || res.payload?.continuity || []);
    });
  }, []);

  return (
    <div>
      <h3>Continuity Timeline</h3>
      <ul>
        {events.map(e => (
          <li key={e.jobId}>
            [{new Date(e.createdAt).toLocaleString()}] {e.type} → {e.asset}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DiagnosticsTimeline() {
  const client = useFrasbergClient();
  const [events, setEvents] = useState([]);

  import { useEffect } from "react";
  useEffect(() => {
    client.request("/v1/diagnostics", {}).then(res => {
      setEvents(res.payload.diagnostics || []);
    });
  }, []);

  return (
    <div>
      <h3>Diagnostics Timeline</h3>
      <ul>
        {events.map(e => (
          <li key={e.timestamp}>
            [{new Date(e.timestamp).toLocaleString()}] {e.stage} — {e.latency ? `${e.latency}ms` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PolicyViewer() {
  const client = useFrasbergClient();
  const [policy, setPolicy] = useState(null);

  import { useEffect } from "react";
  useEffect(() => {
    client.request("/v1/policy", {}).then(res => {
      setPolicy(res.payload.policy);
    });
  }, []);

  return (
    <div>
      <h3>Policy</h3>
      <pre>{JSON.stringify(policy, null, 2)}</pre>
    </div>
  );
}

export function GovernanceViewer() {
  const client = useFrasbergClient();
  const [gov, setGov] = useState(null);

  import { useEffect } from "react";
  useEffect(() => {
    client.request("/v1/governance", {}).then(res => {
      setGov(res.payload.governance);
    });
  }, []);

  return (
    <div>
      <h3>Governance</h3>
      <pre>{JSON.stringify(gov, null, 2)}</pre>
    </div>
  );
}
