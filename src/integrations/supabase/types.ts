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
      app_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          address: string | null
          age: number | null
          amount_inr: number
          approved_at: string | null
          approved_by: string | null
          city: string | null
          created_at: string
          email: string | null
          emergency_contact: string | null
          full_name: string | null
          gender: string | null
          id: string
          medical_info: string | null
          notification_provider: string | null
          payment_confirmed_at: string | null
          payment_note: string | null
          phone: string | null
          program_id: string
          sms_error: string | null
          sms_message_id: string | null
          sms_sent_at: string | null
          sms_status: string | null
          state: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          ticket_code: string | null
          ticket_generated_at: string | null
          updated_at: string
          user_id: string
          whatsapp_error: string | null
          whatsapp_message_id: string | null
          whatsapp_sent_at: string | null
          whatsapp_status: string | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          amount_inr: number
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_info?: string | null
          notification_provider?: string | null
          payment_confirmed_at?: string | null
          payment_note?: string | null
          phone?: string | null
          program_id: string
          sms_error?: string | null
          sms_message_id?: string | null
          sms_sent_at?: string | null
          sms_status?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          ticket_code?: string | null
          ticket_generated_at?: string | null
          updated_at?: string
          user_id: string
          whatsapp_error?: string | null
          whatsapp_message_id?: string | null
          whatsapp_sent_at?: string | null
          whatsapp_status?: string | null
        }
        Update: {
          address?: string | null
          age?: number | null
          amount_inr?: number
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_info?: string | null
          notification_provider?: string | null
          payment_confirmed_at?: string | null
          payment_note?: string | null
          phone?: string | null
          program_id?: string
          sms_error?: string | null
          sms_message_id?: string | null
          sms_sent_at?: string | null
          sms_status?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          ticket_code?: string | null
          ticket_generated_at?: string | null
          updated_at?: string
          user_id?: string
          whatsapp_error?: string | null
          whatsapp_message_id?: string | null
          whatsapp_sent_at?: string | null
          whatsapp_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          event_date: string
          id: string
          title: string
          venue: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          title: string
          venue?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          title?: string
          venue?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          email: string | null
          experience: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          email?: string | null
          experience?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          created_at?: string
          email?: string | null
          experience?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          active: boolean
          banner_url: string | null
          capacity: number | null
          category: string | null
          created_at: string
          description: string | null
          duration: string | null
          event_date: string | null
          event_time: string | null
          id: string
          instructor: string | null
          kind: Database["public"]["Enums"]["program_kind"]
          name: string
          price_inr: number
          published: boolean
          registration_closes_on: string | null
          seats: number | null
          seats_taken: number
          starts_on: string | null
          style: string | null
          upi_id_encrypted: string | null
          venue: string | null
        }
        Insert: {
          active?: boolean
          banner_url?: string | null
          capacity?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          instructor?: string | null
          kind: Database["public"]["Enums"]["program_kind"]
          name: string
          price_inr: number
          published?: boolean
          registration_closes_on?: string | null
          seats?: number | null
          seats_taken?: number
          starts_on?: string | null
          style?: string | null
          upi_id_encrypted?: string | null
          venue?: string | null
        }
        Update: {
          active?: boolean
          banner_url?: string | null
          capacity?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          instructor?: string | null
          kind?: Database["public"]["Enums"]["program_kind"]
          name?: string
          price_inr?: number
          published?: boolean
          registration_closes_on?: string | null
          seats?: number | null
          seats_taken?: number
          starts_on?: string | null
          style?: string | null
          upi_id_encrypted?: string | null
          venue?: string | null
        }
        Relationships: []
      }
      team_profiles: {
        Row: {
          achievements: string[] | null
          biography: string | null
          created_at: string
          dance_styles: string[] | null
          designation: string | null
          experience: string | null
          id: string
          name: string
          photo_path: string | null
          photo_url: string | null
          published: boolean
          short_description: string | null
          socials: Json | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          achievements?: string[] | null
          biography?: string | null
          created_at?: string
          dance_styles?: string[] | null
          designation?: string | null
          experience?: string | null
          id?: string
          name: string
          photo_path?: string | null
          photo_url?: string | null
          published?: boolean
          short_description?: string | null
          socials?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          achievements?: string[] | null
          biography?: string | null
          created_at?: string
          dance_styles?: string[] | null
          designation?: string | null
          experience?: string | null
          id?: string
          name?: string
          photo_path?: string | null
          photo_url?: string | null
          published?: boolean
          short_description?: string | null
          socials?: Json | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          approved: boolean
          created_at: string
          id: string
          name: string
          role: string | null
          story: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          approved?: boolean
          created_at?: string
          id?: string
          name: string
          role?: string | null
          story?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          approved?: boolean
          created_at?: string
          id?: string
          name?: string
          role?: string | null
          story?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: []
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
      programs_public: {
        Row: {
          banner_url: string | null
          capacity: number | null
          category: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          event_date: string | null
          event_time: string | null
          id: string | null
          instructor: string | null
          kind: Database["public"]["Enums"]["program_kind"] | null
          name: string | null
          price_inr: number | null
          published: boolean | null
          registration_closes_on: string | null
          seats_taken: number | null
          style: string | null
          venue: string | null
        }
        Insert: {
          banner_url?: string | null
          capacity?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string | null
          instructor?: string | null
          kind?: Database["public"]["Enums"]["program_kind"] | null
          name?: string | null
          price_inr?: number | null
          published?: boolean | null
          registration_closes_on?: string | null
          seats_taken?: number | null
          style?: string | null
          venue?: string | null
        }
        Update: {
          banner_url?: string | null
          capacity?: number | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string | null
          instructor?: string | null
          kind?: Database["public"]["Enums"]["program_kind"] | null
          name?: string | null
          price_inr?: number | null
          published?: boolean | null
          registration_closes_on?: string | null
          seats_taken?: number | null
          style?: string | null
          venue?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "user"
      enrollment_status:
        | "awaiting_payment"
        | "payment_submitted"
        | "confirmed"
        | "rejected"
      program_kind:
        | "workshop"
        | "nritya_sadhana"
        | "zero_to_hero"
        | "online_training"
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
      app_role: ["admin", "user"],
      enrollment_status: [
        "awaiting_payment",
        "payment_submitted",
        "confirmed",
        "rejected",
      ],
      program_kind: [
        "workshop",
        "nritya_sadhana",
        "zero_to_hero",
        "online_training",
      ],
    },
  },
} as const
