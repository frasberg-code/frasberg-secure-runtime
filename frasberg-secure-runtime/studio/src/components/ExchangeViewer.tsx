import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function ExchangeViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.request("/v1/exchange", {
      input: "hello exchange"
    }).then((res: any) => {
      setResult(res.payload);
      setLoading(false);
    }).catch((err: any) => {
      console.error("Exchange error:", err);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div>Loading Exchange...</div>;

  return (
    <div>
      <h3>Exchange Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
