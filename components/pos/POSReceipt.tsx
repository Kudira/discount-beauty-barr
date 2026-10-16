'use client'

import { useEffect, useRef } from 'react'
import { AlertTriangle, Check, Printer, RotateCcw, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface ReceiptData {
  orderNumber: string
  items: { name: string; brand: string; variantName: string; price: number; quantity: number }[]
  subtotal: number
  discount: number
  processingFee?: number
  total: number
  payments: { method: string; amount: number }[]
  change: number
  cashierName: string
  branchId: string
  timestamp: Date
  customerName?: string
  notes?: string
  paymentReference?: string // Paystack reference for MoMo sales
  saveWarning?: string      // set when the sale didn't save cleanly
}

const BRANCH_NAMES: Record<string, string> = {
  'osu': 'Osu Branch · Oxford Street, Accra',
  'east-legon': 'East Legon · American House Jct, Accra',
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', card: 'Card', momo: 'Mobile Money',
  momo_mtn: 'MTN MoMo', momo_vod: 'Telecel Cash', momo_atl: 'AT Money',
  // older sales
  momo_vodafone: 'Vodafone Cash', momo_airteltigo: 'AirtelTigo',
}

// The POS58 driver prints 48mm wide. Everything is sized to that.
const PRINT_WIDTH_MM = 48

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function money(n: number): string {
  return `GHS ${n.toFixed(2)}`
}

function buildReceiptHTML(receipt: ReceiptData): string {
  const row = (left: string, right: string, cls = '') =>
    `<div class="row ${cls}"><span>${left}</span><span class="amt">${right}</span></div>`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt ${esc(receipt.orderNumber)}</title>
  <style>
    @page { size: ${PRINT_WIDTH_MM}mm auto; margin: 0; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${PRINT_WIDTH_MM}mm; }
    body { font-family: 'Courier New', Courier, monospace; font-size: 11px; line-height: 1.35; color: #000; padding: 1mm 1mm 4mm; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .store { font-size: 13px; font-weight: bold; }
    .small { font-size: 9.5px; }
    .rule { border-top: 1px dashed #000; margin: 2mm 0; }
    .row { display: flex; justify-content: space-between; gap: 2mm; }
    .row span:first-child { flex: 1; min-width: 0; overflow-wrap: anywhere; }
    .amt { white-space: nowrap; }
    .item { margin-bottom: 1.2mm; }
    .qty { padding-left: 2mm; }
    .total { font-size: 13px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="center store">DISCOUNT BEAUTY BARR</div>
  <div class="center small">${esc(BRANCH_NAMES[receipt.branchId] ?? receipt.branchId)}</div>
  <div class="rule"></div>
  <div>Receipt: ${esc(receipt.orderNumber)}</div>
  <div>${esc(receipt.timestamp.toLocaleString('en-GH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }))}</div>
  <div>Cashier: ${esc(receipt.cashierName)}</div>
  ${receipt.customerName ? `<div>Customer: ${esc(receipt.customerName)}</div>` : ''}
  <div class="rule"></div>
  ${receipt.items.map((item) => `
    <div class="item">
      <div>${esc(item.name)}${item.variantName ? ` (${esc(item.variantName)})` : ''}</div>
      ${row(`<span class="qty">${item.quantity} x ${money(item.price)}</span>`, money(item.price * item.quantity))}
    </div>`).join('')}
  <div class="rule"></div>
  ${row('Subtotal', money(receipt.subtotal))}
  ${receipt.discount > 0 ? row('Discount', `-${money(receipt.discount)}`) : ''}
  ${(receipt.processingFee ?? 0) > 0 ? row('MoMo fee (1.95%)', money(receipt.processingFee ?? 0)) : ''}
  ${row('TOTAL', money(receipt.total), 'total')}
  <div class="rule"></div>
  ${receipt.payments.map((p) => row(esc(METHOD_LABELS[p.method] ?? p.method), money(p.amount))).join('')}
  ${receipt.change > 0 ? row('Change', money(receipt.change)) : ''}
  ${receipt.paymentReference ? `<div class="small">Ref: ${esc(receipt.paymentReference)}</div>` : ''}
  <div class="rule"></div>
  <div class="center small">Thank you for shopping with us!</div>
  <div class="center small">Returns accepted within 7 days</div>
  <div class="center small">hello@discountbeautybarr.com</div>
</body>
</html>`
}

/**
 * Prints through a hidden iframe — no popup window, and only the receipt is
 * printed. With Chrome started using --kiosk-printing this prints silently.
 */
function printReceiptHTML(html: string) {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
  document.body.appendChild(iframe)
  const win = iframe.contentWindow
  if (!win) { iframe.remove(); return }
  win.document.open()
  win.document.write(html)
  win.document.close()
  setTimeout(() => {
    win.focus()
    win.print()
    setTimeout(() => iframe.remove(), 2000)
  }, 250)
}

export function POSReceipt({ receipt, onNewSale }: { receipt: ReceiptData; onNewSale: () => void }) {

  const handlePrint = () => printReceiptHTML(buildReceiptHTML(receipt))

  // Print automatically once, as soon as the sale completes.
  const autoPrinted = useRef(false)
  useEffect(() => {
    if (autoPrinted.current) return
    autoPrinted.current = true
    printReceiptHTML(buildReceiptHTML(receipt))
  }, [receipt])

  const handleSavePDF = () => {
    // Opens the browser print dialog — choose "Save as PDF" as the printer.
    const url = URL.createObjectURL(new Blob([buildReceiptHTML(receipt)], { type: 'text/html' }))
    const win = window.open(url, '_blank', 'width=420,height=700')
    if (!win) { alert('Please allow popups for this site to save receipts.'); return }
    win.addEventListener('load', () => { win.focus(); win.print() })
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(44,36,32,0.7)', overflowY: 'auto' }}>
      <div className="flex flex-col gap-3 w-full max-w-sm my-auto">

        {receipt.saveWarning && (
          <div className="flex items-start gap-2 p-3" style={{ background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
            <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#991B1B', lineHeight: 1.5 }}>{receipt.saveWarning}</p>
          </div>
        )}

        {/* Success badge */}
        <div className="flex flex-col items-center gap-2 pt-1">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#16A34A' }}>
            <Check size={22} color="white" />
          </div>
          <p style={{ color: 'white', fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontWeight: 300 }}>
            Payment Complete
          </p>
        </div>

        {/* Receipt card */}
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', maxHeight: '52vh', overflowY: 'auto' }}>

          {/* Header */}
          <div className="text-center py-3 px-4" style={{ background: '#2C2420' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', color: 'white', fontWeight: 300 }}>
              Discount Beauty Barr.
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
              {BRANCH_NAMES[receipt.branchId] ?? receipt.branchId}
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
              {receipt.timestamp.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}
              {receipt.timestamp.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          {/* Meta */}
          <div className="flex justify-between px-4 py-2" style={{ borderBottom: '1px solid #F2EDE8', background: '#FAF7F4' }}>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: '#8C7B74' }}>#{receipt.orderNumber}</span>
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: '#8C7B74' }}>{receipt.cashierName}</span>
          </div>

          {receipt.customerName && (
            <div className="px-4 py-2" style={{ borderBottom: '1px solid #F2EDE8' }}>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#2C2420' }}>Customer: {receipt.customerName}</span>
            </div>
          )}

          {/* Items */}
          <div className="px-4 py-3 flex flex-col gap-2">
            {receipt.items.map((item, i) => (
              <div key={i} className="flex justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#2C2420', lineHeight: 1.3 }} className="truncate">{item.name}</p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: '#8C7B74' }}>{item.variantName} × {item.quantity}</p>
                </div>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '13px', color: '#2C2420', flexShrink: 0 }}>
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-4 py-3 flex flex-col gap-1" style={{ borderTop: '1px solid #E8DDD4', background: '#FAF7F4' }}>
            <div className="flex justify-between">
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#8C7B74' }}>Subtotal</span>
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#2C2420' }}>{formatCurrency(receipt.subtotal)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between">
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#16A34A' }}>Discount</span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#16A34A' }}>-{formatCurrency(receipt.discount)}</span>
              </div>
            )}
            {(receipt.processingFee ?? 0) > 0 && (
              <div className="flex justify-between">
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#8C7B74' }}>MoMo processing fee (1.95%)</span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#2C2420' }}>{formatCurrency(receipt.processingFee ?? 0)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1" style={{ borderTop: '1px solid #E8DDD4' }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', color: '#2C2420', fontWeight: 400 }}>Total</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', color: '#2C2420', fontWeight: 400 }}>{formatCurrency(receipt.total)}</span>
            </div>
          </div>

          {/* Payments */}
          <div className="px-4 py-3 flex flex-col gap-1" style={{ borderTop: '1px solid #E8DDD4' }}>
            {receipt.payments.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#8C7B74' }}>{METHOD_LABELS[p.method] ?? p.method}</span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#2C2420' }}>{formatCurrency(p.amount)}</span>
              </div>
            ))}
            {receipt.change > 0 && (
              <div className="flex justify-between">
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#D97706' }}>Change</span>
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#D97706' }}>{formatCurrency(receipt.change)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center px-4 py-3" style={{ borderTop: '1px solid #E8DDD4' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '12px', color: '#8C7B74' }}>
              Thank you for shopping with us! ✦
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingBottom: '8px' }}>
          <button onClick={handlePrint}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '12px 8px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>
            <Printer size={16} />
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 300 }}>Print</span>
          </button>
          <button onClick={handleSavePDF}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '12px 8px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>
            <Download size={16} />
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 300 }}>Save PDF</span>
          </button>
          <button onClick={onNewSale}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '12px 8px', background: '#B76E79', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>
            <RotateCcw size={16} />
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 300 }}>New Sale</span>
          </button>
        </div>
      </div>
    </div>
  )
}
