// ─── Product ─────────────────────────────────────────────────────────────────
export type ProductCategory =
  | 'skincare'
  | 'makeup'
  | 'haircare'
  | 'fragrance'
  | 'tools'
  | 'body'

export type ProductVariant = {
  id: string
  name: string       // e.g. "30ml", "Shade: Ivory"
  sku: string
  price: number
  stock: number
  images?: string[]  // variant-specific images (swatches etc.)
}

export type Product = {
  id: string
  name: string
  slug: string
  description: string
  category: ProductCategory
  brand: string
  images: string[]        // product-level images
  variants: ProductVariant[]
  basePrice: number
  isFeatured: boolean
  isActive: boolean
  createdAt: string
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export type CartItem = {
  productId: string
  variantId: string
  name: string
  brand: string
  image: string
  variantName: string
  price: number
  quantity: number
  sku: string
}

export type Cart = {
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
}

// ─── Branch / Location ───────────────────────────────────────────────────────
export type BranchId = 'osu' | 'east-legon'

export type Branch = {
  id: BranchId
  name: string
  address: string
  phone: string
  email: string
  openingHours: string
  coordinates?: { lat: number; lng: number }
}

// ─── Order ───────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'refunded'

export type FulfillmentType = 'delivery' | 'pickup'

export type Order = {
  id: string
  customerId: string
  branchId: BranchId
  items: CartItem[]
  status: OrderStatus
  fulfillment: FulfillmentType
  subtotal: number
  discount: number
  deliveryFee: number
  total: number
  paymentMethod: string
  paymentReference?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// ─── User / Auth ─────────────────────────────────────────────────────────────
export type UserRole = 'customer' | 'cashier' | 'manager' | 'admin'

export type UserProfile = {
  id: string
  email: string
  fullName: string
  phone?: string
  role: UserRole
  branchId?: BranchId   // assigned branch for staff
  createdAt: string
}

// ─── Inventory ───────────────────────────────────────────────────────────────
export type InventoryRecord = {
  id: string
  productId: string
  variantId: string
  branchId: BranchId
  quantity: number
  lowStockThreshold: number
  updatedAt: string
}

// ─── Payment ─────────────────────────────────────────────────────────────────
export type PaymentMethod = 'card' | 'mobile_money' | 'cash' | 'bank_transfer'

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'

export type Payment = {
  id: string
  orderId: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  reference: string
  paystackReference?: string
  createdAt: string
}
