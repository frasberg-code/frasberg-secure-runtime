export interface ChainEntry {
  id: string;
  evidenceId: string;
  actor: string;
  action: string;
  timestamp: Date;
}

export const ChainActions = {
  COLLECTED: "collected",
  TRANSFERRED: "transferred",
  ANALYZED: "analyzed",
  SEALED: "sealed",
  VERIFIED: "verified",
} as const;

export const validateChain = (chain: ChainEntry[]): boolean => {
  return chain.length > 0 && chain.every((e) => e.actor && e.action);
};
