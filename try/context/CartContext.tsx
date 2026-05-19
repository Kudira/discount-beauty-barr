'use client'

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type { CartItem } from '@/types'
import { DELIVERY_FEE, FREE_DELIVERY_MINIMUM } from '@/lib/constants'

// ── State ─────────────────────────────────────────────────────────────────────
interface CartState {
  items: CartItem[]
  isOpen: boolean
}

const initialState: CartState = { items: [], isOpen: false }

// ── Actions ───────────────────────────────────────────────────────────────────
type CartAction =
  | { type: 'ADD_ITEM';      payload: CartItem }
  | { type: 'REMOVE_ITEM';   payload: { productId: string; variantId: string } }
  | { type: 'UPDATE_QTY';    payload: { productId: string; variantId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE';       payload: CartItem[] }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {

    case 'HYDRATE':
      return { ...state, items: action.payload }

    case 'ADD_ITEM': {
      const existing = state.items.find(
        (i) => i.productId === action.payload.productId && i.variantId === action.payload.variantId
      )
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.productId === action.payload.productId && i.variantId === action.payload.variantId
              ? { ...i, quantity: i.quantity + action.payload.quantity }
              : i
          ),
        }
      }
      return { ...state, items: [...state.items, action.payload] }
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(
          (i) => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)
        ),
      }

    case 'UPDATE_QTY':
      if (action.payload.quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(
            (i) => !(i.productId === action.payload.productId && i.variantId === action.payload.variantId)
          ),
        }
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.productId === action.payload.productId && i.variantId === action.payload.variantId
            ? { ...i, quantity: action.payload.quantity }
            : i
        ),
      }

    case 'CLEAR_CART':
      return { ...state, items: [] }

    default:
      return state
  }
}

// ── Derived values ────────────────────────────────────────────────────────────
function computeCart(items: CartItem[]) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const deliveryFee = subtotal >= FREE_DELIVERY_MINIMUM || subtotal === 0 ? 0 : DELIVERY_FEE
  const total = subtotal + deliveryFee
  return { subtotal, itemCount, deliveryFee, total }
}

// ── Context ───────────────────────────────────────────────────────────────────
interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  deliveryFee: number
  total: number
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId: string) => void
  updateQty: (productId: string, variantId: string, quantity: number) => void
  clearCart: () => void
  isInCart: (productId: string, variantId: string) => boolean
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'dbb_cart'

// ── Provider ──────────────────────────────────────────────────────────────────
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[]
        dispatch({ type: 'HYDRATE', payload: parsed })
      }
    } catch {
      // ignore
    }
  }, [])

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    } catch {
      // ignore
    }
  }, [state.items])

  const addItem = useCallback((item: CartItem) => dispatch({ type: 'ADD_ITEM', payload: item }), [])
  const removeItem = useCallback((productId: string, variantId: string) =>
    dispatch({ type: 'REMOVE_ITEM', payload: { productId, variantId } }), [])
  const updateQty = useCallback((productId: string, variantId: string, quantity: number) =>
    dispatch({ type: 'UPDATE_QTY', payload: { productId, variantId, quantity } }), [])
  const clearCart = useCallback(() => dispatch({ type: 'CLEAR_CART' }), [])
  const isInCart = useCallback((productId: string, variantId: string) =>
    state.items.some((i) => i.productId === productId && i.variantId === variantId), [state.items])

  const { subtotal, itemCount, deliveryFee, total } = computeCart(state.items)

  return (
    <CartContext.Provider value={{ items: state.items, itemCount, subtotal, deliveryFee, total, addItem, removeItem, updateQty, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
