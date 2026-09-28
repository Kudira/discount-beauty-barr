// The address the customer is actually using right now, so Paystack sends
// them back to the same site (works on any Vercel or custom domain).
export function getSiteOrigin(request: Request): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (host) {
    const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
    const proto = request.headers.get('x-forwarded-proto')?.split(',')[0] ?? (isLocal ? 'http' : 'https')
    return `${proto}://${host}`
  }
  return process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
}
