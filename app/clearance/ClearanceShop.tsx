'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Check, Minus, Plus, Search, ShoppingBag, Store, Truck, X } from 'lucide-react'
import type { SaleItem, SaleWindow } from '@/lib/clearance'
import { BRANCHES, DELIVERY_FEE, FREE_DELIVERY_MINIMUM } from '@/lib/constants'
import Countdown from './Countdown'

const STORAGE_KEY = 'dbb_clearance_cart'
const MAX_PER_ITEM = 15

type Cart = Record<string, number>
type PriceBand = 'all' | 'u60' | 'mid' | 'o100'
type Sort = 'default' | 'low' | 'high' | 'off' | 'name'

const fmt = (n: number) => 'GHS ' + n.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
const pct = (i: SaleItem) => Math.round(((i.original - i.price) / i.original) * 100)
const maxQty = (i: SaleItem) => Math.max(0, Math.min(i.remaining, MAX_PER_ITEM))
const hash = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }
const initials = (brand: string) => brand.replace(/[^A-Za-z0-9 ]/g, '').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || 'DB'
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const day = (iso: string) => new Date(iso).getUTCDate()
const monthName = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { month: 'long', timeZone: 'UTC' })

const TILE: Record<string, { from: string; to: string; fg: string }> = {
  skincare: { from: '#F6E9C8', to: '#E0BE76', fg: '#130E0B' },
  makeup:   { from: '#2A1D14', to: '#54381F', fg: '#F2E1B9' },
  body:     { from: '#C4903F', to: '#8A5A1A', fg: '#FBF7EF' },
  haircare: { from: '#FBF7EF', to: '#E7DCCB', fg: '#9B6420' },
}
function tileStyle(i: SaleItem): React.CSSProperties {
  const t = TILE[i.category] ?? TILE.skincare
  const angle = 110 + (hash(i.brand) % 70)
  return { ['--tile-bg' as string]: `linear-gradient(${angle}deg, ${t.from}, ${t.to})`, ['--tile-fg' as string]: t.fg }
}

function Tile({ item, className = '' }: { item: SaleItem; className?: string }) {
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
  }
  return (
    <div className={`clr-tile ${className}`} style={tileStyle(item)} onPointerMove={onMove}>
      {item.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image} alt={`${item.brand} ${item.name}`} loading="lazy" />
      ) : (
        <>
          <span className="clr-mono" aria-hidden="true">{initials(item.brand)}</span>
          <span className="clr-tile-cat">{item.categoryLabel}</span>
        </>
      )}
    </div>
  )
}

function Stepper({ qty, max, onSet, label }: { qty: number; max: number; onSet: (n: number) => void; label: string }) {
  return (
    <div className="clr-step" role="group" aria-label={`Quantity of ${label}`}>
      <button type="button" aria-label="Remove one" onClick={() => onSet(qty - 1)}><Minus size={18} /></button>
      <output aria-live="polite">{qty}</output>
      <button type="button" aria-label="Add one" onClick={() => onSet(qty + 1)} disabled={qty >= max}><Plus size={18} /></button>
    </div>
  )
}

function AddControl({ item, qty, onSet }: { item: SaleItem; qty: number; onSet: (n: number) => void }) {
  const max = maxQty(item)
  if (max === 0) return <button type="button" className="clr-add" disabled>Sold out</button>
  if (qty === 0) return <button type="button" className="clr-add" onClick={() => onSet(1)}>Add to bag</button>
  return <Stepper qty={qty} max={max} onSet={onSet} label={`${item.brand} ${item.name}`} />
}

