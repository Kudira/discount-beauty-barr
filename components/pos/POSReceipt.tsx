'use client'

import { useRef } from 'react'
import { Check, Printer, RotateCcw, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface ReceiptData {
  orderNumber: string
  items: { name: string; brand: string; variantName: string; price: number; quantity: number }[]
  subtotal: number
  discount: number
  total: number
  payments: { method: string; amount: number }[]
  change: number
  cashierName: string
  branchId: string
  timestamp: Date
  customerName?: string
  notes?: string
}

const BRANCH_NAMES: Record<string, string> = {
  'osu': 'Osu Branch · Oxford Street, Accra',
  'east-legon': 'East Legon · American House Jct, Accra',
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash', card: 'Card',
  momo_mtn: 'MTN MoMo', momo_vodafone: 'Vodafone Cash', momo_airteltigo: 'AirtelTigo',
}

export function POSReceipt({ receipt, onNewSale }: { receipt: ReceiptData; onNewSale: () => void }) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    // Build a standalone print window — avoids Next.js DOM interference
    const content = printRef.current?.innerHTML ?? ''
    const win = window.open('', '_blank', 'width=400,height=700')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${receipt.orderNumber}</title>
        <style>
          body { font-family: monospace; font-size: 12px; margin: 0; padding: 8px; width: 80mm; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .dashed { border-top: 1px dashed #000; margin: 6px 0; }
          .total { font-size: 14px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size:14px;">Discount Beauty Barr</div>
        <div class="center" style="font-size:11px;">${BRANCH_NAMES[receipt.branchId] ?? receipt.branchId}</div>
        <div class="center" style="font-size:10px;">${receipt.timestamp.toLocaleString('en-GH')}</div>
        <div class="dashed"></div>
        <div>Receipt: ${receipt.orderNumber}</div>
        <div>Cashier: ${receipt.cashierName}</div>
        ${receipt.customerName ? `<div>Customer: ${receipt.customerName}</div>` : ''}
        <div class="dashed"></div>
        ${receipt.items.map((item) => `
          <div class="row">
            <span>${item.name} (${item.variantName}) ×${item.quantity}</span>
            <span>${formatCurrency(item.price * item.quantity)}</span>
          </div>
        `).join('')}
        <div class="dashed"></div>
        <div class="row"><span>Subtotal</span><span>${formatCurrency(receipt.subtotal)}</span></div>
        ${receipt.discount > 0 ? `<div class="row"><span>Discount</span><span>-${formatCurrency(receipt.discount)}</span></div>` : ''}
        <div class="row total"><span>TOTAL</span><span>${formatCurrency(receipt.total)}</span></div>
        <div class="dashed"></div>
        ${receipt.payments.map((p) => `<div class="row"><span>${METHOD_LABELS[p.method] ?? p.method}</span><span>${formatCurrency(p.amount)}</span></div>`).join('')}
        ${receipt.change > 0 ? `<div class="row"><span>Change</span><span>${formatCurrency(receipt.change)}</span></div>` : ''}
        <div class="dashed"></div>
        <div class="center">Thank you for shopping with us!</div>
        <div class="center" style="font-size:10px;">Returns within 7 days</div>
        <div class="center" style="font-size:10px;">hello@discountbeautybarr.com</div>
      </body>
      </html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(44,36,32,0.65)', overflowY: 'auto' }}>
      <div className="flex flex-col gap-4 w-full max-w-sm my-auto">

        {/* Success */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#16A34A' }}>
            <Check size={26} color="white" />
          </div>
          <p style={{ color: 'white', fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 300 }}>
            Payment Complete
          </p>
        </div>

        {/* Receipt card */}
        <div ref={printRef} style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', maxHeight: '55vh', overflowY: 'auto' }}>

          {/* Header */}
          <div className="text-center py-4 px-4" style={{ background: '#2C2420' }}>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', color: 'white', fontWeight: 300 }}>
              Discount Beauty Barr.
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
              {BRANCH_NAMES[receipt.branchId] ?? receipt.branchId}
            </p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              {receipt.timestamp.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' · '}{receipt.timestamp.toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
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

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 pb-2">
          <button onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-1 py-3"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>
            <Printer size={16} />
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 300 }}>Print</span>
          </button>
          <button onClick={handlePrint}
            className="flex flex-col items-center justify-center gap-1 py-3"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>
            <Download size={16} />
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 300 }}>Save PDF</span>
          </button>
          <button onClick={onNewSale}
            className="flex flex-col items-center justify-center gap-1 py-3"
            style={{ background: '#B76E79', border: 'none', borderRadius: '6px', color: 'white', cursor: 'pointer' }}>
            <RotateCcw size={16} />
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 300 }}>New Sale</span>
          </button>
        </div>
      </div>
    </div>
  )
}
