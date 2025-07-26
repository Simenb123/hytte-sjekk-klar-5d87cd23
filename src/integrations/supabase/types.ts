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
      areas: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      booking_facilities_used: {
        Row: {
          booking_id: string | null
          created_at: string
          facility_id: string
          id: string
          is_used: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          facility_id: string
          id?: string
          is_used?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          facility_id?: string
          id?: string
          is_used?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_facilities_used_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_family_members: {
        Row: {
          booking_id: string
          created_at: string
          family_member_id: string
          id: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          family_member_id: string
          id?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          family_member_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_family_members_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_family_members_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_notifications: {
        Row: {
          booking_id: string
          created_at: string
          id: string
          notification_type: string
          scheduled_for: string
          sent_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string
          id?: string
          notification_type: string
          scheduled_for: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string
          id?: string
          notification_type?: string
          scheduled_for?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          created_at: string
          description: string | null
          end_date: string
          google_event_id: string | null
          id: string
          start_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date: string
          google_event_id?: string | null
          id?: string
          start_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string
          google_event_id?: string | null
          id?: string
          start_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cabin_documents: {
        Row: {
          category: string
          content: string
          created_at: string
          file_url: string | null
          front_page_image_id: string | null
          id: string
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          file_url?: string | null
          front_page_image_id?: string | null
          id?: string
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          file_url?: string | null
          front_page_image_id?: string | null
          id?: string
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cabin_documents_front_page_image_id_fkey"
            columns: ["front_page_image_id"]
            isOneToOne: false
            referencedRelation: "document_images"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          analysis: string | null
          content: string
          created_at: string
          id: string
          image: string | null
          is_voice: boolean | null
          role: string
          session_id: string
        }
        Insert: {
          analysis?: string | null
          content: string
          created_at?: string
          id?: string
          image?: string | null
          is_voice?: boolean | null
          role: string
          session_id: string
        }
        Update: {
          analysis?: string | null
          content?: string
          created_at?: string
          id?: string
          image?: string | null
          is_voice?: boolean | null
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      checklist_item_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_item_images_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_item_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          app_description: string | null
          app_icon_url: string | null
          app_name: string | null
          app_url_android: string | null
          app_url_ios: string | null
          area_id: string | null
          assigned_to: string | null
          category: string | null
          created_at: string
          facility_id: string | null
          id: string
          season: string | null
          text: string
        }
        Insert: {
          app_description?: string | null
          app_icon_url?: string | null
          app_name?: string | null
          app_url_android?: string | null
          app_url_ios?: string | null
          area_id?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          facility_id?: string | null
          id?: string
          season?: string | null
          text: string
        }
        Update: {
          app_description?: string | null
          app_icon_url?: string | null
          app_name?: string | null
          app_url_android?: string | null
          app_url_ios?: string | null
          area_id?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          facility_id?: string | null
          id?: string
          season?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_area"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      completion_logs: {
        Row: {
          booking_id: string | null
          completed_at: string
          id: string
          is_completed: boolean
          item_id: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          completed_at?: string
          id?: string
          is_completed?: boolean
          item_id: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          completed_at?: string
          id?: string
          is_completed?: boolean
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "completion_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completion_logs_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completion_logs_user_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_images: {
        Row: {
          created_at: string
          description: string | null
          document_id: string
          id: string
          image_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_id: string
          id?: string
          image_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_id?: string
          id?: string
          image_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_images_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "cabin_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      facilities: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_seasonal: boolean | null
          name: string
          season: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_seasonal?: boolean | null
          name: string
          season?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_seasonal?: boolean | null
          name?: string
          season?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          birth_date: string | null
          created_at: string
          id: string
          is_user: boolean | null
          linked_user_id: string | null
          name: string
          nickname: string | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          id?: string
          is_user?: boolean | null
          linked_user_id?: string | null
          name: string
          nickname?: string | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          id?: string
          is_user?: boolean | null
          linked_user_id?: string | null
          name?: string
          nickname?: string | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hyttebok_entries: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          brand: string | null
          category: string | null
          color: string | null
          created_at: string
          description: string | null
          family_member_id: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          owner: string | null
          primary_location: Database["public"]["Enums"]["primary_location_enum"]
          shelf: string | null
          size: string | null
          subcategory: string | null
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          family_member_id?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          owner?: string | null
          primary_location?: Database["public"]["Enums"]["primary_location_enum"]
          shelf?: string | null
          size?: string | null
          subcategory?: string | null
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          color?: string | null
          created_at?: string
          description?: string | null
          family_member_id?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          owner?: string | null
          primary_location?: Database["public"]["Enums"]["primary_location_enum"]
          shelf?: string | null
          size?: string | null
          subcategory?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      item_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_images_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          booking_reminders: boolean | null
          created_at: string
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          seasonal_info: boolean | null
          sms_enabled: boolean | null
          updated_at: string
          user_id: string
          weather_updates: boolean | null
        }
        Insert: {
          booking_reminders?: boolean | null
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          seasonal_info?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id: string
          weather_updates?: boolean | null
        }
        Update: {
          booking_reminders?: boolean | null
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          seasonal_info?: boolean | null
          sms_enabled?: boolean | null
          updated_at?: string
          user_id?: string
          weather_updates?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          related_booking_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          related_booking_id?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          related_booking_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_assignments: {
        Row: {
          created_at: string
          item_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string
          item_id: string
          profile_id: string
        }
        Update: {
          created_at?: string
          item_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "owner_assignments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          first_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          first_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          first_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          scheduled_for: string
          sent_at: string | null
          status: string | null
          subject: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          scheduled_for: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          assigned_at: string
          assigned_by_user_id: string
          checklist_item_id: string
          completed_at: string | null
          family_member_id: string
          id: string
          is_completed: boolean | null
          notes: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by_user_id: string
          checklist_item_id: string
          completed_at?: string | null
          family_member_id: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by_user_id?: string
          checklist_item_id?: string
          completed_at?: string | null
          family_member_id?: string
          id?: string
          is_completed?: boolean | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_checklist_item_id_fkey"
            columns: ["checklist_item_id"]
            isOneToOne: false
            referencedRelation: "checklist_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_family_member_id_fkey"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_members"
            referencedColumns: ["id"]
          },
        ]
      }
      wine_cellar: {
        Row: {
          alcohol_percentage: number | null
          bottle_count: number
          consumed_date: string | null
          consumed_with: string | null
          country: string | null
          created_at: string
          current_price: number | null
          description: string | null
          grape_variety: string | null
          id: string
          image_url: string | null
          is_consumed: boolean
          location: string
          name: string
          producer: string | null
          purchase_date: string | null
          purchase_info: string | null
          purchase_price: number | null
          rating: number | null
          region: string | null
          serving_notes: string | null
          tasting_notes: string | null
          updated_at: string
          user_id: string
          vinmonopol_id: string | null
          vinmonopol_url: string | null
          vintage: string | null
          wine_color: string | null
        }
        Insert: {
          alcohol_percentage?: number | null
          bottle_count?: number
          consumed_date?: string | null
          consumed_with?: string | null
          country?: string | null
          created_at?: string
          current_price?: number | null
          description?: string | null
          grape_variety?: string | null
          id?: string
          image_url?: string | null
          is_consumed?: boolean
          location?: string
          name: string
          producer?: string | null
          purchase_date?: string | null
          purchase_info?: string | null
          purchase_price?: number | null
          rating?: number | null
          region?: string | null
          serving_notes?: string | null
          tasting_notes?: string | null
          updated_at?: string
          user_id: string
          vinmonopol_id?: string | null
          vinmonopol_url?: string | null
          vintage?: string | null
          wine_color?: string | null
        }
        Update: {
          alcohol_percentage?: number | null
          bottle_count?: number
          consumed_date?: string | null
          consumed_with?: string | null
          country?: string | null
          created_at?: string
          current_price?: number | null
          description?: string | null
          grape_variety?: string | null
          id?: string
          image_url?: string | null
          is_consumed?: boolean
          location?: string
          name?: string
          producer?: string | null
          purchase_date?: string | null
          purchase_info?: string | null
          purchase_price?: number | null
          rating?: number | null
          region?: string | null
          serving_notes?: string | null
          tasting_notes?: string | null
          updated_at?: string
          user_id?: string
          vinmonopol_id?: string | null
          vinmonopol_url?: string | null
          vintage?: string | null
          wine_color?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_cabin_documents: {
        Args: { search_query: string }
        Returns: {
          id: string
          title: string
          category: string
          summary: string
          content: string
          file_url: string
          tags: string[]
          relevance: number
        }[]
      }
    }
    Enums: {
      primary_location_enum: "hjemme" | "hytta" | "reiser"
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
    Enums: {
      primary_location_enum: ["hjemme", "hytta", "reiser"],
    },
  },
} as const
