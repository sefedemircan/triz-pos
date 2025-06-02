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