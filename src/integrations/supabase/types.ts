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
      attendance: {
        Row: {
          checked_in_at: string
          checked_in_by: string | null
          created_at: string
          enrollment_id: string
          id: string
          method: string
          participant_id: string | null
          program_id: string
          status: string
          ticket_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          checked_in_at?: string
          checked_in_by?: string | null
          created_at?: string
          enrollment_id: string
          id?: string
          method?: string
          participant_id?: string | null
          program_id: string
          status?: string
          ticket_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          checked_in_at?: string
          checked_in_by?: string | null
          created_at?: string
          enrollment_id?: string
          id?: string
          method?: string
          participant_id?: string | null
          program_id?: string
          status?: string
          ticket_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "enrollment_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          published: boolean
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          published?: boolean
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          published?: boolean
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      celebrities: {
        Row: {
          created_at: string
          id: string
          name: string
          photo_path: string | null
          photo_url: string | null
          published: boolean
          role: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          photo_path?: string | null
          photo_url?: string | null
          published?: boolean
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          photo_path?: string | null
          photo_url?: string | null
          published?: boolean
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      choreographies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          instagram_url: string | null
          published: boolean
          sort_order: number
          thumbnail_url: string | null
          title: string
          updated_at: string
          uploaded_at: string
          video_url: string | null
          youtube_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          instagram_url?: string | null
          published?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          uploaded_at?: string
          video_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          instagram_url?: string | null
          published?: boolean
          sort_order?: number
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          uploaded_at?: string
          video_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          read: boolean
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          read?: boolean
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          read?: boolean
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dance_styles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          image_url: string | null
          name: string
          sort_order: number
          tagline: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          sort_order?: number
          tagline?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          sort_order?: number
          tagline?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      enrollment_participants: {
        Row: {
          created_at: string
          email: string | null
          enrollment_id: string
          full_name: string
          id: string
          phone: string | null
          position: number
          program_id: string
          ticket_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          enrollment_id: string
          full_name: string
          id?: string
          phone?: string | null
          position: number
          program_id: string
          ticket_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          enrollment_id?: string
          full_name?: string
          id?: string
          phone?: string | null
          position?: number
          program_id?: string
          ticket_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_participants_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_participants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_participants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          address: string | null
          age: number | null
          amount_inr: number
          approved_at: string | null
          approved_by: string | null
          city: string | null
          confirmation_email_error: string | null
          confirmation_email_sent: boolean
          created_at: string
          email: string | null
          emergency_contact: string | null
          full_name: string | null
          gender: string | null
          id: string
          medical_info: string | null
          notification_provider: string | null
          participant_count: number
          payment_confirmed_at: string | null
          payment_note: string | null
          payment_proof_path: string | null
          payment_proof_sha256: string | null
          payment_reference: string | null
          phone: string | null
          price_tier_id: string | null
          program_id: string
          registration_type: string
          selected_workshop: string | null
          silver_amount_inr: number
          silver_seat: boolean
          silver_seat_w1: boolean
          silver_seat_w2: boolean
          sms_error: string | null
          sms_message_id: string | null
          sms_sent_at: string | null
          sms_status: string | null
          state: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          ticket_code: string | null
          ticket_generated_at: string | null
          tier_price_inr: number | null
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
          confirmation_email_error?: string | null
          confirmation_email_sent?: boolean
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_info?: string | null
          notification_provider?: string | null
          participant_count?: number
          payment_confirmed_at?: string | null
          payment_note?: string | null
          payment_proof_path?: string | null
          payment_proof_sha256?: string | null
          payment_reference?: string | null
          phone?: string | null
          price_tier_id?: string | null
          program_id: string
          registration_type?: string
          selected_workshop?: string | null
          silver_amount_inr?: number
          silver_seat?: boolean
          silver_seat_w1?: boolean
          silver_seat_w2?: boolean
          sms_error?: string | null
          sms_message_id?: string | null
          sms_sent_at?: string | null
          sms_status?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          ticket_code?: string | null
          ticket_generated_at?: string | null
          tier_price_inr?: number | null
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
          confirmation_email_error?: string | null
          confirmation_email_sent?: boolean
          created_at?: string
          email?: string | null
          emergency_contact?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          medical_info?: string | null
          notification_provider?: string | null
          participant_count?: number
          payment_confirmed_at?: string | null
          payment_note?: string | null
          payment_proof_path?: string | null
          payment_proof_sha256?: string | null
          payment_reference?: string | null
          phone?: string | null
          price_tier_id?: string | null
          program_id?: string
          registration_type?: string
          selected_workshop?: string | null
          silver_amount_inr?: number
          silver_seat?: boolean
          silver_seat_w1?: boolean
          silver_seat_w2?: boolean
          sms_error?: string | null
          sms_message_id?: string | null
          sms_sent_at?: string | null
          sms_status?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          ticket_code?: string | null
          ticket_generated_at?: string | null
          tier_price_inr?: number | null
          updated_at?: string
          user_id?: string
          whatsapp_error?: string | null
          whatsapp_message_id?: string | null
          whatsapp_sent_at?: string | null
          whatsapp_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_price_tier_id_fkey"
            columns: ["price_tier_id"]
            isOneToOne: false
            referencedRelation: "program_price_tiers"
            referencedColumns: ["id"]
          },
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
      featured_experience: {
        Row: {
          active: boolean
          banner_url: string | null
          city: string | null
          created_at: string
          cta_link: string
          cta_text: string
          day_schedule: Json
          description: string
          end_date: string | null
          id: string
          start_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          banner_url?: string | null
          city?: string | null
          created_at?: string
          cta_link?: string
          cta_text?: string
          day_schedule?: Json
          description?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          banner_url?: string | null
          city?: string | null
          created_at?: string
          cta_link?: string
          cta_text?: string
          day_schedule?: Json
          description?: string
          end_date?: string | null
          id?: string
          start_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          active: boolean
          caption: string
          created_at: string
          id: string
          image_url: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          caption?: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          caption?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      globe_locations: {
        Row: {
          city: string
          country: string
          created_at: string
          event_date: string | null
          id: string
          published: boolean
          sort_order: number
          status: Database["public"]["Enums"]["globe_status"]
          updated_at: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          event_date?: string | null
          id?: string
          published?: boolean
          sort_order?: number
          status?: Database["public"]["Enums"]["globe_status"]
          updated_at?: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          event_date?: string | null
          id?: string
          published?: boolean
          sort_order?: number
          status?: Database["public"]["Enums"]["globe_status"]
          updated_at?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          active: boolean
          alt: string
          created_at: string
          id: string
          image_url: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          alt?: string
          created_at?: string
          id?: string
          image_url: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          alt?: string
          created_at?: string
          id?: string
          image_url?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      home_performances: {
        Row: {
          achievement: string | null
          active: boolean
          created_at: string
          cta_link: string | null
          cta_text: string
          event_name: string | null
          id: string
          location: string | null
          media_kind: string
          media_path: string | null
          poster_path: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          achievement?: string | null
          active?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string
          event_name?: string | null
          id?: string
          location?: string | null
          media_kind?: string
          media_path?: string | null
          poster_path?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          achievement?: string | null
          active?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string
          event_name?: string | null
          id?: string
          location?: string | null
          media_kind?: string
          media_path?: string | null
          poster_path?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
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
      program_price_tiers: {
        Row: {
          both_price: number | null
          created_at: string
          id: string
          label: string | null
          max_registrations: number
          price_inr: number
          program_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          both_price?: number | null
          created_at?: string
          id?: string
          label?: string | null
          max_registrations: number
          price_inr: number
          program_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          both_price?: number | null
          created_at?: string
          id?: string
          label?: string | null
          max_registrations?: number
          price_inr?: number
          program_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_price_tiers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_price_tiers_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          active: boolean
          allow_both: boolean
          allow_single: boolean
          bank_account_holder: string | null
          banner_gif_path: string | null
          banner_path: string | null
          banner_url: string | null
          banner_video_path: string | null
          both_price: number | null
          capacity: number | null
          category: string | null
          city: string | null
          created_at: string
          description: string | null
          duration: string | null
          event_date: string | null
          event_time: string | null
          id: string
          instructor: string | null
          kind: Database["public"]["Enums"]["program_kind"]
          latitude: number | null
          longitude: number | null
          maps_url: string | null
          name: string
          price_inr: number
          published: boolean
          registration_open_on: string | null
          seats: number | null
          seats_taken: number
          session_schedule: Json
          silver_capacity_w1: number | null
          silver_capacity_w2: number | null
          silver_seat_enabled: boolean
          silver_seat_price: number
          starts_on: string | null
          style: string | null
          upi_id_encrypted: string | null
          venue: string | null
          venue_address: string | null
          whatsapp_number: string | null
          workshop1_name: string | null
          workshop2_name: string | null
        }
        Insert: {
          active?: boolean
          allow_both?: boolean
          allow_single?: boolean
          bank_account_holder?: string | null
          banner_gif_path?: string | null
          banner_path?: string | null
          banner_url?: string | null
          banner_video_path?: string | null
          both_price?: number | null
          capacity?: number | null
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          instructor?: string | null
          kind: Database["public"]["Enums"]["program_kind"]
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          name: string
          price_inr: number
          published?: boolean
          registration_open_on?: string | null
          seats?: number | null
          seats_taken?: number
          session_schedule?: Json
          silver_capacity_w1?: number | null
          silver_capacity_w2?: number | null
          silver_seat_enabled?: boolean
          silver_seat_price?: number
          starts_on?: string | null
          style?: string | null
          upi_id_encrypted?: string | null
          venue?: string | null
          venue_address?: string | null
          whatsapp_number?: string | null
          workshop1_name?: string | null
          workshop2_name?: string | null
        }
        Update: {
          active?: boolean
          allow_both?: boolean
          allow_single?: boolean
          bank_account_holder?: string | null
          banner_gif_path?: string | null
          banner_path?: string | null
          banner_url?: string | null
          banner_video_path?: string | null
          both_price?: number | null
          capacity?: number | null
          category?: string | null
          city?: string | null
          created_at?: string
          description?: string | null
          duration?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string
          instructor?: string | null
          kind?: Database["public"]["Enums"]["program_kind"]
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          name?: string
          price_inr?: number
          published?: boolean
          registration_open_on?: string | null
          seats?: number | null
          seats_taken?: number
          session_schedule?: Json
          silver_capacity_w1?: number | null
          silver_capacity_w2?: number | null
          silver_seat_enabled?: boolean
          silver_seat_price?: number
          starts_on?: string | null
          style?: string | null
          upi_id_encrypted?: string | null
          venue?: string | null
          venue_address?: string | null
          whatsapp_number?: string | null
          workshop1_name?: string | null
          workshop2_name?: string | null
        }
        Relationships: []
      }
      signature_programs: {
        Row: {
          active: boolean
          created_at: string
          cta_link: string | null
          cta_text: string
          description: string | null
          id: string
          media_kind: string
          media_path: string | null
          poster_path: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string
          description?: string | null
          id?: string
          media_kind?: string
          media_path?: string | null
          poster_path?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string
          description?: string | null
          id?: string
          media_kind?: string
          media_path?: string | null
          poster_path?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          rating: number | null
          role: string | null
          story: string | null
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          rating?: number | null
          role?: string | null
          story?: string | null
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          rating?: number | null
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
      workshop_hero_slides: {
        Row: {
          active: boolean
          created_at: string
          cta_link: string | null
          cta_text: string | null
          description: string | null
          end_at: string | null
          id: string
          media_kind: string
          media_path: string
          poster_path: string | null
          sort_order: number
          start_at: string | null
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          media_kind?: string
          media_path: string
          poster_path?: string | null
          sort_order?: number
          start_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          media_kind?: string
          media_path?: string
          poster_path?: string | null
          sort_order?: number
          start_at?: string | null
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      workshop_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          media_kind: string
          media_path: string
          poster_path: string | null
          program_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          media_kind: string
          media_path: string
          poster_path?: string | null
          program_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          media_kind?: string
          media_path?: string
          poster_path?: string | null
          program_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_media_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_media_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      zero_to_hero_media: {
        Row: {
          active: boolean
          caption: string | null
          created_at: string
          id: string
          media_kind: string
          media_path: string
          poster_path: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          caption?: string | null
          created_at?: string
          id?: string
          media_kind: string
          media_path: string
          poster_path?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          caption?: string | null
          created_at?: string
          id?: string
          media_kind?: string
          media_path?: string
          poster_path?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      programs_public: {
        Row: {
          allow_both: boolean | null
          allow_single: boolean | null
          bank_account_holder: string | null
          banner_gif_path: string | null
          banner_path: string | null
          banner_url: string | null
          banner_video_path: string | null
          both_price: number | null
          capacity: number | null
          category: string | null
          city: string | null
          created_at: string | null
          description: string | null
          duration: string | null
          event_date: string | null
          event_time: string | null
          id: string | null
          instructor: string | null
          kind: Database["public"]["Enums"]["program_kind"] | null
          latitude: number | null
          longitude: number | null
          maps_url: string | null
          name: string | null
          price_inr: number | null
          published: boolean | null
          registration_open_on: string | null
          seats_taken: number | null
          session_schedule: Json | null
          silver_capacity_w1: number | null
          silver_capacity_w2: number | null
          silver_seat_enabled: boolean | null
          silver_seat_price: number | null
          style: string | null
          venue: string | null
          venue_address: string | null
          workshop1_name: string | null
          workshop2_name: string | null
        }
        Insert: {
          allow_both?: boolean | null
          allow_single?: boolean | null
          bank_account_holder?: never
          banner_gif_path?: string | null
          banner_path?: string | null
          banner_url?: string | null
          banner_video_path?: string | null
          both_price?: number | null
          capacity?: number | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string | null
          instructor?: string | null
          kind?: Database["public"]["Enums"]["program_kind"] | null
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          name?: string | null
          price_inr?: number | null
          published?: boolean | null
          registration_open_on?: string | null
          seats_taken?: number | null
          session_schedule?: Json | null
          silver_capacity_w1?: number | null
          silver_capacity_w2?: number | null
          silver_seat_enabled?: boolean | null
          silver_seat_price?: number | null
          style?: string | null
          venue?: string | null
          venue_address?: string | null
          workshop1_name?: string | null
          workshop2_name?: string | null
        }
        Update: {
          allow_both?: boolean | null
          allow_single?: boolean | null
          bank_account_holder?: never
          banner_gif_path?: string | null
          banner_path?: string | null
          banner_url?: string | null
          banner_video_path?: string | null
          both_price?: number | null
          capacity?: number | null
          category?: string | null
          city?: string | null
          created_at?: string | null
          description?: string | null
          duration?: string | null
          event_date?: string | null
          event_time?: string | null
          id?: string | null
          instructor?: string | null
          kind?: Database["public"]["Enums"]["program_kind"] | null
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          name?: string | null
          price_inr?: number | null
          published?: boolean | null
          registration_open_on?: string | null
          seats_taken?: number | null
          session_schedule?: Json | null
          silver_capacity_w1?: number | null
          silver_capacity_w2?: number | null
          silver_seat_enabled?: boolean | null
          silver_seat_price?: number | null
          style?: string | null
          venue?: string | null
          venue_address?: string | null
          workshop1_name?: string | null
          workshop2_name?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_program_pricing: { Args: { _program_id: string }; Returns: Json }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      enrollment_status:
        | "awaiting_payment"
        | "payment_submitted"
        | "confirmed"
        | "rejected"
      globe_status: "conducted" | "upcoming"
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
      app_role: ["admin", "user"],
      enrollment_status: [
        "awaiting_payment",
        "payment_submitted",
        "confirmed",
        "rejected",
      ],
      globe_status: ["conducted", "upcoming"],
      program_kind: [
        "workshop",
        "nritya_sadhana",
        "zero_to_hero",
        "online_training",
      ],
    },
  },
} as const
