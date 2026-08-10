import { createFrasbergClient } from "../src";

async function main() {
  const client = createFrasbergClient();

  const result = await client.generateVideo(
    "A slow pan across a futuristic city skyline."
  );

  console.log("Video Result:", result);
}

main().catch(console.error);
