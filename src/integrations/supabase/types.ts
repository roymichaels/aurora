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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          content_json: Json
          created_at: string
          framework: string
          id: string
          linked_goal_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_json?: Json
          created_at?: string
          framework: string
          id?: string
          linked_goal_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_json?: Json
          created_at?: string
          framework?: string
          id?: string
          linked_goal_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      current_focus: {
        Row: {
          started_at: string
          task_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          started_at?: string
          task_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          started_at?: string
          task_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "current_focus_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          id: string
          payload: Json
          ts: string
          type: string
          user_id: string
        }
        Insert: {
          id?: string
          payload?: Json
          ts?: string
          type: string
          user_id: string
        }
        Update: {
          id?: string
          payload?: Json
          ts?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          id: string
          intensity: number | null
          next_action: string | null
          review_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          why: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          intensity?: number | null
          next_action?: string | null
          review_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          why?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          intensity?: number | null
          next_action?: string | null
          review_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          why?: string | null
        }
        Relationships: []
      }
      ideas: {
        Row: {
          content: string
          created_at: string
          id: string
          linked_goal_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          linked_goal_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          linked_goal_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      moments: {
        Row: {
          content: string | null
          created_at: string
          folder: string | null
          id: string
          linked_goal_id: string | null
          state: string | null
          storage_path: string | null
          tags: string[]
          type: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          folder?: string | null
          id?: string
          linked_goal_id?: string | null
          state?: string | null
          storage_path?: string | null
          tags?: string[]
          type: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          folder?: string | null
          id?: string
          linked_goal_id?: string | null
          state?: string | null
          storage_path?: string | null
          tags?: string[]
          type?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "moments_linked_goal_id_fkey"
            columns: ["linked_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          gesture_type: string | null
          id: string
          onboarded_at: string | null
          role: string
          theme: Json | null
          persona: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gesture_type?: string | null
          id: string
          onboarded_at?: string | null
          role?: string
          theme?: Json | null
          persona?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gesture_type?: string | null
          id?: string
          onboarded_at?: string | null
          role?: string
          theme?: Json | null
          persona?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      quests: {
        Row: {
          completed_bool: boolean
          created_at: string
          date: string
          id: string
          quest_id: string
          updated_at: string
          user_id: string
          xp_awarded_int: number
        }
        Insert: {
          completed_bool?: boolean
          created_at?: string
          date?: string
          id?: string
          quest_id: string
          updated_at?: string
          user_id: string
          xp_awarded_int?: number
        }
        Update: {
          completed_bool?: boolean
          created_at?: string
          date?: string
          id?: string
          quest_id?: string
          updated_at?: string
          user_id?: string
          xp_awarded_int?: number
        }
        Relationships: []
      }
      roadmaps: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          position: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          position?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          position?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          minutes: number | null
          mood_after: string | null
          mood_before: string | null
          quality_score: number | null
          started_at: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          minutes?: number | null
          mood_after?: string | null
          mood_before?: string | null
          quality_score?: number | null
          started_at?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          minutes?: number | null
          mood_after?: string | null
          mood_before?: string | null
          quality_score?: number | null
          started_at?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sleep_sessions: {
        Row: {
          ambience_sound_id: string | null
          completed: boolean
          created_at: string
          end_at: string | null
          id: string
          start_at: string
          track_id: string | null
          track_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ambience_sound_id?: string | null
          completed?: boolean
          created_at?: string
          end_at?: string | null
          id?: string
          start_at?: string
          track_id?: string | null
          track_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ambience_sound_id?: string | null
          completed?: boolean
          created_at?: string
          end_at?: string | null
          id?: string
          start_at?: string
          track_id?: string | null
          track_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sleep_sessions_ambience_sound_id_fkey"
            columns: ["ambience_sound_id"]
            isOneToOne: false
            referencedRelation: "sounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sleep_sessions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      sounds: {
        Row: {
          audio_url: string
          category: string | null
          created_at: string
          id: string
          loop_end_ms: number | null
          loop_start_ms: number | null
          title: string
          updated_at: string
        }
        Insert: {
          audio_url: string
          category?: string | null
          created_at?: string
          id?: string
          loop_end_ms?: number | null
          loop_start_ms?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string
          category?: string | null
          created_at?: string
          id?: string
          loop_end_ms?: number | null
          loop_start_ms?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          position: number | null
          roadmap_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          position?: number | null
          roadmap_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          position?: number | null
          roadmap_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          audio_url: string
          created_at: string
          description: string | null
          downloadable: boolean
          duration_seconds: number | null
          id: string
          kind: Database["public"]["Enums"]["track_kind"]
          title: string
          updated_at: string
        }
        Insert: {
          audio_url: string
          created_at?: string
          description?: string | null
          downloadable?: boolean
          duration_seconds?: number | null
          id?: string
          kind: Database["public"]["Enums"]["track_kind"]
          title: string
          updated_at?: string
        }
        Update: {
          audio_url?: string
          created_at?: string
          description?: string | null
          downloadable?: boolean
          duration_seconds?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["track_kind"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_audio_settings: {
        Row: {
          background_sound_id: string | null
          created_at: string
          is_playing: boolean
          loop: boolean
          updated_at: string
          user_id: string
          volume: number
        }
        Insert: {
          background_sound_id?: string | null
          created_at?: string
          is_playing?: boolean
          loop?: boolean
          updated_at?: string
          user_id: string
          volume?: number
        }
        Update: {
          background_sound_id?: string | null
          created_at?: string
          is_playing?: boolean
          loop?: boolean
          updated_at?: string
          user_id?: string
          volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_audio_settings_background_sound_id_fkey"
            columns: ["background_sound_id"]
            isOneToOne: false
            referencedRelation: "sounds"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          created_at: string
          last_active_date: string | null
          level: number
          streak_count: number
          total_xp: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          last_active_date?: string | null
          level?: number
          streak_count?: number
          total_xp?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          last_active_date?: string | null
          level?: number
          streak_count?: number
          total_xp?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: { activity: string; amount: number; metadata?: Json }
        Returns: {
          total_xp: number
          streak_count: number
        }[]
      }
      is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
    }
    Enums: {
      track_kind: "install" | "maintain" | "nap" | "anchor" | "morning"
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
      track_kind: ["install", "maintain", "nap", "anchor", "morning"],
    },
  },
} as const
