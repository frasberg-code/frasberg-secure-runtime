import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function PatternViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState(null);

  useEffect(() => {
    client.request("/v1/pattern", {
      input: "hello pattern"
    }).then(res => {
      setResult(res.payload);
    });
  }, []);

  return (
    <div>
      <h3>Pattern Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
