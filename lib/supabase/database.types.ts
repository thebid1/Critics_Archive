/**
 * Hand-maintained Supabase `Database` types — mirrors supabase/schema.sql.
 *
 * Regenerated with `supabase gen types typescript` once a project access token
 * is available (needs the Supabase CLI); kept in sync by hand until then.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductsRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  description: string;
  /** Product-level inventory pool (shared across all sizes). */
  stock: number;
  drop_name: string | null;
  season: string | null;
  drop_id: string | null;
  /** Fixed per product type ('tee' | 'short' | 'hoodie' | 'sweatpants' | 'scarf'). */
  size_chart: string;
  is_new: boolean;
  is_published: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductsInsert = {
  id?: string;
  slug: string;
  name: string;
  price: number;
  currency?: string;
  description?: string;
  stock?: number;
  drop_name?: string | null;
  season?: string | null;
  drop_id?: string | null;
  size_chart?: string;
  is_new?: boolean;
  is_published?: boolean;
  archived_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProductsUpdate = Partial<ProductsInsert>;

export type ProductImagesRow = {
  id: string;
  product_id: string;
  url: string;
  alt: string;
  position: number;
  created_at: string;
};

export type ProductImagesInsert = {
  id?: string;
  product_id: string;
  url: string;
  alt?: string;
  position?: number;
  created_at?: string;
};

export type ProductImagesUpdate = Partial<ProductImagesInsert>;

export type ProductVariantsRow = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  created_at: string;
};

export type ProductVariantsInsert = {
  id?: string;
  product_id: string;
  size: string;
  color?: string;
  created_at?: string;
};

export type ProductVariantsUpdate = Partial<ProductVariantsInsert>;

export type OrdersRow = {
  id: string;
  reference: string;
  status:
    | "pending"
    | "paid"
    | "fulfilled"
    | "cancelled"
    | "refunded";
  email: string;
  phone: string;
  customer_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  country: string;
  subtotal: number;
  shipping_total: number;
  total: number;
  currency: string;
  payment_provider: string;
  paid_at: string | null;
  confirmation_email_sent_at: string | null;
  tracking_number: string;
  shipped_email_sent_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrdersInsert = {
  id?: string;
  reference: string;
  status?:
    | "pending"
    | "paid"
    | "fulfilled"
    | "cancelled"
    | "refunded";
  email: string;
  phone?: string;
  customer_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  subtotal?: number;
  shipping_total?: number;
  total?: number;
  currency?: string;
  payment_provider?: string;
  paid_at?: string | null;
  confirmation_email_sent_at?: string | null;
  tracking_number?: string;
  shipped_email_sent_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type OrdersUpdate = Partial<OrdersInsert>;

export type OrderItemsRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_variant_id: string | null;
  name: string;
  size: string;
  price: number;
  qty: number;
  image: string;
  created_at: string;
};

export type OrderItemsInsert = {
  id?: string;
  order_id: string;
  product_id?: string | null;
  product_variant_id?: string | null;
  name: string;
  size?: string;
  price: number;
  qty: number;
  image?: string;
  created_at?: string;
};

export type OrderItemsUpdate = Partial<OrderItemsInsert>;

export type AdminActionsRow = {
  id: string;
  admin_email: string;
  action: string;
  target_table: string;
  target_id: string;
  before: Json | null;
  after: Json | null;
  created_at: string;
};

export type AdminActionsInsert = {
  id?: string;
  admin_email: string;
  action: string;
  target_table: string;
  target_id: string;
  before?: Json | null;
  after?: Json | null;
  created_at?: string;
};

export type AdminActionsUpdate = Partial<AdminActionsInsert>;

export type DropsRow = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
};

export type DropsInsert = {
  id?: string;
  name: string;
  is_active?: boolean;
  created_at?: string;
};

export type DropsUpdate = Partial<DropsInsert>;

export type PaystackEventsRow = {
  reference: string;
  event: string;
  processed_at: string;
};

export type PaystackEventsInsert = {
  reference: string;
  event: string;
  processed_at?: string;
};

