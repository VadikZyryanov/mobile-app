export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          subscription_tier: Database['public']['Enums']['subscription_tier_enum'];
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: Database['public']['Enums']['subscription_tier_enum'];
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          subscription_tier?: Database['public']['Enums']['subscription_tier_enum'];
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          primary_muscle: Database['public']['Enums']['muscle_group_enum'];
          secondary_muscles: Database['public']['Enums']['muscle_group_enum'][];
          equipment: string[];
          gif_path: string | null;
          video_path: string | null;
          min_tier: Database['public']['Enums']['subscription_tier_enum'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          primary_muscle: Database['public']['Enums']['muscle_group_enum'];
          secondary_muscles?: Database['public']['Enums']['muscle_group_enum'][];
          equipment?: string[];
          gif_path?: string | null;
          video_path?: string | null;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          primary_muscle?: Database['public']['Enums']['muscle_group_enum'];
          secondary_muscles?: Database['public']['Enums']['muscle_group_enum'][];
          equipment?: string[];
          gif_path?: string | null;
          video_path?: string | null;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          category: Database['public']['Enums']['workout_category_enum'];
          cover_path: string | null;
          duration_minutes: number;
          difficulty: number;
          min_tier: Database['public']['Enums']['subscription_tier_enum'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          category: Database['public']['Enums']['workout_category_enum'];
          cover_path?: string | null;
          duration_minutes: number;
          difficulty: number;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          category?: Database['public']['Enums']['workout_category_enum'];
          cover_path?: string | null;
          duration_minutes?: number;
          difficulty?: number;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      workout_exercises: {
        Row: {
          workout_id: string;
          position: number;
          exercise_id: string;
          sets: number;
          reps: string;
          rest_seconds: number;
          notes: string | null;
        };
        Insert: {
          workout_id: string;
          position: number;
          exercise_id: string;
          sets: number;
          reps: string;
          rest_seconds: number;
          notes?: string | null;
        };
        Update: {
          workout_id?: string;
          position?: number;
          exercise_id?: string;
          sets?: number;
          reps?: string;
          rest_seconds?: number;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_workout_id_fkey';
            columns: ['workout_id'];
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      programs: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string | null;
          cover_path: string | null;
          weeks: number;
          sessions_per_week: number;
          difficulty: number;
          min_tier: Database['public']['Enums']['subscription_tier_enum'];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          description?: string | null;
          cover_path?: string | null;
          weeks: number;
          sessions_per_week: number;
          difficulty: number;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          cover_path?: string | null;
          weeks?: number;
          sessions_per_week?: number;
          difficulty?: number;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      program_workouts: {
        Row: {
          program_id: string;
          week: number;
          day_of_week: number;
          workout_id: string;
        };
        Insert: {
          program_id: string;
          week: number;
          day_of_week: number;
          workout_id: string;
        };
        Update: {
          program_id?: string;
          week?: number;
          day_of_week?: number;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_workouts_program_id_fkey';
            columns: ['program_id'];
            referencedRelation: 'programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_workouts_workout_id_fkey';
            columns: ['workout_id'];
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
        ];
      };
      blog_posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body: string;
          cover_path: string | null;
          author_id: string;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt?: string | null;
          body: string;
          cover_path?: string | null;
          author_id: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          excerpt?: string | null;
          body?: string;
          cover_path?: string | null;
          author_id?: string;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_posts_author_id_fkey';
            columns: ['author_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      get_exercise_video_url: {
        Args: { exercise_slug: string };
        Returns: string | null;
      };
      get_exercise_gif_url: {
        Args: { exercise_slug: string };
        Returns: string | null;
      };
      search_content: {
        Args: { q: string };
        Returns: Array<{
          kind: string;
          id: string;
          slug: string;
          title: string;
          subtitle: string;
          cover_path: string | null;
          min_tier: Database['public']['Enums']['subscription_tier_enum'];
          rank: number;
        }>;
      };
    };
    Enums: {
      subscription_tier_enum: 'free' | 'basic' | 'pro' | 'pro_max';
      workout_category_enum: 'upper' | 'lower' | 'full_body' | 'cardio' | 'core';
      muscle_group_enum:
        | 'chest'
        | 'back'
        | 'shoulders'
        | 'biceps'
        | 'triceps'
        | 'quads'
        | 'hamstrings'
        | 'glutes'
        | 'calves'
        | 'core'
        | 'cardio';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      subscription_tier_enum: ['free', 'basic', 'pro', 'pro_max'] as const,
      workout_category_enum: ['upper', 'lower', 'full_body', 'cardio', 'core'] as const,
      muscle_group_enum: [
        'chest',
        'back',
        'shoulders',
        'biceps',
        'triceps',
        'quads',
        'hamstrings',
        'glutes',
        'calves',
        'core',
        'cardio',
      ] as const,
    },
  },
} as const;
