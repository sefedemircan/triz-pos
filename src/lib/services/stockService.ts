import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/types/database'

type ProductRecipe = Database['public']['Tables']['product_recipes']['Row'] & {
  stock_items?: Database['public']['Tables']['stock_items']['Row']
}

interface StockRequirement {
  stock_item_id: string
  quantity_needed: number
  current_stock: number
  is_critical: boolean
  stock_item_name: string
  unit: string
}

interface StockCheckResult {
  canFulfill: boolean
  requirements: StockRequirement[]
  insufficientItems: StockRequirement[]
}

interface OrderItem {
  product_id: string
  quantity: number
}

/**
 * Sipariş için gerekli stok kontrolü yapar
 */
export async function checkStockAvailability(orderItems: OrderItem[]): Promise<StockCheckResult> {
  const supabase = createClient()
  
  const allRequirements: StockRequirement[] = []
  const insufficientItems: StockRequirement[] = []

  try {
    // Her ürün için reçete ve stok bilgilerini getir
    for (const orderItem of orderItems) {
      const { data: recipes, error } = await supabase
        .from('product_recipes')
        .select(`
          *,
          stock_items (
            id,
            name,
            current_stock,
            unit,
            min_stock_level
          )
        `)
        .eq('product_id', orderItem.product_id)

      if (error) throw error

      // Her reçete malzemesi için gerekli miktarı hesapla
      recipes?.forEach((recipe: ProductRecipe) => {
        const stockItem = recipe.stock_items
        if (!stockItem) return

        const totalNeeded = recipe.quantity_needed * orderItem.quantity
        const requirement: StockRequirement = {
          stock_item_id: stockItem.id,
          quantity_needed: totalNeeded,
          current_stock: stockItem.current_stock,
          is_critical: recipe.is_critical,
          stock_item_name: stockItem.name,
          unit: stockItem.unit,
        }

        // Aynı malzeme birden fazla ürünün reçetesinde varsa topla
        const existingReq = allRequirements.find(req => req.stock_item_id === stockItem.id)
        if (existingReq) {
          existingReq.quantity_needed += totalNeeded
        } else {
          allRequirements.push(requirement)
        }
      })
    }

    // Yetersiz stok kontrolü
    allRequirements.forEach(req => {
      if (req.current_stock < req.quantity_needed) {
        insufficientItems.push(req)
      }
    })

    return {
      canFulfill: insufficientItems.length === 0,
      requirements: allRequirements,
      insufficientItems,
    }

  } catch (error) {
    console.error('Stock check error:', error)
    throw new Error('Stok kontrolü yapılırken hata oluştu')
  }
}

/**
 * Sipariş onaylandığında stok düşümü yapar
 */
export async function deductStockForOrder(
  orderItems: OrderItem[], 
  orderId: string, 
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  try {
    // Önce stok kontrolü yap
    const stockCheck = await checkStockAvailability(orderItems)
    
    if (!stockCheck.canFulfill) {
      throw new Error('Yetersiz stok nedeniyle sipariş işlenemiyor')
    }

    // Her stok kalemi için düşüm yap
    for (const requirement of stockCheck.requirements) {
      const newStock = requirement.current_stock - requirement.quantity_needed

      // Stok hareketini kaydet
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          stock_item_id: requirement.stock_item_id,
          movement_type: 'out',
          quantity: requirement.quantity_needed,
          previous_stock: requirement.current_stock,
          new_stock: newStock,
          reference_type: 'order',
          reference_id: orderId,
          user_id: userId,
          notes: `Sipariş #${orderId} için otomatik stok düşümü`,
        })

      if (movementError) throw movementError
    }

    return true

  } catch (error) {
    console.error('Stock deduction error:', error)
    throw error
  }
}

/**
 * Sipariş iptal edildiğinde stok iadesi yapar
 */
export async function restoreStockForOrder(
  orderItems: OrderItem[], 
  orderId: string, 
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  try {
    // Önceki stok hareketlerini bul
    const { data: movements, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('reference_id', orderId)
      .eq('reference_type', 'order')
      .eq('movement_type', 'out')

    if (error) throw error

    // Her stok hareketi için iade yap
    for (const movement of movements || []) {
      // Mevcut stok seviyesini al
      const { data: stockItem, error: stockError } = await supabase
        .from('stock_items')
        .select('current_stock')
        .eq('id', movement.stock_item_id)
        .single()

      if (stockError) throw stockError

      const newStock = stockItem.current_stock + movement.quantity

      // İade hareketini kaydet
      const { error: restoreError } = await supabase
        .from('stock_movements')
        .insert({
          stock_item_id: movement.stock_item_id,
          movement_type: 'in',
          quantity: movement.quantity,
          previous_stock: stockItem.current_stock,
          new_stock: newStock,
          reference_type: 'order_cancel',
          reference_id: orderId,
          user_id: userId,
          notes: `Sipariş #${orderId} iptali - stok iadesi`,
        })

      if (restoreError) throw restoreError
    }

    return true

  } catch (error) {
    console.error('Stock restore error:', error)
    throw error
  }
}

/**
 * Ürün için üretilebilir porsiyon sayısını hesaplar
 */
export async function getProductionCapacity(productId: string): Promise<number> {
  const supabase = createClient()

  try {
    const { data: recipes, error } = await supabase
      .from('product_recipes')
      .select(`
        quantity_needed,
        stock_items (
          current_stock
        )
      `)
      .eq('product_id', productId)

    if (error) throw error

    if (!recipes || recipes.length === 0) {
      return Infinity // Reçetesi olmayan ürünler sınırsız
    }

    // En az stoka sahip malzemeye göre hesapla
    const capacities = recipes.map(recipe => {
      const stockItem = recipe.stock_items
      if (!stockItem || !Array.isArray(stockItem)) return 0
      const stock = stockItem[0] // İlk elemanı al
      if (!stock) return 0
      return Math.floor(stock.current_stock / recipe.quantity_needed)
    })

    return Math.min(...capacities)

  } catch (error) {
    console.error('Production capacity error:', error)
    return 0
  }
}

/**
 * Kritik stok seviyesindeki malzemeleri listeler
 */
export async function getCriticalStockItems(): Promise<StockRequirement[]> {
  const supabase = createClient()

  try {
    const { data: stockItems, error } = await supabase
      .from('stock_items')
      .select('*')
      .lte('current_stock', 'min_stock_level')
      .eq('is_active', true)
      .order('current_stock')

    if (error) throw error

    return (stockItems || []).map(item => ({
      stock_item_id: item.id,
      quantity_needed: item.min_stock_level,
      current_stock: item.current_stock,
      is_critical: item.current_stock <= 0,
      stock_item_name: item.name,
      unit: item.unit,
    }))

  } catch (error) {
    console.error('Critical stock check error:', error)
    return []
  }
} 