export type PaystackEventsUpdate = Partial<PaystackEventsInsert>;

export type NewsletterSubscribersRow = {
  id: string;
  email: string;
  created_at: string;
};

export type NewsletterSubscribersInsert = {
  id?: string;
  email: string;
  created_at?: string;
};

export type NewsletterSubscribersUpdate = Partial<NewsletterSubscribersInsert>;

export type Database = {
  public: {
    Tables: {
      products: {
        Row: ProductsRow;
        Insert: ProductsInsert;
        Update: ProductsUpdate;
        Relationships: [
          {
            foreignKeyName: "products_drop_id_fkey";
            columns: ["drop_id"];
            isOneToOne: false;
            referencedRelation: "drops";
            referencedColumns: ["id"];
          }
        ];
      };
      product_images: {
        Row: ProductImagesRow;
        Insert: ProductImagesInsert;
        Update: ProductImagesUpdate;
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_variants: {
        Row: ProductVariantsRow;
        Insert: ProductVariantsInsert;
        Update: ProductVariantsUpdate;
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: OrdersRow;
        Insert: OrdersInsert;
        Update: OrdersUpdate;
        Relationships: [];
      };
      order_items: {
        Row: OrderItemsRow;
        Insert: OrderItemsInsert;
        Update: OrderItemsUpdate;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_variant_id_fkey";
            columns: ["product_variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
      };
      drops: {
        Row: DropsRow;
        Insert: DropsInsert;
        Update: DropsUpdate;
        Relationships: [];
      };
      admin_actions: {
        Row: AdminActionsRow;
        Insert: AdminActionsInsert;
        Update: AdminActionsUpdate;
        Relationships: [];
      };
      paystack_events: {
        Row: PaystackEventsRow;
        Insert: PaystackEventsInsert;
        Update: PaystackEventsUpdate;
        Relationships: [];
      };
      newsletter_subscribers: {
        Row: NewsletterSubscribersRow;
        Insert: NewsletterSubscribersInsert;
        Update: NewsletterSubscribersUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      fulfill_paid_order: {
        Args: {
          order_reference: string;
          paid_amount: number;
          paid_currency: string;
        };
        Returns: string;
      };
      create_order: {
        Args: {
          p_email: string;
          p_phone: string;
          p_customer_name: string;
          p_address_line1: string;
          p_address_line2: string;
          p_city: string;
          p_state: string;
          p_country: string;
          p_delivery_fee: number;
          p_currency: string;
          p_items: Json; // jsonb array of { slug, size, qty }
        };
        Returns: Json;
      };
      expire_pending_orders: {
        Args: {
          p_max_age_hours?: number;
        };
        Returns: number;
      };
      record_admin_action: {
        Args: {
          p_admin_email: string;
          p_action: string;
          p_target_table: string;
          p_target_id: string;
          p_before?: Json | null;
          p_after?: Json | null;
        };
        Returns: undefined;
      };
      get_active_drop: {
        Args: Record<string, never>;
        Returns: Json;
      };
      create_drop: {
        Args: {
          p_name: string;
          p_admin_email: string;
        };
        Returns: Json;
      };
      publish_drop: {
        Args: {
          p_drop_id: string;
          p_admin_email: string;
        };
        Returns: Json;
      };
      set_product_stock: {
        Args: {
          p_product_id: string;
          p_stock: number;
          p_admin_email: string;
        };
        Returns: number;
      };
      create_product: {
        Args: {
          p_admin_email: string;
          p_data: Json;
        };
        Returns: Json;
      };
      update_product: {
        Args: {
          p_product_id: string;
          p_admin_email: string;
          p_patch: Json;
        };
        Returns: Json;
      };
      update_order_status: {
        Args: {
          p_order_id: string;
          p_admin_email: string;
          p_status: string;
          p_tracking?: string;
        };
        Returns: Json;
      };
      admin_orders_status_counts: {
        Args: Record<string, never>;
        Returns: Json;
      };
      claim_paystack_event: {
        Args: {
          p_reference: string;
          p_event: string;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};