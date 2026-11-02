"use server";

import { z } from "zod";

import { runMutation } from "@/lib/actions/run-mutation";
import { prisma } from "@/lib/prisma";
import { recordIdSchema } from "@/lib/validation/master-data";

// Both actions only ever touch the signed-in user's own notifications.

export async function markNotificationRead(id: string) {
  return runMutation({
    requirement: "signed_in",
    schema: z.object({ id: recordIdSchema }),
    input: { id },
    success: "Marked as read.",
    refreshPage: false,
    run: ({ id }, { user }) =>
      prisma.notification.updateMany({
        where: { id, userId: user.id, readAt: null },
        data: { readAt: new Date() },
      }),
  });
}

export async function markAllNotificationsRead() {
  return runMutation({
    requirement: "signed_in",
    schema: z.object({}),
    input: {},
    success: "All notifications marked as read.",
    refreshPage: false,
    run: (_data, { user }) =>
      prisma.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      }),
  });
}
