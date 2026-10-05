import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function BlueprintViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.request("/v1/blueprint", {
      input: "hello blueprint"
    }).then((res: any) => {
      setResult(res.payload);
      setLoading(false);
    }).catch((err: any) => {
      console.error("Blueprint error:", err);
      setLoading(false);
    });
  }, [client]);

  if (loading) return <div>Loading Blueprint...</div>;

  return (
    <div>
      <h3>Blueprint Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
