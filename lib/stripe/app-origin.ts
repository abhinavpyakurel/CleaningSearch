export function getAppOrigin(request?: Request): string {
  if (request) {
    const origin = request.headers.get("origin");
    if (origin) {
      return origin;
    }
  }

  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
