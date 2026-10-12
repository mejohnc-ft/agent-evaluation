// The commit this deployment was built from. The G8 smoke workflow polls it to know the deploy is live.
export function GET() {
  return Response.json({ commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null });
}
