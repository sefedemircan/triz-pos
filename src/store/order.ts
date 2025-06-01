import { create } from 'zustand'
import { Database } from '@/lib/types/database'

type Order = Database['public']['Tables']['orders']['Row']
type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  product: Database['public']['Tables']['products']['Row']
}
type Product = Database['public']['Tables']['products']['Row']

interface CartItem {
  product: Product
  quantity: number
  notes?: string
}

interface OrderState {
  currentOrder: Order | null
  orderItems: OrderItem[]
  cart: CartItem[]
  selectedTableId: string | null
  
  // Cart actions
  addToCart: (product: Product, quantity?: number, notes?: string) => void
  removeFromCart: (productId: string) => void
  updateCartQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  
  // Order actions
  setCurrentOrder: (order: Order | null) => void
  setOrderItems: (items: OrderItem[]) => void
  setSelectedTable: (tableId: string | null) => void
  
  // Calculations
  getCartTotal: () => number
  getCartItemCount: () => number
}

export const useOrderStore = create<OrderState>((set, get) => ({
  currentOrder: null,
  orderItems: [],
  cart: [],
  selectedTableId: null,
  
  addToCart: (product, quantity = 1, notes) => {
    const { cart } = get()
    const existingItem = cart.find(item => item.product.id === product.id)
    
    if (existingItem) {
      set({
        cart: cart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
            : item
        )
      })
    } else {
      set({
        cart: [...cart, { product, quantity, notes }]
      })
    }
  },
  
  removeFromCart: (productId) => {
    const { cart } = get()
    set({
      cart: cart.filter(item => item.product.id !== productId)
    })
  },
  
  updateCartQuantity: (productId, quantity) => {
    const { cart } = get()
    if (quantity <= 0) {
      get().removeFromCart(productId)
      return
    }
    
    set({
      cart: cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    })
  },
  
  clearCart: () => set({ cart: [] }),
  
  setCurrentOrder: (order) => set({ currentOrder: order }),
  setOrderItems: (items) => set({ orderItems: items }),
  setSelectedTable: (tableId) => set({ selectedTableId: tableId }),
  
  getCartTotal: () => {
    const { cart } = get()
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  },
  
  getCartItemCount: () => {
    const { cart } = get()
    return cart.reduce((count, item) => count + item.quantity, 0)
  }
})) 