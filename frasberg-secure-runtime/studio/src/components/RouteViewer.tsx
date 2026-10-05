import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function RouteViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.request("/v1/route", {
      input: "hello route"
    }).then((res: any) => {
      setResult(res.payload);
      setLoading(false);
    }).catch((err: any) => {
      console.error("Route error:", err);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div>Loading Route...</div>;

  return (
    <div>
      <h3>Route Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
