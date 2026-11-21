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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_invites: {
        Row: {
          accepted_at: string | null
          email: string
          invited_at: string
        }
        Insert: {
          accepted_at?: string | null
          email: string
          invited_at?: string
        }
        Update: {
          accepted_at?: string | null
          email?: string
          invited_at?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          author: string | null
          brand_ids: string[]
          category: string | null
          collection_ids: string[]
          content: string
          cover_url: string | null
          created_at: string
          gallery: string[]
          id: string
          product_ids: string[]
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          brand_ids?: string[]
          category?: string | null
          collection_ids?: string[]
          content?: string
          cover_url?: string | null
          created_at?: string
          gallery?: string[]
          id?: string
          product_ids?: string[]
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          brand_ids?: string[]
          category?: string | null
          collection_ids?: string[]
          content?: string
          cover_url?: string | null
          created_at?: string
          gallery?: string[]
          id?: string
          product_ids?: string[]
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          city: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          editorial: string | null
          extra_info: string | null
          founded: number | null
          id: string
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          tagline: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          editorial?: string | null
          extra_info?: string | null
          founded?: number | null
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          editorial?: string | null
          extra_info?: string | null
          founded?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      collections: {
        Row: {
          brand_id: string
          cover_url: string | null
          created_at: string
          description: string | null
          gallery: string[]
          id: string
          is_new: boolean
          name: string
          season: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          brand_id: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          gallery?: string[]
          id?: string
          is_new?: boolean
          name: string
          season?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          brand_id?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          gallery?: string[]
          id?: string
          is_new?: boolean
          name?: string
          season?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      home_settings: {
        Row: {
          featured_article_ids: string[]
          featured_brand_ids: string[]
          featured_collection_ids: string[]
          featured_look_ids: string[]
          hero_subtitle: string | null
          hero_title: string | null
          id: number
          updated_at: string
        }
        Insert: {
          featured_article_ids?: string[]
          featured_brand_ids?: string[]
          featured_collection_ids?: string[]
          featured_look_ids?: string[]
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: number
          updated_at?: string
        }
        Update: {
          featured_article_ids?: string[]
          featured_brand_ids?: string[]
          featured_collection_ids?: string[]
          featured_look_ids?: string[]
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      look_items: {
        Row: {
          id: string
          look_id: string
          position: number
          product_id: string
          x: number
          y: number
        }
        Insert: {
          id?: string
          look_id: string
          position?: number
          product_id: string
          x?: number
          y?: number
        }
        Update: {
          id?: string
          look_id?: string
          position?: number
          product_id?: string
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "look_items_look_id_fkey"
            columns: ["look_id"]
            isOneToOne: false
            referencedRelation: "looks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "look_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      looks: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          model_id: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model_id?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model_id?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "looks_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          created_at: string
          created_by: string | null
          filename: string
          height: number | null
          id: string
          kind: string
          mime_type: string
          path: string
          size_bytes: number
          url: string
          width: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          filename: string
          height?: number | null
          id?: string
          kind?: string
          mime_type: string
          path: string
          size_bytes: number
          url: string
          width?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          filename?: string
          height?: number | null
          id?: string
          kind?: string
          mime_type?: string
          path?: string
          size_bytes?: number
          url?: string
          width?: number | null
        }
        Relationships: []
      }
      models: {
        Row: {
          created_at: string
          description: string | null
          foot: number
          id: string
          image_height: number | null
          image_url: string
          image_width: number | null
          name: string
          reference: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          foot?: number
          id?: string
          image_height?: number | null
          image_url: string
          image_width?: number | null
          name: string
          reference?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          foot?: number
          id?: string
          image_height?: number | null
          image_url?: string
          image_width?: number | null
          name?: string
          reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand_id: string
          category: string
          collection_id: string
          colors: string[]
          created_at: string
          description: string | null
          id: string
          images: string[]
          main_image: string | null
          material: string | null
          name: string
          price: number
          reference: string | null
          sizes: string[]
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["content_status"]
          updated_at: string
        }
        Insert: {
          brand_id: string
          category: string
          collection_id: string
          colors?: string[]
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          main_image?: string | null
          material?: string | null
          name: string
          price?: number
          reference?: string | null
          sizes?: string[]
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Update: {
          brand_id?: string
          category?: string
          collection_id?: string
          colors?: string[]
          created_at?: string
          description?: string | null
          id?: string
          images?: string[]
          main_image?: string | null
          material?: string | null
          name?: string
          price?: number
          reference?: string | null
          sizes?: string[]
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["content_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
      content_status: "draft" | "published"
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
    Enums: {
      app_role: ["admin"],
      content_status: ["draft", "published"],
    },
  },
} as const
