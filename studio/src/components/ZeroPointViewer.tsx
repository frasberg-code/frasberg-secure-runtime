import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function ZeroPointViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.request("/v1/zeropoint", {
      input: "hello zero"
    }).then((res: any) => {
      setResult(res.payload);
      setLoading(false);
    }).catch((err: any) => {
      console.error("ZeroPoint error:", err);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div>Loading ZeroPoint...</div>;

  return (
    <div>
      <h3>ZeroPoint Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
