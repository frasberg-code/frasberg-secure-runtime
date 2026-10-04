import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function EnforcementViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.request("/v1/enforcement", {
      input: "hello enforcement"
    }).then((res: any) => {
      setResult(res.payload);
      setLoading(false);
    }).catch((err: any) => {
      console.error("Enforcement error:", err);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div>Loading Enforcement...</div>;

  return (
    <div>
      <h3>Enforcement Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
