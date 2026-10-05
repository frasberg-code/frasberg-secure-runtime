import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function ConsciousnessViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.request("/v1/consciousness", {
      input: "hello consciousness"
    }).then((res: any) => {
      setResult(res.payload);
      setLoading(false);
    }).catch((err: any) => {
      console.error("Consciousness error:", err);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div>Loading Consciousness...</div>;

  return (
    <div>
      <h3>Consciousness Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
