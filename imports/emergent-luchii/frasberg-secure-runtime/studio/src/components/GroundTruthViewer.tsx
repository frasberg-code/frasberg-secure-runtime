import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function GroundTruthViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.request("/v1/groundtruth", {
      input: "hello truth"
    }).then((res: any) => {
      setResult(res.payload);
      setLoading(false);
    }).catch((err: any) => {
      console.error("GroundTruth error:", err);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div>Loading GroundTruth...</div>;

  return (
    <div>
      <h3>GroundTruth Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
