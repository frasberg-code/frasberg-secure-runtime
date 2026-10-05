import { useEffect, useState } from "react";
import { useFrasbergClient } from "../hooks/useFrasbergClient";

export default function StructureViewer() {
  const client = useFrasbergClient();
  const [result, setResult] = useState(null);

  useEffect(() => {
    client.request("/v1/structure", {
      input: "hello structure"
    }).then(res => {
      setResult(res.payload);
    });
  }, []);

  return (
    <div>
      <h3>Structure Engine</h3>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
