import { prisma } from "./db";

export const LawService = {
  getStatute: async (id: string) => {
    return prisma.statute.findUnique({ where: { id } });
  },

  getStatutes: async (filters?: any) => {
    return prisma.statute.findMany(filters);
  },

  getPrecedent: async (id: string) => {
    return prisma.precedent.findUnique({ where: { id } });
  },

  getPrecedents: async (filters?: any) => {
    return prisma.precedent.findMany(filters);
  },

  generateLawMap: async (data: any) => {
    const statutes = await prisma.statute.findMany({
      where: { region: data.region },
    });
    const precedents = await prisma.precedent.findMany({
      where: { region: data.region },
    });
    return {
      caseId: data.caseId,
      statutes,
      precedents,
      createdAt: new Date(),
    };
  },
};
