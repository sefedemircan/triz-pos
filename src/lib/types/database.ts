export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'garson' | 'mutfak'
          full_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'admin' | 'garson' | 'mutfak'
          full_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'garson' | 'mutfak'
          full_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      tables: {
        Row: {
          id: string
          table_number: number
          capacity: number
          status: 'empty' | 'occupied' | 'reserved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_number: number
          capacity: number
          status?: 'empty' | 'occupied' | 'reserved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_number?: number
          capacity?: number
          status?: 'empty' | 'occupied' | 'reserved'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          display_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          display_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category_id: string
          is_available: boolean
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category_id: string
          is_available?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          category_id?: string
          is_available?: boolean
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          table_id: string
          user_id: string
          status: 'active' | 'ready' | 'completed' | 'cancelled'
          total_amount: number
          payment_method: 'cash' | 'card' | 'pending'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          table_id: string
          user_id: string
          status?: 'active' | 'ready' | 'completed' | 'cancelled'
          total_amount?: number
          payment_method?: 'cash' | 'card' | 'pending'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          table_id?: string
          user_id?: string
          status?: 'active' | 'ready' | 'completed' | 'cancelled'
          total_amount?: number
          payment_method?: 'cash' | 'card' | 'pending'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          status: 'pending' | 'preparing' | 'ready' | 'served'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          status?: 'pending' | 'preparing' | 'ready' | 'served'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          status?: 'pending' | 'preparing' | 'ready' | 'served'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stock_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          icon: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          icon?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      stock_items: {
        Row: {
          id: string
          name: string
          category_id: string | null
          unit: string
          min_stock_level: number
          max_stock_level: number
          current_stock: number
          unit_cost: number
          supplier: string | null
          barcode: string | null
          expiry_date: string | null
          location: string | null
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category_id?: string | null
          unit: string
          min_stock_level?: number
          max_stock_level?: number
          current_stock?: number
          unit_cost?: number
          supplier?: string | null
          barcode?: string | null
          expiry_date?: string | null
          location?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_id?: string | null
          unit?: string
          min_stock_level?: number
          max_stock_level?: number
          current_stock?: number
          unit_cost?: number
          supplier?: string | null
          barcode?: string | null
          expiry_date?: string | null
          location?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          stock_item_id: string
          movement_type: 'in' | 'out' | 'adjustment' | 'expired' | 'waste'
          quantity: number
          previous_stock: number
          new_stock: number
          unit_cost: number
          total_cost: number
          reference_type: string | null
          reference_id: string | null
          user_id: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          stock_item_id: string
          movement_type: 'in' | 'out' | 'adjustment' | 'expired' | 'waste'
          quantity: number
          previous_stock: number
          new_stock: number
          unit_cost?: number
          reference_type?: string | null
          reference_id?: string | null
          user_id?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          stock_item_id?: string
          movement_type?: 'in' | 'out' | 'adjustment' | 'expired' | 'waste'
          quantity?: number
          previous_stock?: number
          new_stock?: number
          unit_cost?: number
          reference_type?: string | null
          reference_id?: string | null
          user_id?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      product_recipes: {
        Row: {
          id: string
          product_id: string
          stock_item_id: string
          quantity_needed: number
          unit: string
          is_critical: boolean
          cost_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          stock_item_id: string
          quantity_needed: number
          unit: string
          is_critical?: boolean
          cost_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          stock_item_id?: string
          quantity_needed?: number
          unit?: string
          is_critical?: boolean
          cost_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      stock_alerts: {
        Row: {
          id: string
          stock_item_id: string
          alert_type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired'
          threshold_value: number | null
          current_value: number | null
          message: string | null
          is_acknowledged: boolean
          acknowledged_by: string | null
          acknowledged_at: string | null
          is_resolved: boolean
          resolved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          stock_item_id: string
          alert_type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired'
          threshold_value?: number | null
          current_value?: number | null
          message?: string | null
          is_acknowledged?: boolean
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          is_resolved?: boolean
          resolved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          stock_item_id?: string
          alert_type?: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired'
          threshold_value?: number | null
          current_value?: number | null
          message?: string | null
          is_acknowledged?: boolean
          acknowledged_by?: string | null
          acknowledged_at?: string | null
          is_resolved?: boolean
          resolved_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 