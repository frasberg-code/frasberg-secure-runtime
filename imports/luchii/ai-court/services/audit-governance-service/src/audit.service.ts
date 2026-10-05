import { prisma } from "./db";

export const AuditService = {
  getCaseLogs: async (caseId: string) => {
    return prisma.auditEvent.findMany({
      where: { caseId },
      orderBy: { timestamp: "desc" },
    });
  },

  logEvent: async (data: any) => {
    return prisma.auditEvent.create({
      data: {
        caseId: data.caseId || null,
        actor: data.actor,
        action: data.action,
        payload: data.payload || {},
      },
    });
  },

  getAllLogs: async (filters?: any) => {
    return prisma.auditEvent.findMany(filters);
  },

  validateAuditChain: async (caseId: string) => {
    const logs = await prisma.auditEvent.findMany({
      where: { caseId },
      orderBy: { timestamp: "asc" },
    });

    return {
      caseId,
      eventCount: logs.length,
      isComplete: logs.length > 0,
      firstEvent: logs[0]?.timestamp,
      lastEvent: logs[logs.length - 1]?.timestamp,
    };
  },
};
