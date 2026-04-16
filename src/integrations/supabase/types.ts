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
      announcements: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string
          id: string
          image_url: string | null
          is_pinned: boolean
          target_audience: string
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          target_audience?: string
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean
          target_audience?: string
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      article_bookmarks: {
        Row: {
          article_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      change_entries: {
        Row: {
          admin_feedback: string | null
          admin_feedback_type: string | null
          body_area: string | null
          category: string | null
          content: string
          created_at: string
          date: string
          horse_id: string
          id: string
          notify_admin: boolean
          photos: string[] | null
          severity: string | null
          since_when: string | null
          updated_at: string
          user_id: string
          videos: string[] | null
          visible_to_admin: boolean
        }
        Insert: {
          admin_feedback?: string | null
          admin_feedback_type?: string | null
          body_area?: string | null
          category?: string | null
          content: string
          created_at?: string
          date?: string
          horse_id: string
          id?: string
          notify_admin?: boolean
          photos?: string[] | null
          severity?: string | null
          since_when?: string | null
          updated_at?: string
          user_id: string
          videos?: string[] | null
          visible_to_admin?: boolean
        }
        Update: {
          admin_feedback?: string | null
          admin_feedback_type?: string | null
          body_area?: string | null
          category?: string | null
          content?: string
          created_at?: string
          date?: string
          horse_id?: string
          id?: string
          notify_admin?: boolean
          photos?: string[] | null
          severity?: string | null
          since_when?: string | null
          updated_at?: string
          user_id?: string
          videos?: string[] | null
          visible_to_admin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "change_entries_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category: string | null
          content: string
          created_at: string
          horse_id: string | null
          id: string
          is_hidden: boolean
          is_pinned: boolean
          photos: string[] | null
          updated_at: string
          user_id: string
          videos: string[] | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          horse_id?: string | null
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          photos?: string[] | null
          updated_at?: string
          user_id: string
          videos?: string[] | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          horse_id?: string | null
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          photos?: string[] | null
          updated_at?: string
          user_id?: string
          videos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      community_reactions: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          activity_type: string
          content: string | null
          created_at: string
          date: string
          duration_minutes: number | null
          horse_id: string
          horse_mood: string | null
          id: string
          notes: string | null
          photos: string[] | null
          training_plan_id: string | null
          updated_at: string
          user_id: string
          user_mood: string | null
          videos: string[] | null
          visible_to_admin: boolean
        }
        Insert: {
          activity_type: string
          content?: string | null
          created_at?: string
          date?: string
          duration_minutes?: number | null
          horse_id: string
          horse_mood?: string | null
          id?: string
          notes?: string | null
          photos?: string[] | null
          training_plan_id?: string | null
          updated_at?: string
          user_id: string
          user_mood?: string | null
          videos?: string[] | null
          visible_to_admin?: boolean
        }
        Update: {
          activity_type?: string
          content?: string | null
          created_at?: string
          date?: string
          duration_minutes?: number | null
          horse_id?: string
          horse_mood?: string | null
          id?: string
          notes?: string | null
          photos?: string[] | null
          training_plan_id?: string | null
          updated_at?: string
          user_id?: string
          user_mood?: string | null
          videos?: string[] | null
          visible_to_admin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_messages: {
        Row: {
          content: string
          created_at: string
          horse_id: string | null
          id: string
          is_read: boolean
          title: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          horse_id?: string | null
          id?: string
          is_read?: boolean
          title: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          horse_id?: string | null
          id?: string
          is_read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_messages_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      horses: {
        Row: {
          archived: boolean
          birth_date: string | null
          breed: string | null
          color: string | null
          created_at: string
          farrier_name: string | null
          farrier_phone: string | null
          gender: string | null
          height_cm: number | null
          history: string | null
          id: string
          name: string
          nickname: string | null
          notes: string | null
          owner_id: string
          photo_url: string | null
          reha_end_date: string | null
          reha_start_date: string | null
          reha_status: Database["public"]["Enums"]["reha_status"]
          reha_summary: string | null
          share_changes: boolean
          share_diary: boolean
          share_positive: boolean
          updated_at: string
          vet_name: string | null
          vet_phone: string | null
        }
        Insert: {
          archived?: boolean
          birth_date?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          farrier_name?: string | null
          farrier_phone?: string | null
          gender?: string | null
          height_cm?: number | null
          history?: string | null
          id?: string
          name: string
          nickname?: string | null
          notes?: string | null
          owner_id: string
          photo_url?: string | null
          reha_end_date?: string | null
          reha_start_date?: string | null
          reha_status?: Database["public"]["Enums"]["reha_status"]
          reha_summary?: string | null
          share_changes?: boolean
          share_diary?: boolean
          share_positive?: boolean
          updated_at?: string
          vet_name?: string | null
          vet_phone?: string | null
        }
        Update: {
          archived?: boolean
          birth_date?: string | null
          breed?: string | null
          color?: string | null
          created_at?: string
          farrier_name?: string | null
          farrier_phone?: string | null
          gender?: string | null
          height_cm?: number | null
          history?: string | null
          id?: string
          name?: string
          nickname?: string | null
          notes?: string | null
          owner_id?: string
          photo_url?: string | null
          reha_end_date?: string | null
          reha_start_date?: string | null
          reha_status?: Database["public"]["Enums"]["reha_status"]
          reha_summary?: string | null
          share_changes?: boolean
          share_diary?: boolean
          share_positive?: boolean
          updated_at?: string
          vet_name?: string | null
          vet_phone?: string | null
        }
        Relationships: []
      }
      news_messages: {
        Row: {
          id: string
          news_id: string
          user_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          news_id: string
          user_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          news_id?: string
          user_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      news_posts: {
        Row: {
          id: string
          author_id: string
          title: string
          content: string
          image_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          content: string
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          content?: string
          image_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_reactions: {
        Row: {
          id: string
          news_id: string
          user_id: string
          emoji: string
          created_at: string
        }
        Insert: {
          id?: string
          news_id: string
          user_id: string
          emoji?: string
          created_at?: string
        }
        Update: {
          id?: string
          news_id?: string
          user_id?: string
          emoji?: string
          created_at?: string
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          created_by: string
          difficulty: string | null
          id: string
          published_at: string | null
          tags: string[] | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          category: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          difficulty?: string | null
          id?: string
          published_at?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          difficulty?: string | null
          id?: string
          published_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      observation_prompts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          text?: string
        }
        Relationships: []
      }
      positive_entries: {
        Row: {
          category: string | null
          content: string
          created_at: string
          date: string
          horse_id: string
          id: string
          photo_url: string | null
          share_in_community: boolean
          updated_at: string
          user_id: string
          video_url: string | null
          visible_to_admin: boolean
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          date?: string
          horse_id: string
          id?: string
          photo_url?: string | null
          share_in_community?: boolean
          updated_at?: string
          user_id: string
          video_url?: string | null
          visible_to_admin?: boolean
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          date?: string
          horse_id?: string
          id?: string
          photo_url?: string | null
          share_in_community?: boolean
          updated_at?: string
          user_id?: string
          video_url?: string | null
          visible_to_admin?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "positive_entries_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_complete: boolean
          phone: string | null
          street: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          street?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_complete?: boolean
          phone?: string | null
          street?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      reha_updates: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string
          date: string
          horse_id: string
          id: string
          is_read: boolean
          mood: string | null
          photos: string[] | null
          title: string | null
          updated_at: string
          videos: string[] | null
          visibility: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by: string
          date?: string
          horse_id: string
          id?: string
          is_read?: boolean
          mood?: string | null
          photos?: string[] | null
          title?: string | null
          updated_at?: string
          videos?: string[] | null
          visibility?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          date?: string
          horse_id?: string
          id?: string
          is_read?: boolean
          mood?: string | null
          photos?: string[] | null
          title?: string | null
          updated_at?: string
          videos?: string[] | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "reha_updates_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plan_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          horse_id: string
          id: string
          note: string | null
          plan_id: string
          progress: Json | null
          updated_at: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          assigned_by: string
          created_at?: string
          horse_id: string
          id?: string
          note?: string | null
          plan_id: string
          progress?: Json | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          assigned_by?: string
          created_at?: string
          horse_id?: string
          id?: string
          note?: string | null
          plan_id?: string
          progress?: Json | null
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_plan_assignments_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plan_assignments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          content: Json | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          pdf_url: string | null
          plan_type: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          pdf_url?: string | null
          plan_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          pdf_url?: string | null
          plan_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      app_role: "admin" | "user"
      reha_status: "none" | "active" | "completed"
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
      reha_status: ["none", "active", "completed"],
    },
  },
} as const
