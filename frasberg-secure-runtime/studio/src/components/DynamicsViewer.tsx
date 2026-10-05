import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function DynamicsViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.request("/v1/dynamics", {
      input: "hello dynamics"
    }).then((res: any) => {
      setResult(res.payload);
      setLoading(false);
    }).catch((err: any) => {
      console.error("Dynamics error:", err);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div>Loading Dynamics...</div>;

  return (
    <div>
      <h3>Dynamics Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
