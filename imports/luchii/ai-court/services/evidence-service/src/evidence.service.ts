import { prisma } from "./db";

export const EvidenceService = {
  create: async (data: any) => {
    return prisma.evidence.create({
      data: {
        caseId: data.caseId,
        type: data.type,
        metadata: data.metadata || {},
        storagePath: data.storagePath,
      },
    });
  },

  get: async (id: string) => {
    return prisma.evidence.findUnique({
      where: { id },
      include: { chain: true },
    });
  },

  getByCaseId: async (caseId: string) => {
    return prisma.evidence.findMany({
      where: { caseId },
    });
  },

  addChainEntry: async (evidenceId: string, entry: any) => {
    return prisma.chainOfCustody.create({
      data: {
        evidenceId,
        actor: entry.actor,
        action: entry.action,
      },
    });
  },

  getChain: async (evidenceId: string) => {
    return prisma.chainOfCustody.findMany({
      where: { evidenceId },
      orderBy: { timestamp: "asc" },
    });
  },
};
