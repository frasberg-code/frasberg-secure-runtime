import { Frasberg } from "../../../sdk/typescript";

export function useFrasbergClient() {
  const client = new Frasberg({
    key: import.meta.env.VITE_FRASBERG_KEY,
    owner: import.meta.env.VITE_FRASBERG_OWNER,
    regions: ["us-west-2", "us-east-1", "eu-central-1"]
  });

  return client;
}
