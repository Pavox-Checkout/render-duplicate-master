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
          address: Json
          created_at: string
          document: string
          email: string
          id: string
          name: string
          person_type: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: Json
          created_at?: string
          document?: string
          email?: string
          id?: string
          name: string
          person_type?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          address?: Json
          created_at?: string
          document?: string
          email?: string
          id?: string
          name?: string
          person_type?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      domains: {
        Row: {
          checkout_id: string | null
          created_at: string
          dns_records: Json
          hostname: string
          id: string
          is_primary: boolean
          last_checked_at: string | null
          last_error: string | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          checkout_id?: string | null
          created_at?: string
          dns_records?: Json
          hostname: string
          id?: string
          is_primary?: boolean
          last_checked_at?: string | null
          last_error?: string | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          checkout_id?: string | null
          created_at?: string
          dns_records?: Json
          hostname?: string
          id?: string
          is_primary?: boolean
          last_checked_at?: string | null
          last_error?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "domains_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkouts"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          buyer: Json
          checkout_id: string | null
          created_at: string
          currency: string
          customer_id: string | null
          discount: number
          emails_sent: Json
          expires_at: string | null
          fee_collection: string | null
          gateway: string | null
          gateway_payment_id: string | null
          id: string
          idempotency_key: string | null
          paid_at: string | null
          payment_data: Json
          payment_method: string
          platform_fee: number
          product_id: string | null
          product_snapshot: Json
          quantity: number
          reference: string
          shipping: number
          status: string
          subtotal: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          buyer?: Json
          checkout_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount?: number
          emails_sent?: Json
          expires_at?: string | null
          fee_collection?: string | null
          gateway?: string | null
          gateway_payment_id?: string | null
          id?: string
          idempotency_key?: string | null
          paid_at?: string | null
          payment_data?: Json
          payment_method?: string
          platform_fee?: number
          product_id?: string | null
          product_snapshot?: Json
          quantity?: number
          reference?: string
          shipping?: number
          status?: string
          subtotal?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount?: number
          buyer?: Json
          checkout_id?: string | null
          created_at?: string
          currency?: string
          customer_id?: string | null
          discount?: number
          emails_sent?: Json
          expires_at?: string | null
          fee_collection?: string | null
          gateway?: string | null
          gateway_payment_id?: string | null
          id?: string
          idempotency_key?: string | null
          paid_at?: string | null
          payment_data?: Json
          payment_method?: string
          platform_fee?: number
          product_id?: string | null
          product_snapshot?: Json
          quantity?: number
          reference?: string
          shipping?: number
          status?: string
          subtotal?: number
          updated_at?: string
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
      payment_integrations: {
        Row: {
          account_label: string
          connection_type: string
          external_account_id: string | null
          token_expires_at: string | null
          created_at: string
          credentials: Json
          credentials_masked: Json
          credentials_secret_id: string | null
          enabled_payment_methods: string[]
          environment: string
          id: string
          last_test_status: string | null
          last_tested_at: string | null
          provider: string
          routing: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_label?: string
          connection_type?: string
          external_account_id?: string | null
          token_expires_at?: string | null
          created_at?: string
          credentials?: Json
          credentials_masked?: Json
          credentials_secret_id?: string | null
          enabled_payment_methods?: string[]
          environment?: string
          id?: string
          last_test_status?: string | null
          last_tested_at?: string | null
          provider: string
          routing?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_label?: string
          connection_type?: string
          external_account_id?: string | null
          token_expires_at?: string | null
          created_at?: string
          credentials?: Json
          credentials_masked?: Json
          credentials_secret_id?: string | null
          enabled_payment_methods?: string[]
          environment?: string
          id?: string
          last_test_status?: string | null
          last_tested_at?: string | null
          provider?: string
          routing?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
  cpf: string | null
  created_at: string
  email: string
  full_name: string
  id: string
  store_slug: string
  updated_at: string
  }
  Insert: {
  company_name?: string
  cpf?: string | null
  created_at?: string
  email?: string
  full_name?: string
  id: string
          store_slug: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          store_slug?: string
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
      webhook_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string
          id: string
          order_id: string | null
          payload: Json
          processed_at: string | null
          provider: string
          result: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type?: string
          id?: string
          order_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider: string
          result?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          order_id?: string | null
          payload?: Json
          processed_at?: string | null
          provider?: string
          result?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      pavox_admin_access: { Args: Record<PropertyKey, never>; Returns: Json }
      pavox_admin_overview: { Args: { p_days?: number }; Returns: Json }
      pavox_admin_list: {
        Args: { p_kind: string; p_query?: string; p_status?: string; p_page?: number; p_days?: number }
        Returns: Json
      }
      pavox_admin_merchant: { Args: { p_merchant_id: string }; Returns: Json }
      pavox_admin_add_note: { Args: { p_merchant_id: string; p_body: string }; Returns: string }
      create_public_order: {
        Args: {
          p_buyer: Json
          p_checkout_id: string
          p_idempotency_key: string
          p_payment_method: string
        }
        Returns: Json
      }
      get_domain_checkout: { Args: { p_host: string }; Returns: Json }
      get_public_checkout: {
        Args: { p_checkout_slug: string; p_store_slug: string }
        Returns: Json
      }
      get_public_order: { Args: { p_order_id: string }; Returns: Json }
      pavox_apply_payment_status: {
        Args: {
          p_amount: number
          p_currency: string
          p_event_id: string
          p_event_type: string
          p_order_id: string
          p_payload: Json
          p_payment_id: string
          p_provider: string
          p_status: string
          p_user_id: string
        }
        Returns: string
      }
      pavox_attach_payment: {
        Args: {
          p_gateway: string
          p_order_id: string
          p_payment_data: Json
          p_payment_id: string
        }
        Returns: Json
      }
      pavox_checkout_payment_methods: {
        Args: { p_checkout: Database["public"]["Tables"]["checkouts"]["Row"] }
        Returns: string[]
      }
      pavox_checkout_product_id: {
        Args: { p_checkout: Database["public"]["Tables"]["checkouts"]["Row"] }
        Returns: string
      }
      pavox_gateway_for_method: {
        Args: { p_method: string; p_user_id: string }
        Returns: string
      }
      pavox_get_integration_credentials: {
        Args: { p_provider: string; p_user_id: string }
        Returns: Json
      }
      pavox_integration_public_json: {
        Args: { i: Database["public"]["Tables"]["payment_integrations"]["Row"] }
        Returns: Json
      }
      pavox_order_for_payment: { Args: { p_order_id: string }; Returns: Json }
      pavox_order_public_json: {
        Args: { o: Database["public"]["Tables"]["orders"]["Row"] }
        Returns: Json
      }
      pavox_platform_fee: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      pavox_product_charge_price: {
        Args: { p: Database["public"]["Tables"]["products"]["Row"] }
        Returns: number
      }
      pavox_provider_methods: {
        Args: { p_provider: string }
        Returns: string[]
      }
      pavox_record_integration_test: {
        Args: { p_provider: string; p_result: string; p_user_id: string }
        Returns: Json
      }
      pavox_save_integration: {
        Args: {
          p_account_label: string
          p_credentials: Json
          p_environment: string
          p_masked: Json
          p_methods: string[]
          p_provider: string
          p_user_id: string
        }
        Returns: Json
      }
      pavox_slugify: { Args: { value: string }; Returns: string }
      pavox_supported_payment_providers: { Args: never; Returns: string[] }
      pavox_unique_store_slug: {
        Args: { p_base: string; p_profile_id: string }
        Returns: string
      }
      set_domain_checkout: {
        Args: { p_checkout_id: string; p_domain_id: string }
        Returns: Json
      }
      set_primary_domain: { Args: { p_domain_id: string }; Returns: Json }
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
