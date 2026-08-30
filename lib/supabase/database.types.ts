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
  drop_name: string | null;
  season: string | null;
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
  drop_name?: string | null;
  season?: string | null;
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
  stock: number;
  created_at: string;
};

export type ProductVariantsInsert = {
  id?: string;
  product_id: string;
  size: string;
  color?: string;
  stock?: number;
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
  customer_name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  country: string;
  postal_code: string;
  subtotal: number;
  shipping_total: number;
  total: number;
  currency: string;
  payment_provider: string;
  paid_at: string | null;
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
  customer_name?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  subtotal?: number;
  shipping_total?: number;
  total?: number;
  currency?: string;
  payment_provider?: string;
  paid_at?: string | null;
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

export type Database = {
  public: {
    Tables: {
      products: {
        Row: ProductsRow;
        Insert: ProductsInsert;
        Update: ProductsUpdate;
        Relationships: [];
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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};