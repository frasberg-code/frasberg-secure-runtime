import { createFrasbergClient } from "../src";

async function main() {
  const client = createFrasbergClient();

  const response = await client.generateText(
    "Explain the concept of resonance in simple terms."
  );

  console.log("Text Response:", response);
}

main().catch(console.error);
