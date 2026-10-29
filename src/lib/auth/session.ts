import { prisma } from "@/lib/db/prisma";
import { getSessionUserId } from "@/lib/auth/server";

export interface CurrentUser {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  emailVerified: boolean;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      emailVerified: true,
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
  };
}