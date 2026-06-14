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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          base_price: number | null
          bathroom_condition: string | null
          bathrooms: number | null
          bedrooms: number | null
          clean_bathrooms: boolean | null
          clean_bedrooms: boolean | null
          clean_common_area: boolean | null
          clean_hallways: boolean | null
          clean_floors: boolean | null
          clean_kitchen: boolean | null
          cleaner_id: string | null
          cleaner_marked_complete_at: string | null
          cleaner_payout_cents: number | null
          client_id: string
          client_marked_complete_at: string | null
          client_requested_hours: number | null
          completion_dispute_reason: string | null
          completion_disputed_at: string | null
          clutter_level: string | null
          counter_adjustments: Json | null
          counter_hours: number | null
          counter_reason: string | null
          counter_scope_snapshot: Json | null
          counter_total_price_cents: number | null
          countered_at: string | null
          created_at: string
          duration_hours: number | null
          extra_tasks: Json | null
          floor_type: string | null
          has_pets: boolean | null
          home_condition: string | null
          home_type: string | null
          hourly_rate_snapshot: number | null
          id: string
          job_scope: Json | null
          kitchen_condition: string | null
          last_cleaned: string | null
          maximum_hours: number | null
          mess_level: string | null
          minimum_hours: number | null
          notes: string | null
          paid_at: string | null
          payment_status: string
          pet_hair_level: string | null
          payout_status: string
          platform_fee: number | null
          platform_fee_cents: number | null
          recommended_hours: number | null
          scheduled_at: string | null
          scope_snapshot: Json | null
          service_address: string | null
          service_price_cents: number | null
          service_type: string | null
          special_requests: string | null
          square_feet_range: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          supplies_needed: boolean | null
          total_price: number | null
          total_price_cents: number | null
          visit_type: string | null
        }
        Insert: {
          base_price?: number | null
          bathroom_condition?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          clean_bathrooms?: boolean | null
          clean_bedrooms?: boolean | null
          clean_common_area?: boolean | null
          clean_hallways?: boolean | null
          clean_floors?: boolean | null
          clean_kitchen?: boolean | null
          cleaner_id?: string | null
          cleaner_marked_complete_at?: string | null
          cleaner_payout_cents?: number | null
          client_id?: string
          client_marked_complete_at?: string | null
          client_requested_hours?: number | null
          completion_dispute_reason?: string | null
          completion_disputed_at?: string | null
          clutter_level?: string | null
          counter_adjustments?: Json | null
          counter_hours?: number | null
          counter_reason?: string | null
          counter_scope_snapshot?: Json | null
          counter_total_price_cents?: number | null
          countered_at?: string | null
          created_at?: string
          duration_hours?: number | null
          extra_tasks?: Json | null
          floor_type?: string | null
          has_pets?: boolean | null
          home_condition?: string | null
          home_type?: string | null
          hourly_rate_snapshot?: number | null
          id?: string
          job_scope?: Json | null
          kitchen_condition?: string | null
          last_cleaned?: string | null
          maximum_hours?: number | null
          mess_level?: string | null
          minimum_hours?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_status?: string
          pet_hair_level?: string | null
          payout_status?: string
          platform_fee?: number | null
          platform_fee_cents?: number | null
          recommended_hours?: number | null
          scheduled_at?: string | null
          scope_snapshot?: Json | null
          service_address?: string | null
          service_price_cents?: number | null
          service_type?: string | null
          special_requests?: string | null
          square_feet_range?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          supplies_needed?: boolean | null
          total_price?: number | null
          total_price_cents?: number | null
          visit_type?: string | null
        }
        Update: {
          base_price?: number | null
          bathroom_condition?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          clean_bathrooms?: boolean | null
          clean_bedrooms?: boolean | null
          clean_common_area?: boolean | null
          clean_hallways?: boolean | null
          clean_floors?: boolean | null
          clean_kitchen?: boolean | null
          cleaner_id?: string | null
          cleaner_marked_complete_at?: string | null
          cleaner_payout_cents?: number | null
          client_id?: string
          client_marked_complete_at?: string | null
          client_requested_hours?: number | null
          completion_dispute_reason?: string | null
          completion_disputed_at?: string | null
          clutter_level?: string | null
          counter_adjustments?: Json | null
          counter_hours?: number | null
          counter_reason?: string | null
          counter_scope_snapshot?: Json | null
          counter_total_price_cents?: number | null
          countered_at?: string | null
          created_at?: string
          duration_hours?: number | null
          extra_tasks?: Json | null
          floor_type?: string | null
          has_pets?: boolean | null
          home_condition?: string | null
          home_type?: string | null
          hourly_rate_snapshot?: number | null
          id?: string
          job_scope?: Json | null
          kitchen_condition?: string | null
          last_cleaned?: string | null
          maximum_hours?: number | null
          mess_level?: string | null
          minimum_hours?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_status?: string
          pet_hair_level?: string | null
          payout_status?: string
          platform_fee?: number | null
          platform_fee_cents?: number | null
          recommended_hours?: number | null
          scheduled_at?: string | null
          scope_snapshot?: Json | null
          service_address?: string | null
          service_price_cents?: number | null
          service_type?: string | null
          special_requests?: string | null
          square_feet_range?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          supplies_needed?: boolean | null
          total_price?: number | null
          total_price_cents?: number | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cleaner_id_fkey"
            columns: ["cleaner_id"]
            isOneToOne: false
            referencedRelation: "cleaner_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_photos: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          storage_bucket: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          storage_bucket?: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          storage_bucket?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_photos_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      cleaner_profiles: {
        Row: {
          avg_rating: number
          bio: string | null
          created_at: string
          hourly_rate: number | null
          is_available: boolean
          lat: number | null
          lng: number | null
          profile_photo_url: string | null
          service_radius_miles: number | null
          stripe_account_id: string | null
          stripe_onboarded: boolean
          total_jobs: number
          user_id: string
          years_experience: number | null
        }
        Insert: {
          avg_rating?: number
          bio?: string | null
          created_at?: string
          hourly_rate?: number | null
          is_available?: boolean
          lat?: number | null
          lng?: number | null
          profile_photo_url?: string | null
          service_radius_miles?: number | null
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          total_jobs?: number
          user_id: string
          years_experience?: number | null
        }
        Update: {
          avg_rating?: number
          bio?: string | null
          created_at?: string
          hourly_rate?: number | null
          is_available?: boolean
          lat?: number | null
          lng?: number | null
          profile_photo_url?: string | null
          service_radius_miles?: number | null
          stripe_account_id?: string | null
          stripe_onboarded?: boolean
          total_jobs?: number
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cleaner_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          created_at: string
          evidence_urls: string[] | null
          id: string
          raised_by: string
          reason: string | null
          resolution_notes: string | null
          status: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          evidence_urls?: string[] | null
          id?: string
          raised_by: string
          reason?: string | null
          resolution_notes?: string | null
          status?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          evidence_urls?: string[] | null
          id?: string
          raised_by?: string
          reason?: string | null
          resolution_notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          payload: Json | null
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json | null
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json | null
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_booking_participant: {
        Args: { p_booking_id: string }
        Returns: boolean
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
