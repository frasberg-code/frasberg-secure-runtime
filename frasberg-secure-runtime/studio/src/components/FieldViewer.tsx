import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function FieldViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.request("/v1/field", {
      input: "hello field"
    }).then((res: any) => {
      setResult(res.payload);
      setLoading(false);
    }).catch((err: any) => {
      console.error("Field error:", err);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div>Loading Field...</div>;

  return (
    <div>
      <h3>Field Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
