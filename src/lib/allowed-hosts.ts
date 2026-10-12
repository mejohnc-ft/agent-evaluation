// The only hosts the bot may link to or cite as a source (D1).
export const ALLOWED_HOSTS = new Set(["cadre.ai", "portal.gocadre.ai"]);

export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}
