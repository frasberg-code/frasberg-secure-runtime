import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function LogicViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.request("/v1/logic", {
      input: "hello logic"
    }).then((res: any) => {
      setResult(res.payload);
      setLoading(false);
    }).catch((err: any) => {
      console.error("Logic error:", err);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div>Loading Logic...</div>;

  return (
    <div>
      <h3>Logic Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
