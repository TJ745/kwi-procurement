import "server-only";

import { prisma } from "@/lib/prisma";

export const NOTIFICATION_PAGE_SIZE = 15;

/** Latest notifications and the unread count for one user. */
export async function getNotificationFeed(userId: string) {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: NOTIFICATION_PAGE_SIZE,
      select: { id: true, title: true, body: true, href: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return {
    unread,
    items: items.map((item) => ({
      ...item,
      readAt: item.readAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export type NotificationFeed = Awaited<ReturnType<typeof getNotificationFeed>>;
