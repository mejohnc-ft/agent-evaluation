import { isAuthorizedCron } from "@/lib/retention";
import { purgeExpired } from "@/lib/store/maintenance";

// Daily Vercel Cron (vercel.json). Deletes rows past their retention period (D15); logs counts only.
export async function GET(req: Request) {
  if (!isAuthorizedCron(req.headers.get("authorization"), process.env.CRON_SECRET)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const deleted = await purgeExpired(new Date());
    console.log("retention purge", deleted);
    return Response.json({ deleted });
  } catch (error) {
    console.error("retention purge failed", error instanceof Error ? error.message : error);
    return Response.json({ error: "purge failed" }, { status: 500 });
  }
}
