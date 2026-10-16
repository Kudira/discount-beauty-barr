// Server-only. Saves an order that carries a processing_fee. If the database
// has not had supabase-processing-fee.sql run yet, the column does not exist;
// in that case save the order without it (the total already includes the fee)
// so checkout keeps working instead of failing.
export async function insertOrderWithFee(db: any, row: Record<string, any>) {
  let res = await db.from('orders').insert(row).select('id, order_number').single()
  if (res.error && /processing_fee/i.test(String(res.error.message ?? ''))) {
    const { processing_fee: _omit, ...rest } = row
    console.warn('[orders] processing_fee column missing, run supabase-processing-fee.sql')
    res = await db.from('orders').insert(rest).select('id, order_number').single()
  }
  return res
}
