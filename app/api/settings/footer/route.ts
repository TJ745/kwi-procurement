import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/session";

/** Serves the print footer image to signed-in users. */
export async function GET() {
  const context = await getAuthContext();
  if (!context) {
    return new Response("Unauthorized", { status: 401 });
  }

  const settings = await prisma.appSettings.findUnique({
    where: { id: 1 },
    select: { printFooter: true, printFooterType: true },
  });
  if (!settings?.printFooter || !settings.printFooterType) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(Buffer.from(settings.printFooter), {
    headers: {
      "Content-Type": settings.printFooterType,
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
