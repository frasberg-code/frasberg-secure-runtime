import { prisma } from "./db";

export const CaseService = {
  create: async (data: any) => {
    return prisma.case.create({
      data: {
        title: data.title,
        status: data.status || "OPEN",
      },
    });
  },

  get: async (id: string) => {
    return prisma.case.findUnique({
      where: { id },
      include: { evidence: true, events: true },
    });
  },

  getTimeline: async (caseId: string) => {
    return prisma.caseEvent.findMany({
      where: { caseId },
      orderBy: { timestamp: "asc" },
    });
  },

  addEvent: async (caseId: string, event: any) => {
    return prisma.caseEvent.create({
      data: {
        caseId,
        type: event.type,
        payload: event.payload,
      },
    });
  },
};
