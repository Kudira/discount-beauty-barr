import { NextResponse } from 'next/server'
import { requireManager, authErrorResponse } from '@/lib/auth/guards'
import { nextSkus } from '@/lib/sku'

// GET /api/admin/sku?brand=Dr.%20Rashel&count=3  ->  { skus: ['DR-0645', ...] }
export async function GET(request: Request) {
  try {
    await requireManager()
    const url = new URL(request.url)
    const count = Math.min(Math.max(parseInt(url.searchParams.get('count') ?? '1', 10) || 1, 1), 50)
    const skus = await nextSkus(url.searchParams.get('brand'), count)
    return NextResponse.json({ skus })
  } catch (err: any) {
    return authErrorResponse(err) ?? NextResponse.json({ error: err.message }, { status: 500 })
  }
}
