'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Search, X, Minus, Plus, Trash2, ChevronDown,
  ShoppingBag, Tag, User, FileText, LogOut,
  Banknote, CreditCard, Smartphone, SplitSquareHorizontal,
  Store, Clock, AlertTriangle, CheckCircle2, MapPin, Monitor
} from 'lucide-react'
import { POSProductCard } from '@/components/pos/POSProductCard'
import { POSVariantModal } from '@/components/pos/POSVariantModal'
import { POSReceipt, type ReceiptData } from '@/components/pos/POSReceipt'
import { POSMomoModal } from '@/components/pos/POSMomoModal'
import { formatCurrency } from '@/lib/utils'
import { MOMO_PROVIDERS, type MomoProvider } from '@/lib/pos/momo-providers'
import { processingFeeFor } from '@/lib/fees'
import { DISPLAY_CHANNEL, type DisplayMessage, type DisplayState } from '@/lib/pos/customer-display'
import type { Product } from '@/types'
import { PRODUCT_CATEGORIES } from '@/lib/constants'

interface CartItem {
  productId: string
  variantId: string
  name: string
  brand: string
  variantName: string
  price: number
  quantity: number
  sku: string
  image?: string
}

type PaymentMethod = 'cash' | 'card' | 'momo'
type Screen = 'pos' | 'confirm' | 'receipt'

const CATEGORIES = [{ value: 'all', label: 'All' }, ...PRODUCT_CATEGORIES.map((c) => ({ value: c.value as string, label: c.label }))]
const BRANCHES = [
  { id: 'osu', label: 'Osu Branch' },
  { id: 'east-legon', label: 'East Legon Branch' },
]

const PAYMENT_METHODS: { id: PaymentMethod; label: string; icon: React.ReactNode; confirmText: string }[] = [
  { id: 'cash',            label: 'Cash',          icon: <Banknote size={14} />,   confirmText: 'Confirm you have received the correct cash amount.' },
  { id: 'card',            label: 'Card',          icon: <CreditCard size={14} />,  confirmText: 'Confirm the card payment has been approved on the terminal.' },
  // Single-method MoMo goes through Paystack (prompt on the customer's phone).
  // In a split payment, MoMo is confirmed manually on the customer's phone.
  { id: 'momo',            label: 'Mobile Money',  icon: <Smartphone size={14} />,  confirmText: 'Confirm the mobile money payment shows as successful on the customer’s phone.' },
]

function isValidGhanaPhone(input: string) {
  let d = input.replace(/\D/g, '')
  if (d.startsWith('233')) d = '0' + d.slice(3)
  if (d.length === 9) d = '0' + d
  return /^0\d{9}$/.test(d)
}

function generateOrderNumber() {
  const d = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const t = Math.floor(Math.random() * 9000 + 1000)
  return `POS-${d}-${t}`
}

// ── Quantity picker modal ─────────────────────────────────────────────────────
function QtyModal({ product, variantId, onConfirm, onClose }: {
  product: Product
  variantId: string
  onConfirm: (qty: number) => void
  onClose: () => void
}) {
  const [qty, setQty] = useState(1)
  const variant = product.variants.find((v) => v.id === variantId)
  if (!variant) return null
  const maxQty = product.clearance ? Math.max(product.clearance.remaining, 1) : variant.stock > 0 ? variant.stock : 99 /* 0 recorded: still sellable, stock goes negative */

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(44,36,32,0.6)' }} onClick={onClose}>
      <div className="w-full max-w-xs" style={{ background: 'white', borderRadius: '10px', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4" style={{ background: '#2C2420' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '17px', color: 'white', fontWeight: 400 }}>
            {product.name}
          </p>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
            {variant.name} · {formatCurrency(variant.price)}
          </p>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#8C7B74', textAlign: 'center' }}>
            How many?
          </p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}
              style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #D4C5B8', background: 'white', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2C2420' }}>
              −
            </button>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '36px', color: '#2C2420', minWidth: '48px', textAlign: 'center', lineHeight: 1 }}>
              {qty}
            </span>
            <button onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid #D4C5B8', background: 'white', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2C2420' }}>
              +
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#8C7B74' }}>Subtotal</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: '#2C2420' }}>
              {formatCurrency(variant.price * qty)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onClose}
              style={{ padding: '12px', background: '#F2EDE8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#2C2420' }}>
              Cancel
            </button>
            <button onClick={() => { onConfirm(qty); onClose() }}
              style={{ padding: '12px', background: '#2C2420', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '15px', color: 'white' }}>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Confirm payment modal ─────────────────────────────────────────────────────
