export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      billing_records: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string | null
          id: string
          paid_at: string | null
          reference_period: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          reference_period?: string
          status?: string
          type?: string
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          reference_period?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      checkouts: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          product_id: string | null
          published: boolean
          published_at: string | null
          slug: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          name: string
          product_id?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          product_id?: string | null
          published?: boolean
          published_at?: string | null
          slug?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkouts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          name: string
          phone?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          checkout_id: string | null
          created_at: string
          customer_id: string | null
          id: string
          payment_method: string
          product_id: string | null
          reference: string
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          checkout_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          payment_method?: string
          product_id?: string | null
          reference?: string
          status?: string
          user_id?: string
        }
        Update: {
          amount?: number
          checkout_id?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          payment_method?: string
          product_id?: string | null
          reference?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean
          checkout_limit: number
          created_at: string
          features: Json
          highlight: boolean
          id: string
          monthly_price: number
          name: string
          position: number
          slug: string
          transaction_fee_percent: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          checkout_limit?: number
          created_at?: string
          features?: Json
          highlight?: boolean
          id?: string
          monthly_price?: number
          name: string
          position?: number
          slug: string
          transaction_fee_percent?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          checkout_limit?: number
          created_at?: string
          features?: Json
          highlight?: boolean
          id?: string
          monthly_price?: number
          name?: string
          position?: number
          slug?: string
          transaction_fee_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          barcode: string
          created_at: string
          id: string
          image: string
          inventory_quantity: number
          is_default: boolean
          name: string
          options: Json
          position: number
          price: number
          product_id: string
          promotional_price: number | null
          sku: string
          status: string
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          barcode?: string
          created_at?: string
          id?: string
          image?: string
          inventory_quantity?: number
          is_default?: boolean
          name?: string
          options?: Json
          position?: number
          price?: number
          product_id: string
          promotional_price?: number | null
          sku?: string
          status?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Update: {
          barcode?: string
          created_at?: string
          id?: string
          image?: string
          inventory_quantity?: number
          is_default?: boolean
          name?: string
          options?: Json
          position?: number
          price?: number
          product_id?: string
          promotional_price?: number | null
          sku?: string
          status?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_backorder: boolean
          barcode: string
          brand: string
          category: string
          checkout_id: string | null
          cost: number | null
          created_at: string
          description: string
          digital_file: string
          digital_name: string
          digital_url: string
          height: number | null
          id: string
          images: string[]
          inventory_quantity: number
          length: number | null
          main_image: string
          minimum_stock: number
          name: string
          options: Json
          price: number
          promotional_price: number | null
          seo_description: string
          seo_title: string
          sku: string
          slug: string
          status: string
          tags: string[]
          track_inventory: boolean
          type: string
          updated_at: string
          user_id: string
          weight: number | null
          width: number | null
        }
        Insert: {
          allow_backorder?: boolean
          barcode?: string
          brand?: string
          category?: string
          checkout_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string
          digital_file?: string
          digital_name?: string
          digital_url?: string
          height?: number | null
          id?: string
          images?: string[]
          inventory_quantity?: number
          length?: number | null
          main_image?: string
          minimum_stock?: number
          name: string
          options?: Json
          price?: number
          promotional_price?: number | null
          seo_description?: string
          seo_title?: string
          sku?: string
          slug?: string
          status?: string
          tags?: string[]
          track_inventory?: boolean
          type?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
          width?: number | null
        }
        Update: {
          allow_backorder?: boolean
          barcode?: string
          brand?: string
          category?: string
          checkout_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string
          digital_file?: string
          digital_name?: string
          digital_url?: string
          height?: number | null
          id?: string
          images?: string[]
          inventory_quantity?: number
          length?: number | null
          main_image?: string
          minimum_stock?: number
          name?: string
          options?: Json
          price?: number
          promotional_price?: number | null
          seo_description?: string
          seo_title?: string
          sku?: string
          slug?: string
          status?: string
          tags?: string[]
          track_inventory?: boolean
          type?: string
          updated_at?: string
          user_id?: string
          weight?: number | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          company_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          pending_plan_id: string | null
          plan_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          pending_plan_id?: string | null
          plan_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          pending_plan_id?: string | null
          plan_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_pending_plan_id_fkey"
            columns: ["pending_plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          account_id: string
          created_at: string
          id: string
          invited_email: string
          invited_name: string
          role: string
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          account_id?: string
          created_at?: string
          id?: string
          invited_email: string
          invited_name?: string
          role?: string
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          id?: string
          invited_email?: string
          invited_name?: string
          role?: string
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          accepted_at: string | null
          account_id: string
          created_at: string
          id: string
          invited_at: string | null
          invited_email: string
          role: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          account_id?: string
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_email?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          account_id?: string
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_email?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      transaction_fees: {
        Row: {
          billing_record_id: string | null
          created_at: string
          fee_amount: number
          fee_percent: number
          id: string
          order_id: string | null
          plan_id: string | null
          reference_period: string
          status: string
          transaction_amount: number
          user_id: string
        }
        Insert: {
          billing_record_id?: string | null
          created_at?: string
          fee_amount?: number
          fee_percent?: number
          id?: string
          order_id?: string | null
          plan_id?: string | null
          reference_period?: string
          status?: string
          transaction_amount?: number
          user_id?: string
        }
        Update: {
          billing_record_id?: string | null
          created_at?: string
          fee_amount?: number
          fee_percent?: number
          id?: string
          order_id?: string | null
          plan_id?: string | null
          reference_period?: string
          status?: string
          transaction_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_fees_billing_record_id_fkey"
            columns: ["billing_record_id"]
            isOneToOne: false
            referencedRelation: "billing_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_fees_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_fees_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
