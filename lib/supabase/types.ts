export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'customer' | 'cashier' | 'manager' | 'admin'| 'super_admin'
export type BranchId = 'osu' | 'east-legon'
export type ProductCategory = 'skincare' | 'makeup' | 'haircare' | 'fragrance' | 'tools' | 'body' | 'wellness' | 'oral-care' | 'personal' | 'intimate' | 'home'
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled' | 'refunded'
export type FulfillmentType = 'delivery' | 'pickup'
export type PaymentMethod = 'card' | 'mobile_money' | 'cash' | 'bank_transfer'
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          role: UserRole
          branch_id: BranchId | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          branch_id?: BranchId | null
          avatar_url?: string | null
        }
        Update: {
          email?: string
          full_name?: string | null
          phone?: string | null
          role?: UserRole
          branch_id?: BranchId | null
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          id: BranchId
          name: string
          address: string
          phone: string | null
          email: string | null
          opening_hours: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['branches']['Row'], 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['branches']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category: ProductCategory
          brand: string
          images: string[]
          base_price: number
          is_featured: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          name: string
          sku: string
          price: number
          images: string[]
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['product_variants']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
      inventory: {
        Row: {
          id: string
          variant_id: string
          branch_id: BranchId
          quantity: number
          low_stock_threshold: number
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['inventory']['Row'], 'id' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['inventory']['Row'], 'id'>>
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string | null
          branch_id: BranchId | null
          status: OrderStatus
          fulfillment: FulfillmentType
          customer_name: string
          customer_email: string
          customer_phone: string | null
          delivery_address: string | null
          delivery_city: string | null
          notes: string | null
          subtotal: number
          delivery_fee: number
          discount: number
          processing_fee?: number
          total: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at'>>
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          variant_id: string | null
          product_name: string
          variant_name: string
          brand: string
          sku: string
          price: number
          quantity: number
          subtotal: number
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'subtotal'>
        Update: Partial<Pick<Database['public']['Tables']['order_items']['Row'], 'quantity'>>
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          order_id: string
          method: PaymentMethod
          status: PaymentStatus
          amount: number
          reference: string
          paystack_reference: string | null
          paid_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: {
      products_with_variants: {
        Row: Database['public']['Tables']['products']['Row'] & {
          variant_count: number
          min_price: number
          max_price: number
        }
        Relationships: []
      }
      low_stock_alerts: {
        Row: {
          id: string
          branch_id: BranchId
          quantity: number
          low_stock_threshold: number
          variant_name: string
          sku: string
          product_name: string
          brand: string
          category: ProductCategory
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_role: { Returns: UserRole }
      is_staff: { Returns: boolean }
      is_admin_or_manager: { Returns: boolean }
    }
  }
}

// Convenience row types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Branch = Database['public']['Tables']['branches']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductVariant = Database['public']['Tables']['product_variants']['Row']
export type Inventory = Database['public']['Tables']['inventory']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']
export type LowStockAlert = Database['public']['Views']['low_stock_alerts']['Row']