export default function ClearanceShop({
  campaign, window: win, preview, items, serverNow,
}: {
  campaign: { name: string; startsAt: string; endsAt: string }
  window: SaleWindow
  preview: boolean
  items: SaleItem[]
  serverNow: number
}) {
  const router = useRouter()
  const showShop = items.length > 0
  const byId = useMemo(() => new Map(items.map((i) => [i.variantId, i])), [items])

  // ── Bag ───────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<Cart>({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const saved = raw ? (JSON.parse(raw) as Cart) : {}
      const clean: Cart = {}
      for (const [id, q] of Object.entries(saved)) {
        const it = byId.get(id)
        if (it && Number.isInteger(q) && q > 0 && maxQty(it) > 0) clean[id] = Math.min(q, maxQty(it))
      }
      setCart(clean)
    } catch {}
    setLoaded(true)
  }, [byId])

  useEffect(() => {
    if (!loaded) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)) } catch {}
  }, [cart, loaded])

  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false })
  const [bump, setBump] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setQty = useCallback((item: SaleItem, n: number) => {
    const q = Math.max(0, Math.min(maxQty(item), n))
    setCart((c) => {
      const next = { ...c }
      if (q === 0) delete next[item.variantId]; else next[item.variantId] = q
      return next
    })
    if (n > 0) {
      setBump(true)
      setTimeout(() => setBump(false), 340)
      setToast({ msg: `${item.brand} ${item.name}`, show: true })
      if (toastTimer.current) clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 1600)
    }
  }, [])

  const lines = useMemo(() => items.filter((i) => cart[i.variantId] > 0).map((i) => ({ item: i, qty: cart[i.variantId] })), [items, cart])
  const count = lines.reduce((s, l) => s + l.qty, 0)
  const subtotal = lines.reduce((s, l) => s + l.qty * l.item.price, 0)
  const wasTotal = lines.reduce((s, l) => s + l.qty * l.item.original, 0)
  const saved = wasTotal - subtotal

  // ── Browsing ──────────────────────────────────────────────────────────────
  const [cat, setCat] = useState('all')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('default')
  const [band, setBand] = useState<PriceBand>('all')

  const categories = useMemo(() => {
    const m = new Map<string, { label: string; n: number }>()
    for (const i of items) m.set(i.category, { label: i.categoryLabel, n: (m.get(i.category)?.n ?? 0) + 1 })
    return [...m.entries()].map(([value, v]) => ({ value, ...v })).sort((a, b) => b.n - a.n)
  }, [items])

  const visible = useMemo(() => {
    const t = q.trim().toLowerCase()
    let list = items.filter((i) => {
      if (cat !== 'all' && i.category !== cat) return false
      if (band === 'u60' && i.price >= 60) return false
      if (band === 'mid' && (i.price < 60 || i.price > 100)) return false
      if (band === 'o100' && i.price <= 100) return false
      if (t && !`${i.brand} ${i.name} ${i.description}`.toLowerCase().includes(t)) return false
      return true
    })
    if (sort === 'low') list = [...list].sort((a, b) => a.price - b.price)
    if (sort === 'high') list = [...list].sort((a, b) => b.price - a.price)
    if (sort === 'off') list = [...list].sort((a, b) => pct(b) - pct(a) || (b.original - b.price) - (a.original - a.price))
    if (sort === 'name') list = [...list].sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`))
    return list
  }, [items, cat, q, band, sort])

  const topPct = items.length ? Math.max(...items.map(pct)) : 50
  const drops = useMemo(
    () => [...items].filter((i) => maxQty(i) > 0).sort((a, b) => pct(b) - pct(a) || (b.original - b.price) - (a.original - a.price)).slice(0, 4),
    [items]
  )
  const lowest = items.length ? Math.min(...items.map((i) => i.price)) : 0

  // ── Overlays ──────────────────────────────────────────────────────────────
  const [quick, setQuick] = useState<SaleItem | null>(null)
  const [bagOpen, setBagOpen] = useState(false)
  const [step, setStep] = useState<'bag' | 'details'>('bag')
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const bagCloseRef = useRef<HTMLButtonElement | null>(null)

  const closeAll = useCallback(() => { setQuick(null); setBagOpen(false) }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeAll() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeAll])
  useEffect(() => { if (quick) closeRef.current?.focus() }, [quick])
  useEffect(() => { if (bagOpen) bagCloseRef.current?.focus() }, [bagOpen])
  useEffect(() => { if (bagOpen && count === 0) setStep('bag') }, [bagOpen, count])

  const quickLive = quick ? byId.get(quick.variantId) ?? quick : null

  // ── Checkout ──────────────────────────────────────────────────────────────
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>('delivery')
  const [branch, setBranch] = useState('osu')
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', city: 'Accra', notes: '' })
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const deliveryFee = fulfillment === 'delivery' && subtotal > 0 && subtotal < FREE_DELIVERY_MINIMUM ? DELIVERY_FEE : 0
  const total = subtotal + deliveryFee
  const toFree = Math.max(0, FREE_DELIVERY_MINIMUM - subtotal)

  const pay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (paying || lines.length === 0) return
    setPaying(true)
    setError('')
    try {
      const res = await fetch('/api/clearance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lines.map((l) => ({ variantId: l.item.variantId, quantity: l.qty })),
          customer: { firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone },
          fulfillment,
          branch: fulfillment === 'pickup' ? branch : undefined,
          address: fulfillment === 'delivery' ? form.address : undefined,
          city: fulfillment === 'delivery' ? form.city : undefined,
          notes: form.notes,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.authorizationUrl) {
        setError(json.error ?? 'Something went wrong. Try again.')
        if (res.status === 409 || res.status === 403) router.refresh()
        setPaying(false)
        return
      }
      window.location.href = json.authorizationUrl
    } catch {
      setError('We could not reach the payment page. Check your connection and try again.')
      setPaying(false)
    }
  }

  const range = `${day(campaign.startsAt)} to ${day(campaign.endsAt)} ${monthName(campaign.endsAt)}`

  return (
    <>
      {preview && (
        <div className="clr-preview">
          Preview only. {win === 'upcoming' ? `Orders open on ${dayLabel(campaign.startsAt)}.` : 'The sale is closed, so orders are switched off.'}
        </div>
      )}

      <header className="clr-top">
        <div className="clr-wrap clr-top-in">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="clr-logo" src="/clearance/logo-light.png" alt="Discount Beauty Barr" width={103} height={44} />
          {showShop && (
            <button type="button" className="clr-bagbtn" data-bump={bump} onClick={() => { setStep('bag'); setBagOpen(true) }} aria-label={`Open bag, ${count} items`}>
              <ShoppingBag size={18} />
              <span>Bag</span>
              <span className="clr-bagcount">{count}</span>
            </button>
          )}
        </div>
      </header>

      <section className="clr-hero">
        <div className="clr-wrap clr-hero-grid">
          <div>
            {win === 'ended' && !showShop ? (
              <>
                <h1 className="clr-title"><span className="clr-title-small" style={{ fontSize: 'clamp(44px, 9vw, 92px)', lineHeight: 1 }}>The clearance sale has ended</span></h1>
                <p className="clr-lede">Thank you to everyone who shopped with us. Keep an eye on our social pages for what comes next.</p>
              </>
            ) : win === 'upcoming' && !showShop ? (
              <>
                <h1 className="clr-title">
                  <span className="clr-title-small">Opens</span>
                  <span className="clr-title-big">{day(campaign.startsAt)}</span>
                  <span className="clr-title-small">{monthName(campaign.startsAt)}</span>
                </h1>
                <p className="clr-lede">Ninety-five beauty products, marked down for a few days only, online and in store. Come back when the countdown ends.</p>
                <p className="clr-count-label">Sale opens in</p>
                <Countdown target={campaign.startsAt} serverNow={serverNow} />
              </>
            ) : (
              <>
                <h1 className="clr-title">
                  <span className="clr-title-small">Up to</span>
                  <span className="clr-title-big">{topPct}%</span>
                  <span className="clr-title-small">off</span>
                </h1>
                <p className="clr-lede">{items.length} beauty products marked down for a few days only. When a product sells out, it is gone.</p>
                <p className="clr-dates">{range}</p>
                {win !== 'ended' && (
                  <>
                    <p className="clr-count-label">{win === 'upcoming' ? 'Sale opens in' : 'Sale ends in'}</p>
                    <Countdown target={win === 'upcoming' ? campaign.startsAt : campaign.endsAt} serverNow={serverNow} />
                  </>
                )}
                <a className="clr-cta" href="#shop">Shop the sale <ArrowRight size={18} /></a>
              </>
            )}
          </div>

          <figure className="clr-flyer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/clearance/flyer.jpg" alt="Big Clearance Sales flyer: massive discounts on selected makeup, skincare and beauty essentials, online and walk-in." width={900} height={1142} fetchPriority="high" />
          </figure>

          {showShop && drops.length > 0 && (
            <aside className="clr-drops" aria-label="Biggest price drops">
              <h2>Biggest drops</h2>
              <div className="clr-drops-list">
              {drops.map((d) => (
                <button type="button" className="clr-drop" key={d.variantId} onClick={() => setQuick(d)}>
                  <span>{d.brand} {d.name}</span>
                  <small>{fmt(d.price)} <s>{fmt(d.original)}</s></small>
                  <span className="clr-drop-off">-{pct(d)}%</span>
                </button>
              ))}
              </div>
            </aside>
          )}
        </div>
      </section>

      {showShop && (
        <main className="clr-wrap clr-shop" id="shop">
          <div className="clr-bar">
            <div className="clr-bar-row">
              <label className="clr-search">
                <Search size={18} />
                <input id="clr-search" type="search" inputMode="search" enterKeyHint="search" autoComplete="off" autoCorrect="off" placeholder="Search brand or product" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search products" />
              </label>
              <select id="clr-sort" className="clr-select" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort products">
                <option value="default">Featured</option>
                <option value="off">Biggest discount</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
                <option value="name">Brand A to Z</option>
              </select>
            </div>
            <div className="clr-chips" role="group" aria-label="Category">
              <button type="button" className="clr-chip" aria-pressed={cat === 'all'} onClick={() => setCat('all')}>All<small>{items.length}</small></button>
              {categories.map((c) => (
                <button type="button" className="clr-chip" key={c.value} aria-pressed={cat === c.value} onClick={() => setCat(c.value)}>{c.label}<small>{c.n}</small></button>
              ))}
            </div>
            <div className="clr-chips" role="group" aria-label="Price">
              {([['all', 'Any price'], ['u60', `Under ${fmt(60)}`], ['mid', `${fmt(60)} to ${fmt(100)}`], ['o100', `Over ${fmt(100)}`]] as [PriceBand, string][]).map(([v, l]) => (
                <button type="button" className="clr-chip" key={v} aria-pressed={band === v} onClick={() => setBand(v)}>{l}</button>
              ))}
            </div>
          </div>

          <p className="clr-found" aria-live="polite">{visible.length} {visible.length === 1 ? 'product' : 'products'}, from {fmt(lowest)}</p>

          <div className="clr-grid">
            {visible.length === 0 && (
              <div className="clr-empty">
                <p>Nothing matches those filters.</p>
                <button type="button" onClick={() => { setQ(''); setCat('all'); setBand('all') }}>Clear filters</button>
              </div>
            )}
            {visible.map((i) => {
              const qty = cart[i.variantId] ?? 0
              const left = i.remaining
              return (
                <article className="clr-card" key={i.variantId} data-soldout={left === 0}>
                  <button type="button" className="clr-tilebtn" onClick={() => setQuick(i)} aria-label={`View ${i.brand} ${i.name}`}>
                    <Tile item={i} />
                  </button>
                  <span className="clr-seal">-{pct(i)}%</span>
                  {left > 0 && left <= 5 && <span className="clr-left">{left} left</span>}
                  {left === 0 && <span className="clr-sold" aria-hidden="true">Sold out</span>}
                  <div className="clr-info">
                    <span className="clr-brand">{i.brand}</span>
                    <h3 className="clr-name">{i.name}</h3>
                    {i.variant && i.variant !== i.name && <span className="clr-variant">{i.variant}</span>}
                    <div className="clr-price">
                      <span className="clr-now">{fmt(i.price)}</span>
                      <span className="clr-was">{fmt(i.original)}</span>
                      <span className="clr-save">You save {fmt(i.original - i.price)}</span>
                    </div>
                    <AddControl item={i} qty={qty} onSet={(n) => setQty(i, n)} />
                  </div>
                </article>
              )
            })}
          </div>
        </main>
      )}

      <footer className="clr-foot">
        <div className="clr-wrap">
          <p>Discount Beauty Barr, Osu and East Legon, Accra. Prices in Ghana cedis. Clearance stock is limited and cannot be reserved. Delivery is {fmt(DELIVERY_FEE)}, free on orders of {fmt(FREE_DELIVERY_MINIMUM)} or more. Pay by card or mobile money through Paystack.</p>
        </div>
      </footer>

      {/* Mobile bag bar */}
      {showShop && (
        <div className="clr-bar-bag" data-hide={count === 0 || bagOpen || !!quick}>
          <button type="button" onClick={() => { setStep('bag'); setBagOpen(true) }}>
            <span>View bag, {count} {count === 1 ? 'item' : 'items'}</span>
            <b>{fmt(subtotal)}</b>
          </button>
        </div>
      )}

      <div className={`clr-toast`} data-show={toast.show} role="status" aria-live="polite">
        <Check size={16} /> Added {toast.msg}
      </div>

      {/* Quick view */}
      <div className="clr-scrim" data-open={!!quick} onClick={closeAll} />
      <div className="clr-sheet" data-kind="quick" data-open={!!quick} role="dialog" aria-modal="true" aria-label="Product details" aria-hidden={!quick}>
        {quickLive && (
          <div className="clr-qv">
            <div className="clr-sheet-head">
              <span className="clr-brand">{quickLive.brand} · {quickLive.categoryLabel}</span>
              <button type="button" className="clr-x" ref={closeRef} onClick={closeAll} aria-label="Close"><X size={20} /></button>
            </div>
            <Tile item={quickLive} className="clr-qv-tile" />
            <h3>{quickLive.name}</h3>
            {quickLive.variant && quickLive.variant !== quickLive.name && <p className="clr-variant">{quickLive.variant}</p>}
            <div className="clr-price" style={{ paddingTop: 12 }}>
              <span className="clr-now" style={{ fontSize: 32 }}>{fmt(quickLive.price)}</span>
              <span className="clr-was">{fmt(quickLive.original)}</span>
              <span className="clr-seal" style={{ position: 'static' }}>-{pct(quickLive)}%</span>
            </div>
            <p className="clr-save" style={{ marginTop: 4 }}>You save {fmt(quickLive.original - quickLive.price)}</p>
            {quickLive.description && <p className="clr-qv-desc">{quickLive.description}</p>}
            <div className="clr-meter" aria-hidden="true"><i style={{ width: `${Math.max(4, (quickLive.remaining / Math.max(quickLive.total, 1)) * 100)}%` }} /></div>
            <p className="clr-meter-text">{quickLive.remaining === 0 ? 'Sold out' : `${quickLive.remaining} of ${quickLive.total} left`}</p>
            <AddControl item={quickLive} qty={cart[quickLive.variantId] ?? 0} onSet={(n) => setQty(quickLive, n)} />
          </div>
        )}
      </div>

      {/* Bag and checkout */}
      <div className="clr-scrim" data-open={bagOpen} onClick={closeAll} />
      <div className="clr-sheet" data-kind="bag" data-open={bagOpen} role="dialog" aria-modal="true" aria-label="Your bag" aria-hidden={!bagOpen}>
        <div className="clr-sheet-head">
          <h2>{step === 'bag' ? 'Your bag' : 'Checkout'}</h2>
          <button type="button" className="clr-x" ref={bagCloseRef} onClick={closeAll} aria-label="Close bag"><X size={20} /></button>
        </div>

        {lines.length === 0 ? (
          <div className="clr-bag-empty">
            <p>Your bag is empty. Add a few deals and they will wait here.</p>
            <button type="button" className="clr-primary" onClick={closeAll}>Keep shopping</button>
          </div>
        ) : step === 'bag' ? (
          <>
            <div className="clr-ship">
              <p>{toFree > 0 ? `Add ${fmt(toFree)} more for free delivery` : 'You have unlocked free delivery'}</p>
              <div className="clr-meter" aria-hidden="true"><i style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_MINIMUM) * 100)}%` }} /></div>
            </div>
            {lines.map(({ item, qty }) => (
              <div className="clr-line" key={item.variantId}>
                <div>
                  <div className="clr-line-name">{item.brand} {item.name}</div>
                  <div className="clr-line-sub">{item.variant && item.variant !== item.name ? `${item.variant} · ` : ''}{fmt(item.price)} each</div>
                </div>
                <div className="clr-line-total">{fmt(item.price * qty)}</div>
                <Stepper qty={qty} max={maxQty(item)} onSet={(n) => setQty(item, n)} label={`${item.brand} ${item.name}`} />
              </div>
            ))}
            <div className="clr-sum">
              <div><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
              <div className="clr-sum-save"><span>You save</span><span>{fmt(saved)}</span></div>
              <div><span>Delivery</span><span>Added at checkout</span></div>
            </div>
            <button type="button" className="clr-primary" onClick={() => setStep('details')} disabled={win !== 'live'}>
              {win === 'live' ? <>Continue to checkout <ArrowRight size={18} /></> : 'Orders open when the sale starts'}
            </button>
          </>
        ) : (
          <form className="clr-form" onSubmit={pay}>
            <div className="clr-seg" role="group" aria-label="How do you want it">
              <button type="button" aria-pressed={fulfillment === 'delivery'} onClick={() => setFulfillment('delivery')}><Truck size={18} /> Delivery</button>
              <button type="button" aria-pressed={fulfillment === 'pickup'} onClick={() => setFulfillment('pickup')}><Store size={18} /> Pickup</button>
            </div>

            <div className="clr-two">
              <label className="clr-field">First name<input id="clr-first" required autoComplete="given-name" value={form.firstName} onChange={set('firstName')} /></label>
              <label className="clr-field">Last name<input id="clr-last" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} /></label>
            </div>
            <label className="clr-field">Email<input id="clr-email" type="email" inputMode="email" required autoComplete="email" autoCapitalize="none" value={form.email} onChange={set('email')} /></label>
            <label className="clr-field">Phone number<input id="clr-phone" type="tel" inputMode="tel" required autoComplete="tel" value={form.phone} onChange={set('phone')} /></label>

            {fulfillment === 'delivery' ? (
              <>
                <label className="clr-field">Delivery address<input id="clr-address" required autoComplete="street-address" value={form.address} onChange={set('address')} /></label>
                <label className="clr-field">City<input id="clr-city" autoComplete="address-level2" value={form.city} onChange={set('city')} /></label>
              </>
            ) : (
              <label className="clr-field">Pick up from
                <select id="clr-branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
                  {BRANCHES.map((b) => <option key={b.id} value={b.id}>{b.name}, {b.address}</option>)}
                </select>
              </label>
            )}
            <label className="clr-field">Note for the team (optional)<textarea id="clr-notes" rows={2} value={form.notes} onChange={set('notes')} /></label>

            <div className="clr-sum">
              <div><span>Subtotal ({count} {count === 1 ? 'item' : 'items'})</span><span>{fmt(subtotal)}</span></div>
              <div className="clr-sum-save"><span>You save</span><span>{fmt(saved)}</span></div>
              <div><span>Delivery</span><span>{fulfillment === 'pickup' ? 'Free' : deliveryFee === 0 ? 'Free' : fmt(deliveryFee)}</span></div>
              <div className="clr-sum-total"><span>Total</span><span>{fmt(total)}</span></div>
            </div>

            {error && <div className="clr-err" role="alert">{error}</div>}
            <button type="submit" className="clr-primary" disabled={paying}>{paying ? 'Opening Paystack…' : `Pay ${fmt(total)}`}</button>
            <button type="button" className="clr-ghost" onClick={() => { setError(''); setStep('bag') }}>Back to bag</button>
            <p className="clr-note">You will pay on Paystack with card or mobile money.</p>
          </form>
        )}
      </div>
    </>
  )
}
