// Small in-memory limiter. On a serverless host each instance keeps its own
// counts, so this slows down abuse rather than stopping a determined attacker;
// use Vercel's firewall rate limiting for a hard limit.
const hits = new Map<string, number[]>()

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= windowMs)) hits.delete(k)
  }
  return true
}

export function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  return (fwd?.split(',')[0] ?? request.headers.get('x-real-ip') ?? 'unknown').trim()
}
