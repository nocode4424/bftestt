export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      additional_menus: {
        Row: {
          created_at: string | null
          id: string
          name: string
          restaurant_id: string
          schedule: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          restaurant_id: string
          schedule?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          restaurant_id?: string
          schedule?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "additional_menus_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          price: number | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          restaurant_id: string | null
          session_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          price?: number | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          restaurant_id?: string | null
          session_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          price?: number | null
          product_id?: string | null
          product_name?: string | null
          quantity?: number | null
          restaurant_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_events_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          added_at: string | null
          cart_session_id: string | null
          id: string
          modifier_selections: Json | null
          product_id: string | null
          product_name: string
          quantity: number
          removed_at: string | null
          total_price: number
          unit_price: number
          variant_selections: Json | null
        }
        Insert: {
          added_at?: string | null
          cart_session_id?: string | null
          id?: string
          modifier_selections?: Json | null
          product_id?: string | null
          product_name: string
          quantity?: number
          removed_at?: string | null
          total_price: number
          unit_price: number
          variant_selections?: Json | null
        }
        Update: {
          added_at?: string | null
          cart_session_id?: string | null
          id?: string
          modifier_selections?: Json | null
          product_id?: string | null
          product_name?: string
          quantity?: number
          removed_at?: string | null
          total_price?: number
          unit_price?: number
          variant_selections?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_session_id_fkey"
            columns: ["cart_session_id"]
            isOneToOne: false
            referencedRelation: "cart_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_sessions: {
        Row: {
          abandonment_reason: string | null
          checkout_completed_at: string | null
          checkout_started_at: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          last_activity: string | null
          referrer: string | null
          restaurant_id: string | null
          session_id: string
          status: string
          time_spent_minutes: number | null
          total_items: number | null
          total_value: number | null
          user_agent: string | null
        }
        Insert: {
          abandonment_reason?: string | null
          checkout_completed_at?: string | null
          checkout_started_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          referrer?: string | null
          restaurant_id?: string | null
          session_id: string
          status: string
          time_spent_minutes?: number | null
          total_items?: number | null
          total_value?: number | null
          user_agent?: string | null
        }
        Update: {
          abandonment_reason?: string | null
          checkout_completed_at?: string | null
          checkout_started_at?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          referrer?: string | null
          restaurant_id?: string | null
          session_id?: string
          status?: string
          time_spent_minutes?: number | null
          total_items?: number | null
          total_value?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_sessions_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          available_days: Json | null
          available_times: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          available_days?: Json | null
          available_times?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          available_days?: Json | null
          available_times?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_events: {
        Row: {
          cart_value: number | null
          created_at: string | null
          event_type: string
          id: string
          items_count: number | null
          restaurant_id: string | null
          session_id: string
        }
        Insert: {
          cart_value?: number | null
          created_at?: string | null
          event_type: string
          id?: string
          items_count?: number | null
          restaurant_id?: string | null
          session_id: string
        }
        Update: {
          cart_value?: number | null
          created_at?: string | null
          event_type?: string
          id?: string
          items_count?: number | null
          restaurant_id?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_sell_campaigns: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string
          trigger_point: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id: string
          trigger_point: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          trigger_point?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cross_sell_campaigns_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_sell_items: {
        Row: {
          campaign_id: string
          created_at: string | null
          custom_copy: string | null
          custom_price: number | null
          discount_type: string
          discount_value: number | null
          display_order: number | null
          id: string
          product_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          custom_copy?: string | null
          custom_price?: number | null
          discount_type?: string
          discount_value?: number | null
          display_order?: number | null
          id?: string
          product_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          custom_copy?: string | null
          custom_price?: number | null
          discount_type?: string
          discount_value?: number | null
          display_order?: number | null
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_sell_items_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "cross_sell_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      item_indicators: {
        Row: {
          created_at: string
          id: string
          indicator_type: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          indicator_type: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          indicator_type?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_indicators_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_indicators_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      kitchen_configs: {
        Row: {
          created_at: string | null
          custom_domain: string | null
          deployment_status: string | null
          environment_vars: Json | null
          id: string
          last_deployed: string | null
          restaurant_id: string
          subdomain: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_domain?: string | null
          deployment_status?: string | null
          environment_vars?: Json | null
          id?: string
          last_deployed?: string | null
          restaurant_id: string
          subdomain: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_domain?: string | null
          deployment_status?: string | null
          environment_vars?: Json | null
          id?: string
          last_deployed?: string | null
          restaurant_id?: string
          subdomain?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kitchen_configs_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_categories: {
        Row: {
          available_times: Json | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          name: string
          restaurant_id: string | null
          updated_at: string | null
        }
        Insert: {
          available_times?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          available_times?: Json | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          restaurant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          available_times: Json | null
          base_price: number
          calories: number | null
          category_id: string | null
          created_at: string | null
          current_daily_count: number | null
          daily_limit: number | null
          description: string | null
          dietary_tags: string[] | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          is_active: boolean | null
          name: string
          popularity_score: number | null
          preparation_time: number | null
          restaurant_id: string | null
          typical_modifications: string[] | null
          updated_at: string | null
          upsell_success_rate: number | null
        }
        Insert: {
          allergens?: string[] | null
          available_times?: Json | null
          base_price: number
          calories?: number | null
          category_id?: string | null
          created_at?: string | null
          current_daily_count?: number | null
          daily_limit?: number | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_active?: boolean | null
          name: string
          popularity_score?: number | null
          preparation_time?: number | null
          restaurant_id?: string | null
          typical_modifications?: string[] | null
          updated_at?: string | null
          upsell_success_rate?: number | null
        }
        Update: {
          allergens?: string[] | null
          available_times?: Json | null
          base_price?: number
          calories?: number | null
          category_id?: string | null
          created_at?: string | null
          current_daily_count?: number | null
          daily_limit?: number | null
          description?: string | null
          dietary_tags?: string[] | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_active?: boolean | null
          name?: string
          popularity_score?: number | null
          preparation_time?: number | null
          restaurant_id?: string | null
          typical_modifications?: string[] | null
          updated_at?: string | null
          upsell_success_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_templates: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          css_template: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          preview_image: string | null
          theme_config: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          css_template?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          preview_image?: string | null
          theme_config?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          css_template?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          preview_image?: string | null
          theme_config?: Json | null
        }
        Relationships: []
      }
      modifier_groups: {
        Row: {
          action_category: string | null
          category_order: Json | null
          created_at: string | null
          description: string | null
          display_title: string | null
          display_type: string | null
          group_by_type: boolean | null
          id: string
          is_required: boolean | null
          max_selections: number | null
          min_selections: number | null
          modifier_type: string | null
          name: string
          restaurant_id: string
          selection_rules: Json | null
          show_prices: boolean | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          action_category?: string | null
          category_order?: Json | null
          created_at?: string | null
          description?: string | null
          display_title?: string | null
          display_type?: string | null
          group_by_type?: boolean | null
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          modifier_type?: string | null
          name: string
          restaurant_id: string
          selection_rules?: Json | null
          show_prices?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          action_category?: string | null
          category_order?: Json | null
          created_at?: string | null
          description?: string | null
          display_title?: string | null
          display_type?: string | null
          group_by_type?: boolean | null
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          modifier_type?: string | null
          name?: string
          restaurant_id?: string
          selection_rules?: Json | null
          show_prices?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifier_groups_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      modifiers: {
        Row: {
          category: string | null
          created_at: string | null
          default_selected: boolean | null
          description: string | null
          id: string
          incompatible_with: Json | null
          is_active: boolean | null
          is_default: boolean | null
          max_quantity: number | null
          modifier_action: string | null
          modifier_group_id: string
          modifier_type: string | null
          name: string
          nutritional_info: Json | null
          price_adjustment: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_selected?: boolean | null
          description?: string | null
          id?: string
          incompatible_with?: Json | null
          is_active?: boolean | null
          is_default?: boolean | null
          max_quantity?: number | null
          modifier_action?: string | null
          modifier_group_id: string
          modifier_type?: string | null
          name: string
          nutritional_info?: Json | null
          price_adjustment?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_selected?: boolean | null
          description?: string | null
          id?: string
          incompatible_with?: Json | null
          is_active?: boolean | null
          is_default?: boolean | null
          max_quantity?: number | null
          modifier_action?: string | null
          modifier_group_id?: string
          modifier_type?: string | null
          name?: string
          nutritional_info?: Json | null
          price_adjustment?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_enabled: boolean | null
          notification_method: string
          recipient_email: string | null
          recipient_phone: string | null
          recipient_slack_webhook: string | null
          restaurant_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_enabled?: boolean | null
          notification_method: string
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_slack_webhook?: string | null
          restaurant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_enabled?: boolean | null
          notification_method?: string
          recipient_email?: string | null
          recipient_phone?: string | null
          recipient_slack_webhook?: string | null
          restaurant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          order_id: string | null
          read: boolean | null
          restaurant_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          order_id?: string | null
          read?: boolean | null
          restaurant_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          order_id?: string | null
          read?: boolean | null
          restaurant_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notifications_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ordering_disable_log: {
        Row: {
          auto_enabled: boolean | null
          created_at: string
          custom_reason: string | null
          disable_reason: string
          disabled_at: string
          disabled_by: string | null
          duration_minutes: number | null
          enabled_at: string | null
          id: string
          restaurant_id: string | null
        }
        Insert: {
          auto_enabled?: boolean | null
          created_at?: string
          custom_reason?: string | null
          disable_reason: string
          disabled_at?: string
          disabled_by?: string | null
          duration_minutes?: number | null
          enabled_at?: string | null
          id?: string
          restaurant_id?: string | null
        }
        Update: {
          auto_enabled?: boolean | null
          created_at?: string
          custom_reason?: string | null
          disable_reason?: string
          disabled_at?: string
          disabled_by?: string | null
          duration_minutes?: number | null
          enabled_at?: string | null
          id?: string
          restaurant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordering_disable_log_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cart: Json
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          delivery_address: string | null
          delivery_driver_name: string | null
          delivery_driver_phone: string | null
          delivery_dropoff_eta: string | null
          delivery_pickup_eta: string | null
          delivery_status: string | null
          delivery_tracking_url: string | null
          delivery_type: string | null
          id: string
          payment_intent_id: string | null
          payment_status: string | null
          restaurant_id: string
          status: string | null
          total: number
          uber_courier_location: Json | null
          uber_courier_name: string | null
          uber_courier_phone: string | null
          uber_courier_photo: string | null
          uber_delivery_id: string | null
          uber_eta: string | null
          uber_last_webhook: string | null
          uber_quote_id: string | null
          uber_status: string | null
          uber_webhook_data: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cart: Json
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_driver_name?: string | null
          delivery_driver_phone?: string | null
          delivery_dropoff_eta?: string | null
          delivery_pickup_eta?: string | null
          delivery_status?: string | null
          delivery_tracking_url?: string | null
          delivery_type?: string | null
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          restaurant_id: string
          status?: string | null
          total: number
          uber_courier_location?: Json | null
          uber_courier_name?: string | null
          uber_courier_phone?: string | null
          uber_courier_photo?: string | null
          uber_delivery_id?: string | null
          uber_eta?: string | null
          uber_last_webhook?: string | null
          uber_quote_id?: string | null
          uber_status?: string | null
          uber_webhook_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cart?: Json
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          delivery_address?: string | null
          delivery_driver_name?: string | null
          delivery_driver_phone?: string | null
          delivery_dropoff_eta?: string | null
          delivery_pickup_eta?: string | null
          delivery_status?: string | null
          delivery_tracking_url?: string | null
          delivery_type?: string | null
          id?: string
          payment_intent_id?: string | null
          payment_status?: string | null
          restaurant_id?: string
          status?: string | null
          total?: number
          uber_courier_location?: Json | null
          uber_courier_name?: string | null
          uber_courier_phone?: string | null
          uber_courier_photo?: string | null
          uber_delivery_id?: string | null
          uber_eta?: string | null
          uber_last_webhook?: string | null
          uber_quote_id?: string | null
          uber_status?: string | null
          uber_webhook_data?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_attempts: {
        Row: {
          amount: number | null
          created_at: string | null
          decline_code: string | null
          decline_reason: string | null
          error_message: string | null
          id: string
          order_id: string | null
          restaurant_id: string | null
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          decline_code?: string | null
          decline_reason?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          restaurant_id?: string | null
          status: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          decline_code?: string | null
          decline_reason?: string | null
          error_message?: string | null
          id?: string
          order_id?: string | null
          restaurant_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_attempts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_labels: {
        Row: {
          created_at: string | null
          id: string
          label_type: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label_type: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label_type?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_labels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_labels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modifier_groups: {
        Row: {
          created_at: string | null
          id: string
          modifier_group_id: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          modifier_group_id: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          modifier_group_id?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_modifier_groups_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifier_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifier_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_upsell_groups: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          sort_order: number | null
          upsell_group_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          sort_order?: number | null
          upsell_group_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          sort_order?: number | null
          upsell_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_upsell_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_upsell_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_upsell_groups_upsell_group_id_fkey"
            columns: ["upsell_group_id"]
            isOneToOne: false
            referencedRelation: "upsell_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_groups: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          product_id: string
          sort_order: number | null
          variant_group_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          product_id: string
          sort_order?: number | null
          variant_group_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          product_id?: string
          sort_order?: number | null
          variant_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_groups_variant_group_id_fkey"
            columns: ["variant_group_id"]
            isOneToOne: false
            referencedRelation: "variant_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_comments: boolean | null
          available_days: Json | null
          available_menus: Json | null
          available_times: Json | null
          base_price: number
          category_id: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_21_plus: boolean | null
          is_active: boolean | null
          name: string
          restaurant_id: string
          sort_order: number | null
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          allow_comments?: boolean | null
          available_days?: Json | null
          available_menus?: Json | null
          available_times?: Json | null
          base_price?: number
          category_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_21_plus?: boolean | null
          is_active?: boolean | null
          name: string
          restaurant_id: string
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          allow_comments?: boolean | null
          available_days?: Json | null
          available_menus?: Json | null
          available_times?: Json | null
          base_price?: number
          category_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_21_plus?: boolean | null
          is_active?: boolean | null
          name?: string
          restaurant_id?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_specials: {
        Row: {
          created_at: string | null
          custom_copy: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          name: string
          popup_style: string
          product_id: string
          restaurant_id: string
          trigger_after_items: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_copy: string
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          name: string
          popup_style?: string
          product_id: string
          restaurant_id: string
          trigger_after_items?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_copy?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          name?: string
          popup_style?: string
          product_id?: string
          restaurant_id?: string
          trigger_after_items?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promotional_specials_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_admins: {
        Row: {
          restaurant_id: string
          user_id: string
        }
        Insert: {
          restaurant_id: string
          user_id: string
        }
        Update: {
          restaurant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_admins_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          address: string
          advance_ordering_enabled: boolean | null
          advance_ordering_hours: number | null
          application_fee_flat: number | null
          application_fee_percentage: number | null
          background_color: string | null
          brand_colors: Json | null
          combine_tax_processing: boolean | null
          created_at: string | null
          custom_css: string | null
          customer_favorites_enabled: boolean | null
          delivery_enabled: boolean | null
          delivery_fee: number | null
          delivery_fee_restaurant_pays: number | null
          domain: string | null
          email_notifications_enabled: boolean | null
          gratuity_enabled: boolean | null
          hours: Json | null
          id: string
          include_delivery_in_fee: boolean | null
          include_processing_in_fee: boolean | null
          include_tax_in_fee: boolean | null
          kitchen_deployed: boolean | null
          kitchen_url: string | null
          logo_url: string | null
          manager_email: string | null
          manager_name: string | null
          manager_phone: string | null
          minimum_order_delivery: number | null
          minimum_order_pickup: number | null
          name: string
          notification_email: string | null
          online_orders_enabled: boolean | null
          order_cutoff_minutes: number | null
          orders_disabled: boolean | null
          orders_disabled_reason: string | null
          orders_disabled_until: string | null
          owner_email: string
          owner_name: string
          owner_phone: string
          phone: string
          processing_fee: number | null
          selected_theme_id: string | null
          stripe_connect_enabled: boolean | null
          stripe_connect_id: string | null
          tax_rate: number | null
          text_color: string | null
          theme_config: Json | null
          theme_id: string | null
          timezone: string
          tip_percentage_1: number | null
          tip_percentage_2: number | null
          tip_percentage_3: number | null
          uber_client_id: string | null
          uber_client_secret: string | null
          uber_customer_id: string | null
          uber_enabled: boolean | null
          updated_at: string | null
          user_id: string
          webhook_url: string | null
          website: string | null
        }
        Insert: {
          address: string
          advance_ordering_enabled?: boolean | null
          advance_ordering_hours?: number | null
          application_fee_flat?: number | null
          application_fee_percentage?: number | null
          background_color?: string | null
          brand_colors?: Json | null
          combine_tax_processing?: boolean | null
          created_at?: string | null
          custom_css?: string | null
          customer_favorites_enabled?: boolean | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          delivery_fee_restaurant_pays?: number | null
          domain?: string | null
          email_notifications_enabled?: boolean | null
          gratuity_enabled?: boolean | null
          hours?: Json | null
          id?: string
          include_delivery_in_fee?: boolean | null
          include_processing_in_fee?: boolean | null
          include_tax_in_fee?: boolean | null
          kitchen_deployed?: boolean | null
          kitchen_url?: string | null
          logo_url?: string | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          minimum_order_delivery?: number | null
          minimum_order_pickup?: number | null
          name: string
          notification_email?: string | null
          online_orders_enabled?: boolean | null
          order_cutoff_minutes?: number | null
          orders_disabled?: boolean | null
          orders_disabled_reason?: string | null
          orders_disabled_until?: string | null
          owner_email: string
          owner_name: string
          owner_phone: string
          phone: string
          processing_fee?: number | null
          selected_theme_id?: string | null
          stripe_connect_enabled?: boolean | null
          stripe_connect_id?: string | null
          tax_rate?: number | null
          text_color?: string | null
          theme_config?: Json | null
          theme_id?: string | null
          timezone: string
          tip_percentage_1?: number | null
          tip_percentage_2?: number | null
          tip_percentage_3?: number | null
          uber_client_id?: string | null
          uber_client_secret?: string | null
          uber_customer_id?: string | null
          uber_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
          webhook_url?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          advance_ordering_enabled?: boolean | null
          advance_ordering_hours?: number | null
          application_fee_flat?: number | null
          application_fee_percentage?: number | null
          background_color?: string | null
          brand_colors?: Json | null
          combine_tax_processing?: boolean | null
          created_at?: string | null
          custom_css?: string | null
          customer_favorites_enabled?: boolean | null
          delivery_enabled?: boolean | null
          delivery_fee?: number | null
          delivery_fee_restaurant_pays?: number | null
          domain?: string | null
          email_notifications_enabled?: boolean | null
          gratuity_enabled?: boolean | null
          hours?: Json | null
          id?: string
          include_delivery_in_fee?: boolean | null
          include_processing_in_fee?: boolean | null
          include_tax_in_fee?: boolean | null
          kitchen_deployed?: boolean | null
          kitchen_url?: string | null
          logo_url?: string | null
          manager_email?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          minimum_order_delivery?: number | null
          minimum_order_pickup?: number | null
          name?: string
          notification_email?: string | null
          online_orders_enabled?: boolean | null
          order_cutoff_minutes?: number | null
          orders_disabled?: boolean | null
          orders_disabled_reason?: string | null
          orders_disabled_until?: string | null
          owner_email?: string
          owner_name?: string
          owner_phone?: string
          phone?: string
          processing_fee?: number | null
          selected_theme_id?: string | null
          stripe_connect_enabled?: boolean | null
          stripe_connect_id?: string | null
          tax_rate?: number | null
          text_color?: string | null
          theme_config?: Json | null
          theme_id?: string | null
          timezone?: string
          tip_percentage_1?: number | null
          tip_percentage_2?: number | null
          tip_percentage_3?: number | null
          uber_client_id?: string | null
          uber_client_secret?: string | null
          uber_customer_id?: string | null
          uber_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
          webhook_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visitors: {
        Row: {
          created_at: string | null
          id: string
          ip_address: string | null
          landing_page: string | null
          referrer: string | null
          restaurant_id: string | null
          session_id: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referrer?: string | null
          restaurant_id?: string | null
          session_id: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: string | null
          landing_page?: string | null
          referrer?: string | null
          restaurant_id?: string | null
          session_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_visitors_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          customer_email: string | null
          description: string | null
          id: string
          net_amount: number | null
          order_id: string | null
          status: string
          stripe_fee: number | null
          stripe_payment_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          description?: string | null
          id?: string
          net_amount?: number | null
          order_id?: string | null
          status: string
          stripe_fee?: number | null
          stripe_payment_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          description?: string | null
          id?: string
          net_amount?: number | null
          order_id?: string | null
          status?: string
          stripe_fee?: number | null
          stripe_payment_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stripe_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          created_at: string | null
          css_variables: Json | null
          description: string | null
          id: string
          name: string
          preview_image: string | null
        }
        Insert: {
          created_at?: string | null
          css_variables?: Json | null
          description?: string | null
          id?: string
          name: string
          preview_image?: string | null
        }
        Update: {
          created_at?: string | null
          css_variables?: Json | null
          description?: string | null
          id?: string
          name?: string
          preview_image?: string | null
        }
        Relationships: []
      }
      uber_deliveries: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          courier_name: string | null
          created_at: string | null
          delivered_at: string | null
          dropoff_address: string | null
          estimated_dropoff_time: string | null
          estimated_pickup_time: string | null
          final_fee: number | null
          id: string
          order_id: string | null
          pickup_address: string | null
          status: string
          tip_amount: number | null
          tracking_url: string | null
          uber_delivery_id: string
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          courier_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          dropoff_address?: string | null
          estimated_dropoff_time?: string | null
          estimated_pickup_time?: string | null
          final_fee?: number | null
          id?: string
          order_id?: string | null
          pickup_address?: string | null
          status: string
          tip_amount?: number | null
          tracking_url?: string | null
          uber_delivery_id: string
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          courier_name?: string | null
          created_at?: string | null
          delivered_at?: string | null
          dropoff_address?: string | null
          estimated_dropoff_time?: string | null
          estimated_pickup_time?: string | null
          final_fee?: number | null
          id?: string
          order_id?: string | null
          pickup_address?: string | null
          status?: string
          tip_amount?: number | null
          tracking_url?: string | null
          uber_delivery_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uber_deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      uber_quotes: {
        Row: {
          created_at: string | null
          currency: string | null
          dropoff_address: string | null
          eta: number | null
          expires_at: string | null
          fee: number
          id: string
          pickup_address: string | null
          quote_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          dropoff_address?: string | null
          eta?: number | null
          expires_at?: string | null
          fee: number
          id?: string
          pickup_address?: string | null
          quote_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          dropoff_address?: string | null
          eta?: number | null
          expires_at?: string | null
          fee?: number
          id?: string
          pickup_address?: string | null
          quote_id?: string
          status?: string | null
        }
        Relationships: []
      }
      upsell_groups: {
        Row: {
          created_at: string | null
          description: string | null
          display_type: string | null
          id: string
          max_selections: number | null
          name: string
          restaurant_id: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_type?: string | null
          id?: string
          max_selections?: number | null
          name: string
          restaurant_id: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_type?: string | null
          id?: string
          max_selections?: number | null
          name?: string
          restaurant_id?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upsell_groups_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      upsells: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          sort_order: number | null
          updated_at: string | null
          upsell_group_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
          upsell_group_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          sort_order?: number | null
          updated_at?: string | null
          upsell_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsells_upsell_group_id_fkey"
            columns: ["upsell_group_id"]
            isOneToOne: false
            referencedRelation: "upsell_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      variant_groups: {
        Row: {
          category_headers: boolean | null
          conditional_logic: Json | null
          created_at: string | null
          description: string | null
          display_columns: number | null
          display_subtitle: string | null
          display_title: string | null
          display_type: string | null
          group_by_category: boolean | null
          id: string
          is_required: boolean | null
          max_selections: number | null
          min_selections: number | null
          name: string
          restaurant_id: string
          selection_rules: Json | null
          show_descriptions: boolean | null
          show_images: boolean | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          category_headers?: boolean | null
          conditional_logic?: Json | null
          created_at?: string | null
          description?: string | null
          display_columns?: number | null
          display_subtitle?: string | null
          display_title?: string | null
          display_type?: string | null
          group_by_category?: boolean | null
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          name: string
          restaurant_id: string
          selection_rules?: Json | null
          show_descriptions?: boolean | null
          show_images?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          category_headers?: boolean | null
          conditional_logic?: Json | null
          created_at?: string | null
          description?: string | null
          display_columns?: number | null
          display_subtitle?: string | null
          display_title?: string | null
          display_type?: string | null
          group_by_category?: boolean | null
          id?: string
          is_required?: boolean | null
          max_selections?: number | null
          min_selections?: number | null
          name?: string
          restaurant_id?: string
          selection_rules?: Json | null
          show_descriptions?: boolean | null
          show_images?: boolean | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "variant_groups_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      variants: {
        Row: {
          category_name: string | null
          category_sort_order: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          price_adjustment: number | null
          sort_order: number | null
          updated_at: string | null
          variant_group_id: string
        }
        Insert: {
          category_name?: string | null
          category_sort_order?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          price_adjustment?: number | null
          sort_order?: number | null
          updated_at?: string | null
          variant_group_id: string
        }
        Update: {
          category_name?: string | null
          category_sort_order?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          price_adjustment?: number | null
          sort_order?: number | null
          updated_at?: string | null
          variant_group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variants_variant_group_id_fkey"
            columns: ["variant_group_id"]
            isOneToOne: false
            referencedRelation: "variant_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      product_details: {
        Row: {
          allow_comments: boolean | null
          base_price: number | null
          category_id: string | null
          category_name: string | null
          description: string | null
          id: string | null
          image_url: string | null
          is_21_plus: boolean | null
          is_active: boolean | null
          labels: Json | null
          modifier_groups: Json | null
          name: string | null
          restaurant_id: string | null
          sort_order: number | null
          upsell_groups: Json | null
          variant_groups: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      gbt_bit_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bool_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bpchar_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_bytea_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_cash_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_date_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_enum_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_float8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_inet_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int2_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int4_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_int8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_intv_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_macad8_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_numeric_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_oid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_text_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_time_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_timetz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_ts_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_tstz_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_uuid_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbt_var_fetch: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey_var_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey16_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey2_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey32_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey4_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gbtreekey8_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      get_restaurant_by_domain: {
        Args: { domain_name: string }
        Returns: {
          id: string
          name: string
          domain: string
          online_orders_enabled: boolean
          theme_id: string
        }[]
      }
      get_user_restaurants: {
        Args: { user_uuid: string }
        Returns: {
          restaurant_id: string
          restaurant_name: string
          domain: string
          address: string
          online_orders_enabled: boolean
          access_type: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
