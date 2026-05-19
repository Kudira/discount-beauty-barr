'use client'

import { createContext, useContext, useReducer, useEffect, useCallback, useState, type ReactNode } from 'react'
import type { CartItem } from '@/types'
import { DELIVERY_FEE, FREE_DELIVERY_MINIMUM } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'

interface CartState { items: CartItem[] }
const initialState: CartState = { items: [] }

type CartAction =
  | { type: 'ADD_ITEM';    payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { productId: string; variantId: string } }
  | { type: 'UPDATE_QTY';  payload: { productId: string; variantId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE';     payload: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'HYDRATE': return { ...state, items: action.payload }
    case 'ADD_ITEM': {
      const existing = state.items.find(i => i.productId === action.payload.productId && i.variantId === action.payload.variantId)
      if (existing) return { ...state, items: state.items.map(i =>
        i.productId === action.payload.productId && i.variantId === action.payload.variantId
          ? { ...i, quantity: i.quantity + action.payload.quantity } : i
      )}
      return { ...state, items: [...state.items, action.payload] }
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)) }
    case 'UPDATE_QTY':
      if (action.payload.quantity <= 0) return { ...state, items: state.items.filter(i => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)) }
      return { ...state, items: state.items.map(i => i.productId === action.payload.productId && i.variantId === action.payload.variantId ? { ...i, quantity: action.payload.quantity } : i) }
    case 'CLEAR_CART': return { ...state, items: [] }
    default: return state
  }
}

function computeCart(items: CartItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)
  const deliveryFee = subtotal >= FREE_DELIVERY_MINIMUM || subtotal === 0 ? 0 : DELIVERY_FEE
  return { subtotal, itemCount, deliveryFee, total: subtotal + deliveryFee }
}

interface CartContextValue {
  items: CartItem[]; itemCount: number; subtotal: number; deliveryFee: number; total: number
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId: string) => void
  updateQty: (productId: string, variantId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string, variantId: string) => boolean
}

const CartContext = createContext<CartContextValue | null>(null)

function storageKey(userId?: string | null) {
  return userId ? `dbb_cart_${userId}` : 'dbb_cart_guest'
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)
  const [key, setKey] = useState('dbb_cart_guest')

  useEffect(() => {
    const supabase = createClient()

    const load = (k: string) => {
      try {
        const raw = localStorage.getItem(k)
        dispatch({ type: 'HYDRATE', payload: raw ? (JSON.parse(raw) as CartItem[]) : [] })
      } catch {}
    }

    // Load initial session
    supabase.auth.getSession().then(({ data }) => {
      const k = storageKey(data.session?.user?.id)
      setKey(k)
      load(k)
    })

    // Watch auth changes — swap cart when user logs in/out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const k = storageKey(session?.user?.id)
      setKey(k)
      load(k)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Persist cart on every change
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(state.items)) } catch {}
  }, [state.items, key])

  const addItem = useCallback((item: CartItem) => dispatch({ type: 'ADD_ITEM', payload: item }), [])
  const removeItem = useCallback((productId: string, variantId: string) => dispatch({ type: 'REMOVE_ITEM', payload: { productId, variantId } }), [])
  const updateQty = useCallback((productId: string, variantId: string, quantity: number) => dispatch({ type: 'UPDATE_QTY', payload: { productId, variantId, quantity } }), [])
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), [])
  const isInCart = useCallback((productId: string, variantId: string) => state.items.some(i => i.productId === productId && i.variantId === variantId), [state.items])

  const { subtotal, itemCount, deliveryFee, total } = computeCart(state.items)

  return (
    <CartContext.Provider value={{ items: state.items, itemCount, subtotal, deliveryFee, total, addItem, removeItem, updateQty, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
