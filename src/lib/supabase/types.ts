export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          has_colour_variants: boolean
          has_customisation: boolean
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          has_colour_variants?: boolean
          has_customisation?: boolean
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          has_colour_variants?: boolean
          has_customisation?: boolean
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      colour_options: {
        Row: {
          id: string
          is_active: boolean
          sort_order: number
          value: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          sort_order?: number
          value: string
        }
        Update: {
          id?: string
          is_active?: boolean
          sort_order?: number
          value?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          default_price: number
          id: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          category_id: string
          created_at?: string
          default_price?: number
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          category_id?: string
          created_at?: string
          default_price?: number
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_responses: {
        Row: {
          id: string
          message: string
          parent_signed_name: string | null
          proposal_id: string
          responded_at: string
          response_type: string
          signed_name: string | null
          under_18: boolean
        }
        Insert: {
          id?: string
          message?: string
          parent_signed_name?: string | null
          proposal_id: string
          responded_at?: string
          response_type: string
          signed_name?: string | null
          under_18?: boolean
        }
        Update: {
          id?: string
          message?: string
          parent_signed_name?: string | null
          proposal_id?: string
          responded_at?: string
          response_type?: string
          signed_name?: string | null
          under_18?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "proposal_responses_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          additional_recipients: Json
          ai_image_rights: boolean
          cash_incentive: number
          clauses: Json
          created_at: string
          deal_duration: string
          discount_percent: number
          expires_at: string | null
          id: string
          items: Json
          notes: string
          parent_signed_name: string | null
          photo_provisions: boolean
          player_email: string
          player_name: string
          prepared_by_email: string
          prepared_by_name: string
          prepared_by_phone: string
          prepared_by_role: string
          public_token: string
          reference: string
          sent_at: string | null
          signed_at: string | null
          signed_name: string | null
          signed_under_18: boolean
          status: string
          terms: Json
          updated_at: string
          version: number
        }
        Insert: {
          additional_recipients?: Json
          ai_image_rights?: boolean
          cash_incentive?: number
          clauses?: Json
          created_at?: string
          deal_duration?: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
          items?: Json
          notes?: string
          parent_signed_name?: string | null
          photo_provisions?: boolean
          player_email?: string
          player_name?: string
          prepared_by_email?: string
          prepared_by_name?: string
          prepared_by_phone?: string
          prepared_by_role?: string
          public_token?: string
          reference?: string
          sent_at?: string | null
          signed_at?: string | null
          signed_name?: string | null
          signed_under_18?: boolean
          status?: string
          terms?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          additional_recipients?: Json
          ai_image_rights?: boolean
          cash_incentive?: number
          clauses?: Json
          created_at?: string
          deal_duration?: string
          discount_percent?: number
          expires_at?: string | null
          id?: string
          items?: Json
          notes?: string
          parent_signed_name?: string | null
          photo_provisions?: boolean
          player_email?: string
          player_name?: string
          prepared_by_email?: string
          prepared_by_name?: string
          prepared_by_phone?: string
          prepared_by_role?: string
          public_token?: string
          reference?: string
          sent_at?: string | null
          signed_at?: string | null
          signed_name?: string | null
          signed_under_18?: boolean
          status?: string
          terms?: Json
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          is_active: boolean
          phone: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string
          is_active?: boolean
          phone?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          is_active?: boolean
          phone?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      spec_options: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          price: number
          sort_order: number
          spec_type_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number
          sort_order?: number
          spec_type_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          price?: number
          sort_order?: number
          spec_type_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "spec_options_spec_type_id_fkey"
            columns: ["spec_type_id"]
            isOneToOne: false
            referencedRelation: "spec_types"
            referencedColumns: ["id"]
          },
        ]
      }
      spec_types: {
        Row: {
          created_at: string
          has_pricing: boolean
          id: string
          is_active: boolean
          key: string
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          has_pricing?: boolean
          id?: string
          is_active?: boolean
          key: string
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          has_pricing?: boolean
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      standard_terms: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
        }
        Relationships: []
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
