import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function BehaviorViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState(null);

  useEffect(() => {
    client.request("/v1/behavior", {
      input: "hello behavior"
    }).then(res => {
      setResult(res.payload);
    });
  }, []);

  return (
    <div>
      <h3>Behavior Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
