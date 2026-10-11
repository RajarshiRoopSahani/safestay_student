// Only allow redirects to pages inside this website.
export function safeRedirect(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/";
}
