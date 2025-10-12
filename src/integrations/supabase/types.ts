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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_password_resets: {
        Row: {
          admin_profile_id: string
          created_at: string | null
          id: string
          reason: string | null
          target_user_id: string
        }
        Insert: {
          admin_profile_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
          target_user_id: string
        }
        Update: {
          admin_profile_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_password_resets_admin_profile_id_fkey"
            columns: ["admin_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          can_manage_finances: boolean | null
          can_manage_users: boolean | null
          created_at: string | null
          id: string
          permissions: Json | null
        }
        Insert: {
          can_manage_finances?: boolean | null
          can_manage_users?: boolean | null
          created_at?: string | null
          id: string
          permissions?: Json | null
        }
        Update: {
          can_manage_finances?: boolean | null
          can_manage_users?: boolean | null
          created_at?: string | null
          id?: string
          permissions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_manager: {
        Row: {
          created_at: string | null
          description: string | null
          dj_id: string | null
          end_date: string | null
          genre: string | null
          id: string
          start_date: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          dj_id?: string | null
          end_date?: string | null
          genre?: string | null
          id?: string
          start_date: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          dj_id?: string | null
          end_date?: string | null
          genre?: string | null
          id?: string
          start_date?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_manager_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "djs"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          avatar_url: string | null
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_name: string | null
          cep: number | null
          city: string | null
          cnpj: string | null
          company_name: string
          contract_basic: string | null
          contract_intermediate: string | null
          contract_premium: string | null
          contract_template: string | null
          created_at: string | null
          email: string | null
          id: string
          payment_instructions: string | null
          phone: string | null
          pix_key: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          cep?: number | null
          city?: string | null
          cnpj?: string | null
          company_name: string
          contract_basic?: string | null
          contract_intermediate?: string | null
          contract_premium?: string | null
          contract_template?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          payment_instructions?: string | null
          phone?: string | null
          pix_key?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          cep?: number | null
          city?: string | null
          cnpj?: string | null
          company_name?: string
          contract_basic?: string | null
          contract_intermediate?: string | null
          contract_premium?: string | null
          contract_template?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          payment_instructions?: string | null
          phone?: string | null
          pix_key?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contract_instances: {
        Row: {
          contract_content: string
          contract_value: number
          created_at: string | null
          dj_id: string
          event_id: string
          expires_at: string | null
          id: string
          payment_status: string | null
          pdf_url: string | null
          producer_id: string
          signature_status: string | null
          signed_at: string | null
          template_id: string
          updated_at: string | null
          variables_data: Json | null
        }
        Insert: {
          contract_content: string
          contract_value?: number
          created_at?: string | null
          dj_id: string
          event_id: string
          expires_at?: string | null
          id?: string
          payment_status?: string | null
          pdf_url?: string | null
          producer_id: string
          signature_status?: string | null
          signed_at?: string | null
          template_id: string
          updated_at?: string | null
          variables_data?: Json | null
        }
        Update: {
          contract_content?: string
          contract_value?: number
          created_at?: string | null
          dj_id?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          payment_status?: string | null
          pdf_url?: string | null
          producer_id?: string
          signature_status?: string | null
          signed_at?: string | null
          template_id?: string
          updated_at?: string | null
          variables_data?: Json | null
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          template_content: string
          type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          template_content: string
          type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          template_content?: string
          type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          cancellation_policy: string | null
          commission_amount: number
          commission_rate: number
          contract_number: string
          contract_url: string | null
          created_at: string | null
          created_by: string | null
          custom_clauses: Json | null
          dj_id: string | null
          event_id: string | null
          fee: number
          id: string
          is_signed_by_dj: boolean | null
          is_signed_by_producer: boolean | null
          payment_terms: string | null
          producer_id: string | null
          signed_at: string | null
          updated_at: string | null
        }
        Insert: {
          cancellation_policy?: string | null
          commission_amount: number
          commission_rate: number
          contract_number: string
          contract_url?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_clauses?: Json | null
          dj_id?: string | null
          event_id?: string | null
          fee: number
          id?: string
          is_signed_by_dj?: boolean | null
          is_signed_by_producer?: boolean | null
          payment_terms?: string | null
          producer_id?: string | null
          signed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          cancellation_policy?: string | null
          commission_amount?: number
          commission_rate?: number
          contract_number?: string
          contract_url?: string | null
          created_at?: string | null
          created_by?: string | null
          custom_clauses?: Json | null
          dj_id?: string | null
          event_id?: string | null
          fee?: number
          id?: string
          is_signed_by_dj?: boolean | null
          is_signed_by_producer?: boolean | null
          payment_terms?: string | null
          producer_id?: string | null
          signed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "djs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
      digital_signatures: {
        Row: {
          contract_instance_id: string
          id: string
          ip_address: unknown | null
          is_valid: boolean | null
          location: string | null
          signature_data: string
          signature_hash: string
          signed_at: string | null
          signer_id: string
          signer_name: string
          signer_type: string
          user_agent: string | null
        }
        Insert: {
          contract_instance_id: string
          id?: string
          ip_address?: unknown | null
          is_valid?: boolean | null
          location?: string | null
          signature_data: string
          signature_hash: string
          signed_at?: string | null
          signer_id: string
          signer_name: string
          signer_type: string
          user_agent?: string | null
        }
        Update: {
          contract_instance_id?: string
          id?: string
          ip_address?: unknown | null
          is_valid?: boolean | null
          location?: string | null
          signature_data?: string
          signature_hash?: string
          signed_at?: string | null
          signer_id?: string
          signer_name?: string
          signer_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      dj_producer_relations: {
        Row: {
          created_at: string | null
          dj_id: string | null
          id: string
          is_active: boolean | null
          last_event_date: string | null
          producer_id: string | null
          total_events: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dj_id?: string | null
          id?: string
          is_active?: boolean | null
          last_event_date?: string | null
          producer_id?: string | null
          total_events?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dj_id?: string | null
          id?: string
          is_active?: boolean | null
          last_event_date?: string | null
          producer_id?: string | null
          total_events?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_producer_relations_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "djs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_producer_relations_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
      djs: {
        Row: {
          artist_name: string
          avatar_url: string | null
          background_image_url: string | null
          base_price: number | null
          created_at: string | null
          created_by: string | null
          email: string | null
          genre: string | null
          id: string
          instagram_url: string | null
          is_active: boolean | null
          is_admin: boolean | null
          location: string | null
          phone: string | null
          portifolio_url: string | null
          profile_id: string | null
          real_name: string | null
          rider_requirements: string | null
          soundcloud_url: string | null
          spotify_url: string | null
          status: Database["public"]["Enums"]["dj_status"] | null
          tiktok_url: string | null
          updated_at: string | null
          user_id: string | null
          youtube_url: string | null
        }
        Insert: {
          artist_name: string
          avatar_url?: string | null
          background_image_url?: string | null
          base_price?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          genre?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_admin?: boolean | null
          location?: string | null
          phone?: string | null
          portifolio_url?: string | null
          profile_id?: string | null
          real_name?: string | null
          rider_requirements?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          status?: Database["public"]["Enums"]["dj_status"] | null
          tiktok_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          youtube_url?: string | null
        }
        Update: {
          artist_name?: string
          avatar_url?: string | null
          background_image_url?: string | null
          base_price?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          genre?: string | null
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          is_admin?: boolean | null
          location?: string | null
          phone?: string | null
          portifolio_url?: string | null
          profile_id?: string | null
          real_name?: string | null
          rider_requirements?: string | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          status?: Database["public"]["Enums"]["dj_status"] | null
          tiktok_url?: string | null
          updated_at?: string | null
          user_id?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "djs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "djs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_djs: {
        Row: {
          created_at: string | null
          dj_id: string
          event_id: string
          fee: number | null
          id: string
        }
        Insert: {
          created_at?: string | null
          dj_id: string
          event_id: string
          fee?: number | null
          id?: string
        }
        Update: {
          created_at?: string | null
          dj_id?: string
          event_id?: string
          fee?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_djs_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "djs"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          cache_value: number
          city: string | null
          commission_amount: number | null
          commission_rate: number | null
          contract_attached: boolean | null
          contract_content: string | null
          contract_type: string | null
          created_at: string
          description: string | null
          dj_id: string | null
          dress_code: string | null
          end_time: string | null
          equipment_provided: string | null
          event_date: string
          event_name: string
          expected_attendees: number | null
          fee: number
          id: string
          location: string | null
          payment_proof: string | null
          payment_status: string | null
          producer_id: string | null
          shared_with_manager: boolean
          special_requirements: string | null
          start_time: string | null
          state: string | null
          status: string | null
          updated_at: string
          venue: string | null
        }
        Insert: {
          address?: string | null
          cache_value?: number
          city?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          contract_attached?: boolean | null
          contract_content?: string | null
          contract_type?: string | null
          created_at?: string
          description?: string | null
          dj_id?: string | null
          dress_code?: string | null
          end_time?: string | null
          equipment_provided?: string | null
          event_date: string
          event_name: string
          expected_attendees?: number | null
          fee?: number
          id?: string
          location?: string | null
          payment_proof?: string | null
          payment_status?: string | null
          producer_id?: string | null
          shared_with_manager?: boolean
          special_requirements?: string | null
          start_time?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          venue?: string | null
        }
        Update: {
          address?: string | null
          cache_value?: number
          city?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          contract_attached?: boolean | null
          contract_content?: string | null
          contract_type?: string | null
          created_at?: string
          description?: string | null
          dj_id?: string | null
          dress_code?: string | null
          end_time?: string | null
          equipment_provided?: string | null
          event_date?: string
          event_name?: string
          expected_attendees?: number | null
          fee?: number
          id?: string
          location?: string | null
          payment_proof?: string | null
          payment_status?: string | null
          producer_id?: string | null
          shared_with_manager?: boolean
          special_requirements?: string | null
          start_time?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "djs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          description: string
          event_id: string | null
          id: string
          is_recurring: boolean | null
          recurrence_period: string | null
          total_events: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          description: string
          event_id?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_period?: string | null
          total_events?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          description?: string
          event_id?: string | null
          id?: string
          is_recurring?: boolean | null
          recurrence_period?: string | null
          total_events?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      media: {
        Row: {
          bucket_name: string
          category: string
          created_at: string
          description: string | null
          dj_id: string | null
          event_id: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          mime_type: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          category: string
          created_at?: string
          description?: string | null
          dj_id?: string | null
          event_id?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          mime_type?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          category?: string
          created_at?: string
          description?: string | null
          dj_id?: string | null
          event_id?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      media_files: {
        Row: {
          bucket_name: string | null
          created_at: string | null
          description: string | null
          dj_id: string | null
          duration: number | null
          file_category: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          is_public: boolean | null
          metadata: Json | null
          thumbnail_url: string | null
          title: string | null
          uploaded_by: string | null
        }
        Insert: {
          bucket_name?: string | null
          created_at?: string | null
          description?: string | null
          dj_id?: string | null
          duration?: number | null
          file_category?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          thumbnail_url?: string | null
          title?: string | null
          uploaded_by?: string | null
        }
        Update: {
          bucket_name?: string | null
          created_at?: string | null
          description?: string | null
          dj_id?: string | null
          duration?: number | null
          file_category?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          thumbnail_url?: string | null
          title?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_files_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "djs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          dj_id: string | null
          id: string
          is_read: boolean
          message: string | null
          payment_id: string | null
          producer_id: string | null
          recipient_id: string | null
          recipient_role: string
          title: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          dj_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          payment_id?: string | null
          producer_id?: string | null
          recipient_id?: string | null
          recipient_role?: string
          title: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          dj_id?: string | null
          id?: string
          is_read?: boolean
          message?: string | null
          payment_id?: string | null
          producer_id?: string | null
          recipient_id?: string | null
          recipient_role?: string
          title?: string
        }
        Relationships: []
      }
      payment_status_detailed: {
        Row: {
          contract_instance_id: string
          created_at: string | null
          due_date: string | null
          id: string
          paid_amount: number | null
          payment_history: Json | null
          payment_proof_urls: Json | null
          status: string | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          contract_instance_id: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          paid_amount?: number | null
          payment_history?: Json | null
          payment_proof_urls?: Json | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Update: {
          contract_instance_id?: string
          created_at?: string | null
          due_date?: string | null
          id?: string
          paid_amount?: number | null
          payment_history?: Json | null
          payment_proof_urls?: Json | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string | null
          event_id: string | null
          id: string
          paid_at: string | null
          payment_proof_url: string | null
          producer_id: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          paid_at?: string | null
          payment_proof_url?: string | null
          producer_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          paid_at?: string | null
          payment_proof_url?: string | null
          producer_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
      producer_access: {
        Row: {
          contract_based: boolean | null
          created_at: string
          dj_id: string
          expires_at: string | null
          granted_by: string | null
          id: string
          permissions: Json | null
          producer_id: string
          updated_at: string
        }
        Insert: {
          contract_based?: boolean | null
          created_at?: string
          dj_id: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          permissions?: Json | null
          producer_id: string
          updated_at?: string
        }
        Update: {
          contract_based?: boolean | null
          created_at?: string
          dj_id?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          permissions?: Json | null
          producer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      producers: {
        Row: {
          address: string | null
          avatar_url: string | null
          business_address: string | null
          cnpj: string | null
          company_name: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          business_address?: string | null
          cnpj?: string | null
          company_name?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id: string
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          business_address?: string | null
          cnpj?: string | null
          company_name?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "producers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_notes: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          rating: number | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      shared_media_links: {
        Row: {
          accessed_count: number | null
          created_at: string | null
          dj_id: string
          expires_at: string
          id: string
          last_accessed_at: string | null
          password_hash: string
          producer_id: string
          share_token: string
        }
        Insert: {
          accessed_count?: number | null
          created_at?: string | null
          dj_id: string
          expires_at: string
          id?: string
          last_accessed_at?: string | null
          password_hash?: string
          producer_id: string
          share_token: string
        }
        Update: {
          accessed_count?: number | null
          created_at?: string | null
          dj_id?: string
          expires_at?: string
          id?: string
          last_accessed_at?: string | null
          password_hash?: string
          producer_id?: string
          share_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_media_links_dj_id_fkey"
            columns: ["dj_id"]
            isOneToOne: false
            referencedRelation: "djs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_media_links_producer_id_fkey"
            columns: ["producer_id"]
            isOneToOne: false
            referencedRelation: "producers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_link_access: {
        Args: { token: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_uuid: string }
        Returns: boolean
      }
      is_shared_link_valid: {
        Args: { token: string }
        Returns: boolean
      }
      user_id: {
        Args: { user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      dj_status: "ativo" | "ocupado" | "inativo"
      event_status: "pendente" | "confirmado" | "concluido" | "cancelado"
      payment_status:
        | "pendente"
        | "processado"
        | "atrasado"
        | "pago"
        | "pagamento_enviado"
      user_role: "admin" | "producer" | "dj"
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
      dj_status: ["ativo", "ocupado", "inativo"],
      event_status: ["pendente", "confirmado", "concluido", "cancelado"],
      payment_status: [
        "pendente",
        "processado",
        "atrasado",
        "pago",
        "pagamento_enviado",
      ],
      user_role: ["admin", "producer", "dj"],
    },
  },
} as const