function ConfirmModal({ total, paymentMethod, splitMode, split, cashPaid, change,
  customerName, itemCount, onConfirm, onCancel, processing, error }: {
  total: number; paymentMethod: PaymentMethod; splitMode: boolean
  split: { method: PaymentMethod; amount: string }[]; cashPaid: number
  change: number; customerName: string; itemCount: number
  onConfirm: () => void; onCancel: () => void; processing: boolean; error: string
}) {
  const method = PAYMENT_METHODS.find((m) => m.id === paymentMethod)
  const paymentsDisplay = splitMode
    ? split.filter((s) => parseFloat(s.amount) > 0).map((s) => ({
        label: PAYMENT_METHODS.find((m) => m.id === s.method)?.label ?? s.method,
        amount: parseFloat(s.amount),
      }))
    : [{ label: method?.label ?? paymentMethod, amount: total }]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(44,36,32,0.7)' }}>
      <div className="w-full max-w-sm" style={{ background: 'white', borderRadius: '10px', overflow: 'hidden' }}>
        <div className="px-5 py-4 flex items-center gap-3" style={{ background: '#2C2420' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(183,110,121,0.3)' }}>
            <CheckCircle2 size={18} color="#E8B4A0" />
          </div>
          <div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: 'white' }}>Confirm Payment</p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}{customerName ? ` · ${customerName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5">
          <div className="text-center py-3" style={{ background: '#FAF7F4', borderRadius: '6px', border: '1px solid #E8DDD4' }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#8C7B74', marginBottom: '4px' }}>Total to Collect</p>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '36px', color: '#2C2420', lineHeight: 1 }}>
              {formatCurrency(total)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {paymentsDisplay.map((p, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5"
                style={{ background: '#F2EDE8', borderRadius: '6px' }}>
                <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#2C2420' }}>{p.label}</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '16px', color: '#2C2420' }}>{formatCurrency(p.amount)}</span>
              </div>
            ))}
            {!splitMode && paymentMethod === 'cash' && cashPaid >= total && cashPaid > 0 && (
              <div className="flex items-center justify-between px-3 py-2"
                style={{ background: '#FEF3C7', borderRadius: '6px' }}>
                <span style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '13px', color: '#92400E' }}>Change to Return</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400, fontSize: '18px', color: '#D97706' }}>{formatCurrency(change)}</span>
              </div>
            )}
          </div>
          {!splitMode && method && (
            <div className="flex items-start gap-2 p-3"
              style={{ background: '#EFF6FF', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
              <AlertTriangle size={14} color="#1D4ED8" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#1D4ED8', lineHeight: 1.5 }}>
                {method.confirmText}
              </p>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-2 p-3"
              style={{ background: '#FEF2F2', borderRadius: '6px', border: '1px solid #FECACA' }}>
              <AlertTriangle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', color: '#DC2626', lineHeight: 1.5 }}>{error}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onCancel} disabled={processing}
              style={{ padding: '12px', background: '#F2EDE8', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '14px', color: '#2C2420' }}>
              Go Back
            </button>
            <button onClick={onConfirm} disabled={processing}
              style={{ padding: '12px', background: processing ? '#8C7B74' : '#16A34A', border: 'none', borderRadius: '6px', cursor: processing ? 'wait' : 'pointer', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.2s' }}>
              {processing
                ? <><div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'pos-spin 0.7s linear infinite' }} /> Saving…</>
                : <><CheckCircle2 size={15} /> Confirm</>
              }
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes pos-spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

// ── Main POS ──────────────────────────────────────────────────────────────────
interface POSClientProps {
  products: Product[]
  cashierName: string
  branchId: string
  // True when the signed-in cashier has a fixed branch — the selector locks
  // to it so a sale can never be rung up under the wrong store. Only staff
  // with no assigned branch (e.g. a manager covering both) get to choose.
  branchLocked?: boolean
  onLogout?: () => void
}

export function POSClient({ products, cashierName, branchId: defaultBranch, branchLocked, onLogout }: POSClientProps) {

  const [screen, setScreen] = useState<Screen>('pos')
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState<CartItem[]>([])
  const [variantProduct, setVariantProduct] = useState<Product | null>(null)
  const [qtyPicker, setQtyPicker] = useState<{ product: Product; variantId: string } | null>(null)
  const [activeBranch, setActiveBranch] = useState(defaultBranch || 'osu')
  const [customerName, setCustomerName] = useState('')
  const [notes, setNotes] = useState('')
  const [discountType, setDiscountType] = useState<'pct' | 'fixed'>('pct')
  const [discountValue, setDiscountValue] = useState('')
  const [showDiscount, setShowDiscount] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [splitMode, setSplitMode] = useState(false)
  const [cashAmount, setCashAmount] = useState('')
  const [split, setSplit] = useState<{ method: PaymentMethod; amount: string }[]>([
    { method: 'cash', amount: '' }, { method: 'card', amount: '' },
  ])
  const [processing, setProcessing] = useState(false)
  const [processError, setProcessError] = useState('')
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)
  const [momoProvider, setMomoProvider] = useState<MomoProvider>('mtn')
  const [momoPhone, setMomoPhone] = useState('')
  const [showMomo, setShowMomo] = useState(false)

  // ── Computed ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => products.filter((p) => {
    const matchCat = category === 'all' || p.category === category
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  }), [products, search, category])

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0)
  const discount = useMemo(() => {
    const v = parseFloat(discountValue) || 0
    if (discountType === 'pct') return Math.min((subtotal * v) / 100, subtotal)
    return Math.min(v, subtotal)
  }, [subtotal, discountType, discountValue])
  const total = subtotal - discount
  // A single mobile money payment goes through Paystack, so the customer pays
  // its 1.95% fee. Cash, card terminal and split payments carry no fee.
  const momoViaPaystack = !splitMode && paymentMethod === 'momo'
  const processingFee = momoViaPaystack ? processingFeeFor(total) : 0
  const payable = Math.round((total + processingFee) * 100) / 100
  const cashPaid = parseFloat(cashAmount) || 0
  const change = paymentMethod === 'cash' && !splitMode ? Math.max(cashPaid - total, 0) : 0
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0)
  const splitTotal = split.reduce((s, x) => s + (parseFloat(x.amount) || 0), 0)

  const canCharge = useMemo(() => {
    if (cart.length === 0 || total <= 0) return false
    if (splitMode) return splitTotal >= total
    if (paymentMethod === 'cash') return cashAmount === '' || cashPaid >= total
    if (paymentMethod === 'momo') return isValidGhanaPhone(momoPhone)
    return true
  }, [cart, total, splitMode, splitTotal, paymentMethod, cashAmount, cashPaid, momoPhone])

  // ── Customer-facing display (second monitor) ───────────────────────────────
  // The display window is a separate browser tab/window that listens on this
  // same-origin BroadcastChannel. Whenever the sale changes, push the latest
  // snapshot; if a display window is opened later, it asks (via "hello") for
  // the current state so it isn't left blank.
  const displayChannel = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const channel = new BroadcastChannel(DISPLAY_CHANNEL)
    displayChannel.current = channel
    channel.onmessage = (e: MessageEvent<DisplayMessage>) => {
      if (e.data?.type === 'hello') sendDisplayState()
    }
    return () => channel.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendDisplayState = () => {
    const channel = displayChannel.current
    if (!channel) return
    const stage: DisplayState['stage'] =
      screen === 'receipt' ? 'paid' : screen === 'confirm' ? 'confirm' : cart.length === 0 ? 'idle' : 'shopping'
    channel.postMessage({
      type: 'state',
      stage,
      branchId: activeBranch,
      items: cart.map((i) => ({ name: i.name, variantName: i.variantName, price: i.price, quantity: i.quantity })),
      subtotal,
      discount,
      total,
      paymentMethod: splitMode ? undefined : paymentMethod,
      cashPaid: paymentMethod === 'cash' ? cashPaid : undefined,
      change,
    } satisfies DisplayState)
  }

  useEffect(() => {
    sendDisplayState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, subtotal, discount, total, screen, paymentMethod, cashPaid, change, activeBranch, splitMode])

  const openCustomerDisplay = () => {
    window.open('/pos/display', 'dbb-customer-display', 'noopener')
  }

  // ── Cart ────────────────────────────────────────────────────────────────────
  const addToCart = (product: Product, variantId: string, qty: number = 1) => {
    const variant = product.variants.find((v) => v.id === variantId)
    if (!variant) return
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id && i.variantId === variantId)
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id && i.variantId === variantId
            ? { ...i, quantity: i.quantity + qty } : i
        )
      }
      return [...prev, {
        productId: product.id, variantId,
        name: product.name, brand: product.brand,
        variantName: variant.name, price: variant.price,
        quantity: qty, sku: variant.sku,
        image: (variant.images?.[0] ?? product.images?.[0]) || '',
      }]
    })
  }

  // Tap on product card: single variant → qty picker, multi → variant modal
  const handleProductTap = (product: Product) => {
    if (product.variants.length === 1) {
      setQtyPicker({ product, variantId: product.variants[0].id })
    } else {
      setVariantProduct(product)
    }
  }

  // Variant selected from modal → qty picker
  const handleVariantSelect = (product: Product, variantId: string) => {
    setVariantProduct(null)
    setQtyPicker({ product, variantId })
  }

  const updateQty = (productId: string, variantId: string, qty: number) => {
    if (qty <= 0) setCart((p) => p.filter((i) => !(i.productId === productId && i.variantId === variantId)))
    else setCart((p) => p.map((i) => i.productId === productId && i.variantId === variantId ? { ...i, quantity: qty } : i))
  }

  const clearCart = () => {
    setCart([]); setCustomerName(''); setNotes('')
    setDiscountValue(''); setShowDiscount(false)
    setCashAmount(''); setPaymentMethod('cash'); setSplitMode(false); setProcessError('')
    setMomoPhone(''); setMomoProvider('mtn')
  }

  // ── Payment ─────────────────────────────────────────────────────────────────
  const handleChargeClick = () => {
    if (!canCharge) return
    setProcessError('')
    if (!splitMode && paymentMethod === 'momo') setShowMomo(true)
    else setScreen('confirm')
  }

  // paystackReference is set when a MoMo prompt was approved through Paystack
  const handleConfirmed = async (paystackReference?: string) => {
    setProcessing(true)
    setProcessError('')
    const orderNumber = generateOrderNumber()
    const timestamp = new Date()

    // What's recorded as paid (amounts that make up the total)
    const apiPayments = splitMode
      ? split.filter((s) => parseFloat(s.amount) > 0).map((s) => ({ method: s.method, amount: parseFloat(s.amount) }))
      : [{
          method: paymentMethod,
          amount: payable,
          ...(paymentMethod === 'momo' ? { provider: momoProvider, paystackReference } : {}),
        }]

    // What's printed (cash shows the amount handed over)
    const receiptPayments = splitMode
      ? apiPayments
      : [{
          method: paymentMethod === 'momo' ? `momo_${momoProvider}` : paymentMethod,
          amount: paymentMethod === 'cash' ? Math.max(cashPaid || total, total) : payable,
        }]

    const validBranch = ['osu', 'east-legon'].includes(activeBranch) ? activeBranch : 'osu'
    let saveWarning: string | undefined

    try {
      const res = await fetch('/api/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderData: {
            order_number: orderNumber,
            branch_id: validBranch,
            status: 'delivered',
            fulfillment: 'pickup',
            customer_name: customerName || 'Walk-in Customer',
            customer_email: 'pos@discountbeautybarr.com',
            notes: notes || null,
            subtotal, delivery_fee: 0, discount, total: payable, processing_fee: processingFee,
          },
          orderItems: cart.map((item) => ({
            variant_id: item.variantId,
            product_name: item.name, variant_name: item.variantName,
            brand: item.brand, sku: item.sku, price: item.price, quantity: item.quantity,
          })),
          payments: apiPayments,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (res.status === 401) {
        saveWarning = 'Your PIN session ended, so this sale was NOT saved. Sign in again and tell a manager.'
      } else if (!res.ok) {
        saveWarning = `This sale was NOT saved (${json.error ?? 'server error'}). Tell a manager.`
      } else if (json.partial) {
        saveWarning = `Sale saved with a problem (${json.warning}). Tell a manager.`
      } else if (Array.isArray(json.negativeStock) && json.negativeStock.length > 0) {
        saveWarning = `Sale saved. Stock was not recorded for: ${json.negativeStock.map((n: any) => n.name ?? n.sku).join(', ')}. It now shows as negative. Tell a manager to update the count.`
      }
    } catch (err: any) {
      console.error('[POS] Exception:', err?.message ?? err)
      saveWarning = 'No connection — this sale was NOT saved. Tell a manager.'
    }

    setReceipt({
      orderNumber, branchId: validBranch, timestamp,
      items: cart.map((i) => ({ name: i.name, brand: i.brand, variantName: i.variantName, price: i.price, quantity: i.quantity })),
      subtotal, discount, processingFee, total: payable, payments: receiptPayments,
      change: paymentMethod === 'cash' && !splitMode ? change : 0,
      cashierName, customerName: customerName || undefined, notes: notes || undefined,
      paymentReference: paystackReference,
      saveWarning,
    })
    setProcessing(false)
    setShowMomo(false)
    setScreen('receipt')
  }

  const handleNewSale = () => { clearCart(); setReceipt(null); setScreen('pos') }

  const quickCash = [...new Set([5, 10, 20, 50].map((d) => Math.ceil(total / d) * d).filter((v) => v > 0))].slice(0, 4)

  const inputBase: React.CSSProperties = {
    padding: '8px 12px', background: 'white', border: '1px solid #D4C5B8',
    borderRadius: '6px', fontFamily: "'Jost', sans-serif", fontWeight: 300,
    fontSize: '13px', color: '#2C2420', outline: 'none', width: '100%',
  }

  return (
    <>
      {variantProduct && <POSVariantModal product={variantProduct} onSelect={handleVariantSelect} onClose={() => setVariantProduct(null)} />}
      {qtyPicker && <QtyModal product={qtyPicker.product} variantId={qtyPicker.variantId} onConfirm={(qty) => addToCart(qtyPicker.product, qtyPicker.variantId, qty)} onClose={() => setQtyPicker(null)} />}
      {showMomo && (
        <POSMomoModal
          amount={payable}
          phone={momoPhone}
          provider={momoProvider}
          branchId={activeBranch}
          onPaid={(ref) => handleConfirmed(ref)}
          onClose={() => setShowMomo(false)}
        />
      )}
      {screen === 'confirm' && <ConfirmModal total={total} paymentMethod={paymentMethod} splitMode={splitMode} split={split} cashPaid={cashPaid} change={change} customerName={customerName} itemCount={itemCount} onConfirm={() => handleConfirmed()} onCancel={() => { setScreen('pos'); setProcessError('') }} processing={processing} error={processError} />}
      {screen === 'receipt' && receipt && <POSReceipt receipt={receipt} onNewSale={handleNewSale} />}

      {/* Mobile tab bar — only visible on small screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex"
        style={{ background: '#2C2420', borderTop: '1px solid rgba(255,255,255,0.1)', height: '56px' }}>
        <button onClick={() => setMobileTab('products')}
          className="flex-1 flex flex-col items-center justify-center gap-0.5"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: mobileTab === 'products' ? '#E8B4A0' : 'rgba(255,255,255,0.4)' }}>
          <ShoppingBag size={18} />
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', fontWeight: 300 }}>Products</span>
        </button>
        <button onClick={() => setMobileTab('cart')}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 relative"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: mobileTab === 'cart' ? '#E8B4A0' : 'rgba(255,255,255,0.4)' }}>
          <div className="relative">
            <ShoppingBag size={18} />
            {itemCount > 0 && (
              <span style={{ position: 'absolute', top: '-6px', right: '-8px', background: '#B76E79', color: 'white', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Jost', sans-serif" }}>
                {itemCount}
              </span>
            )}
          </div>
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', fontWeight: 300 }}>Cart</span>
        </button>
      </div>

      <div className="flex h-full relative" style={{ paddingBottom: 0 }}>

        {/* ── LEFT ─────────────────────────────────────────────────────────── */}
        <div className={`flex flex-col flex-1 min-w-0 h-full ${mobileTab === "cart" ? "hidden lg:flex" : "flex"}`}>

          {/* Top bar */}
          <div style={{ background: '#2C2420', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
            {/* Logo - hidden on very small screens */}
            <div className="hidden sm:block" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, fontSize: '16px', color: 'white', flexShrink: 0 }}>
              DBB <span style={{ color: '#E8B4A0' }}>·</span> POS
            </div>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
              <Search size={13} color="#B76E79" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search…"
                style={{ ...inputBase, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', paddingLeft: '29px', width: '100%', fontSize: '13px' }} />
            </div>
            {/* Branch — locked to the cashier's assigned store; only an
                unassigned staff member (e.g. a manager covering both) can switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <MapPin size={11} color="#E8B4A0" />
              {branchLocked ? (
                <span title="This till is locked to your assigned branch"
                  style={{ color: 'white', fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 300, padding: '4px 6px', maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {BRANCHES.find((b) => b.id === activeBranch)?.label ?? activeBranch}
                </span>
              ) : (
                <select value={activeBranch} onChange={(e) => setActiveBranch(e.target.value)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 300, padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', outline: 'none', maxWidth: '110px' }}>
                  {BRANCHES.map((b) => <option key={b.id} value={b.id} style={{ background: '#2C2420' }}>{b.label}</option>)}
                </select>
              )}
            </div>
            {/* Clock - hidden on mobile */}
            <div className="hidden sm:flex" style={{ alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <Clock size={11} color="rgba(255,255,255,0.4)" />
              <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'nowrap' }}>
                {new Date().toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {/* Customer display — opens the second-monitor screen in its own window */}
            <button onClick={openCustomerDisplay} title="Open the customer-facing screen"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
              <Monitor size={12} />
              <span className="hidden sm:inline" style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 300 }}>Display</span>
            </button>
            {/* Logout */}
            <button onClick={onLogout ?? (() => window.location.href = '/admin')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>
              <LogOut size={12} />
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-1.5 px-3 py-2 overflow-x-auto"
            style={{ background: '#FAF7F4', borderBottom: '1px solid #E8DDD4', flexShrink: 0 }}>
            {CATEGORIES.map(({ value: cat, label }) => (
              <button key={cat} onClick={() => setCategory(cat)}
                style={{ padding: '5px 14px', borderRadius: '99px', cursor: 'pointer', background: category === cat ? '#2C2420' : 'white', color: category === cat ? 'white' : '#8C7B74', fontFamily: "'Jost', sans-serif", fontWeight: 300, fontSize: '12px', whiteSpace: 'nowrap', border: `1px solid ${category === cat ? 'transparent' : '#E8DDD4'}`, transition: 'all 0.15s' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <ShoppingBag size={32} color="#D4C5B8" />
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', color: '#8C7B74' }}>No products found</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
                {filtered.map((product) => (
                  <POSProductCard key={product.id} product={product}
                    onAdd={(p, variantId) => {
                      if (p.variants.length > 1) setVariantProduct(p)
                      else setQtyPicker({ product: p, variantId })
                    }} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT ────────────────────────────────────────────────────────── */}
        <div className={`flex-col h-full border-l ${mobileTab === "products" ? "hidden lg:flex" : "flex"}`}
          style={{ width: "340px", flexShrink: 0, borderColor: "#E8DDD4", background: "white" }}>

          {/* Cart header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E8DDD4' }}>
            <div className="flex items-center gap-2">
              <ShoppingBag size={15} color="#B76E79" />
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', color: '#2C2420', fontWeight: 400 }}>
                Current Sale
              </span>
              {itemCount > 0 && (
                <span style={{ background: '#B76E79', color: 'white', borderRadius: '99px', padding: '1px 8px', fontSize: '11px', fontFamily: "'Jost', sans-serif" }}>
                  {itemCount}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Trash2 size={13} />
                <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px' }}>Clear</span>
              </button>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <ShoppingBag size={28} color="#E8DDD4" />
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '16px', color: '#C4B8B2' }}>Tap a product to add</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderBottom: '1px solid #F2EDE8' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '4px', overflow: 'hidden', background: '#FAF7F4', flexShrink: 0, border: '1px solid #E8DDD4' }}>
                      {item.image
                        ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingBag size={14} color="#D4C5B8" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#2C2420', fontWeight: 400 }} className="truncate">{item.name}</p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '10px', color: '#8C7B74', fontWeight: 300 }}>
                        {item.variantName} · {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #D4C5B8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Minus size={9} color="#8C7B74" />
                      </button>
                      <span style={{ width: '22px', textAlign: 'center', fontFamily: "'Jost', sans-serif", fontSize: '13px', color: '#2C2420', fontWeight: 400 }}>
                        {item.quantity}
                      </span>
                      <button onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)}
                        style={{ width: '22px', height: '22px', borderRadius: '4px', border: '1px solid #D4C5B8', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Plus size={9} color="#8C7B74" />
                      </button>
                    </div>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '14px', color: '#2C2420', fontWeight: 400, flexShrink: 0, minWidth: '52px', textAlign: 'right' }}>
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom panel */}
          {cart.length > 0 && (
            <div className="border-t flex flex-col gap-3 p-4" style={{ borderColor: '#E8DDD4', background: '#FAF7F4' }}>
              {/* Customer + notes */}
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <User size={12} color="#B76E79" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" style={{ ...inputBase, fontSize: '12px', paddingLeft: '26px' }} />
                </div>
                <div className="relative">
                  <FileText size={12} color="#B76E79" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes" style={{ ...inputBase, fontSize: '12px', paddingLeft: '26px' }} />
                </div>
              </div>

              {/* Discount */}
              <div>
                <button onClick={() => setShowDiscount(!showDiscount)}
                  className="flex items-center justify-between w-full"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <div className="flex items-center gap-1.5">
                    <Tag size={12} color="#B76E79" />
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#8C7B74' }}>
                      {discount > 0 ? `Discount: -${formatCurrency(discount)}` : 'Add Discount'}
                    </span>
                  </div>
                  <ChevronDown size={12} color="#8C7B74" style={{ transform: showDiscount ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {showDiscount && (
                  <div className="flex gap-2 mt-2">
                    <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}
                      style={{ ...inputBase, width: '70px', fontSize: '12px', cursor: 'pointer' }}>
                      <option value="pct">%</option>
                      <option value="fixed">GHS</option>
                    </select>
                    <input type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === 'pct' ? '0%' : '0.00'}
                      style={{ ...inputBase, flex: 1, fontSize: '12px' }} />
                    {discountValue && (
                      <button onClick={() => { setDiscountValue(''); setShowDiscount(false) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', padding: '0 4px' }}>
                        <X size={13} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-1 py-2 border-t border-b" style={{ borderColor: '#E8DDD4' }}>
                <div className="flex justify-between">
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#8C7B74' }}>Subtotal</span>
                  <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#2C2420' }}>{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#16A34A' }}>Discount</span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#16A34A' }}>-{formatCurrency(discount)}</span>
                  </div>
                )}
                {processingFee > 0 && (
                  <div className="flex justify-between">
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#8C7B74' }}>MoMo processing fee (1.95%)</span>
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#2C2420' }}>{formatCurrency(processingFee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1">
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '18px', color: '#2C2420', fontWeight: 400 }}>Total</span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', color: '#2C2420', fontWeight: 400 }}>{formatCurrency(payable)}</span>
                </div>
              </div>

              {/* Payment */}
              {!splitMode ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-1 flex-wrap">
                    {PAYMENT_METHODS.map((m) => (
                      <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 9px', borderRadius: '6px', cursor: 'pointer', background: paymentMethod === m.id ? '#2C2420' : 'white', color: paymentMethod === m.id ? 'white' : '#8C7B74', fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 300, border: `1px solid ${paymentMethod === m.id ? 'transparent' : '#D4C5B8'}`, transition: 'all 0.15s' }}>
                        {m.icon} {m.label}
                      </button>
                    ))}
                    <button onClick={() => setSplitMode(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 9px', borderRadius: '6px', border: '1px solid #D4C5B8', cursor: 'pointer', background: 'white', color: '#8C7B74', fontFamily: "'Jost', sans-serif", fontSize: '11px', fontWeight: 300 }}>
                      <SplitSquareHorizontal size={12} /> Split
                    </button>
                  </div>
                  {paymentMethod === 'momo' && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex gap-1">
                        {MOMO_PROVIDERS.map((p) => (
                          <button key={p.id} onClick={() => setMomoProvider(p.id)}
                            style={{ flex: 1, padding: '6px 4px', borderRadius: '6px', cursor: 'pointer', background: momoProvider === p.id ? '#B76E79' : 'white', color: momoProvider === p.id ? 'white' : '#2C2420', border: `1px solid ${momoProvider === p.id ? 'transparent' : '#D4C5B8'}`, fontFamily: "'Jost', sans-serif", fontSize: '11px' }}>
                            {p.label}
                          </button>
                        ))}
                      </div>
                      <input type="tel" inputMode="numeric" value={momoPhone} onChange={(e) => setMomoPhone(e.target.value)}
                        placeholder="Customer's MoMo number, e.g. 0241234567"
                        style={{ ...inputBase, fontSize: '13px' }} />
                      {momoPhone && !isValidGhanaPhone(momoPhone) && (
                        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: '#D97706' }}>Enter a 10-digit number</p>
                      )}
                    </div>
                  )}
                  {paymentMethod === 'cash' && (
                    <div className="flex flex-col gap-1.5">
                      <input type="number" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)}
                        placeholder={`Amount received (min ${formatCurrency(total)})`}
                        style={{ ...inputBase, fontSize: '13px' }} />
                      <div className="flex gap-1.5">
                        {quickCash.map((amt) => (
                          <button key={amt} onClick={() => setCashAmount(String(amt))}
                            style={{ flex: 1, padding: '4px', background: 'white', border: '1px solid #D4C5B8', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Jost', sans-serif", fontSize: '11px', color: '#2C2420' }}>
                            {formatCurrency(amt)}
                          </button>
                        ))}
                      </div>
                      {cashPaid >= total && cashPaid > 0 && (
                        <div className="flex justify-between px-1">
                          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#D97706' }}>Change</span>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '16px', color: '#D97706', fontWeight: 400 }}>{formatCurrency(change)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: "'Jost', sans-serif", fontSize: '12px', color: '#2C2420' }}>Split Payment</span>
                    <button onClick={() => setSplitMode(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8C7B74', fontFamily: "'Jost', sans-serif", fontSize: '11px' }}>Cancel</button>
                  </div>
                  {split.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <select value={s.method} onChange={(e) => setSplit((p) => p.map((x, j) => j === i ? { ...x, method: e.target.value as PaymentMethod } : x))}
                        style={{ ...inputBase, width: '120px', fontSize: '11px', cursor: 'pointer' }}>
                        {PAYMENT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                      </select>
                      <input type="number" value={s.amount} placeholder="Amount"
                        onChange={(e) => setSplit((p) => p.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                        style={{ ...inputBase, flex: 1, fontSize: '12px' }} />
                    </div>
                  ))}
                  {splitTotal >= total
                    ? <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: '#16A34A' }}>✓ Payment covers total</p>
                    : splitTotal > 0
                    ? <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '11px', color: '#D97706' }}>Remaining: {formatCurrency(total - splitTotal)}</p>
                    : null}
                </div>
              )}

              {/* Charge button */}
              <button onClick={handleChargeClick} disabled={!canCharge}
                style={{ width: '100%', padding: '14px', background: canCharge ? '#B76E79' : '#D4C5B8', color: 'white', border: 'none', borderRadius: '8px', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', letterSpacing: '0.04em', cursor: canCharge ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
                {!splitMode && paymentMethod === 'momo' ? `Send MoMo prompt · ${formatCurrency(payable)}` : `Charge ${formatCurrency(total)}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
