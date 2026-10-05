import { prisma } from "./db";

export const UserService = {
  create: async (data: any) => {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
      },
    });
  },

  get: async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      include: { roles: true },
    });
  },

  assignRole: async (userId: string, roleName: string) => {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error("Role not found");
    }

    return prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: { id: role.id },
        },
      },
    });
  },

  getRoles: async () => {
    return prisma.role.findMany();
  },
};
