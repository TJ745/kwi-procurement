import { getNotificationFeed } from "@/lib/data/notifications";
import { getAuthContext } from "@/lib/session";

/** The signed-in user's notification feed, polled by the header bell. */
export async function GET() {
  const context = await getAuthContext();
  if (!context || context.user.mustChangePassword) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const feed = await getNotificationFeed(context.user.id);
  return Response.json(feed, { headers: { "Cache-Control": "private, no-store" } });
}
