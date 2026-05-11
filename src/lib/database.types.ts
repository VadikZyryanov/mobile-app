export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author_id: string;
          body: string;
          cover_path: string | null;
          created_at: string;
          excerpt: string | null;
          id: string;
          published_at: string | null;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body: string;
          cover_path?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published_at?: string | null;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          cover_path?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          published_at?: string | null;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'blog_posts_author_id_fkey';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      exercises: {
        Row: {
          created_at: string;
          description: string | null;
          equipment: string[];
          gif_path: string | null;
          id: string;
          min_tier: Database['public']['Enums']['subscription_tier_enum'];
          name: string;
          primary_muscle: Database['public']['Enums']['muscle_group_enum'];
          search_tsv: unknown;
          secondary_muscles: Database['public']['Enums']['muscle_group_enum'][];
          slug: string;
          updated_at: string;
          video_path: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          equipment?: string[];
          gif_path?: string | null;
          id?: string;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          name: string;
          primary_muscle: Database['public']['Enums']['muscle_group_enum'];
          search_tsv?: unknown;
          secondary_muscles?: Database['public']['Enums']['muscle_group_enum'][];
          slug: string;
          updated_at?: string;
          video_path?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          equipment?: string[];
          gif_path?: string | null;
          id?: string;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          name?: string;
          primary_muscle?: Database['public']['Enums']['muscle_group_enum'];
          search_tsv?: unknown;
          secondary_muscles?: Database['public']['Enums']['muscle_group_enum'][];
          slug?: string;
          updated_at?: string;
          video_path?: string | null;
        };
        Relationships: [];
      };
      foods: {
        Row: {
          brand: string | null;
          carbs_per_100g: number;
          created_at: string;
          fat_per_100g: number;
          id: string;
          kcal_per_100g: number;
          name: string;
          protein_per_100g: number;
          slug: string;
          updated_at: string;
        };
        Insert: {
          brand?: string | null;
          carbs_per_100g: number;
          created_at?: string;
          fat_per_100g: number;
          id?: string;
          kcal_per_100g: number;
          name: string;
          protein_per_100g: number;
          slug: string;
          updated_at?: string;
        };
        Update: {
          brand?: string | null;
          carbs_per_100g?: number;
          created_at?: string;
          fat_per_100g?: number;
          id?: string;
          kcal_per_100g?: number;
          name?: string;
          protein_per_100g?: number;
          slug?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      nutrition_entries: {
        Row: {
          consumed_at: string;
          consumed_on: string;
          created_at: string;
          food_id: string;
          id: string;
          meal_type: Database['public']['Enums']['meal_type_enum'];
          quantity_grams: number;
          user_id: string;
        };
        Insert: {
          consumed_at?: string;
          consumed_on?: string;
          created_at?: string;
          food_id: string;
          id?: string;
          meal_type: Database['public']['Enums']['meal_type_enum'];
          quantity_grams: number;
          user_id: string;
        };
        Update: {
          consumed_at?: string;
          consumed_on?: string;
          created_at?: string;
          food_id?: string;
          id?: string;
          meal_type?: Database['public']['Enums']['meal_type_enum'];
          quantity_grams?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'nutrition_entries_food_id_fkey';
            columns: ['food_id'];
            isOneToOne: false;
            referencedRelation: 'foods';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nutrition_entries_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          activity_level: Database['public']['Enums']['activity_level_enum'] | null;
          avatar_url: string | null;
          birth_date: string | null;
          carbs_g_target: number | null;
          created_at: string;
          display_name: string | null;
          fat_g_target: number | null;
          height_cm: number | null;
          id: string;
          is_admin: boolean;
          kcal_target: number | null;
          protein_g_target: number | null;
          revenuecat_app_user_id: string | null;
          sex: Database['public']['Enums']['sex_enum'] | null;
          subscription_expires_at: string | null;
          subscription_product_id: string | null;
          subscription_status: Database['public']['Enums']['subscription_status_enum'];
          subscription_tier: Database['public']['Enums']['subscription_tier_enum'];
          subscription_updated_at: string | null;
          subscription_will_renew: boolean;
          updated_at: string;
          weight_goal: Database['public']['Enums']['weight_goal_enum'] | null;
          weight_kg: number | null;
        };
        Insert: {
          activity_level?: Database['public']['Enums']['activity_level_enum'] | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          carbs_g_target?: number | null;
          created_at?: string;
          display_name?: string | null;
          fat_g_target?: number | null;
          height_cm?: number | null;
          id: string;
          is_admin?: boolean;
          kcal_target?: number | null;
          protein_g_target?: number | null;
          revenuecat_app_user_id?: string | null;
          sex?: Database['public']['Enums']['sex_enum'] | null;
          subscription_expires_at?: string | null;
          subscription_product_id?: string | null;
          subscription_status?: Database['public']['Enums']['subscription_status_enum'];
          subscription_tier?: Database['public']['Enums']['subscription_tier_enum'];
          subscription_updated_at?: string | null;
          subscription_will_renew?: boolean;
          updated_at?: string;
          weight_goal?: Database['public']['Enums']['weight_goal_enum'] | null;
          weight_kg?: number | null;
        };
        Update: {
          activity_level?: Database['public']['Enums']['activity_level_enum'] | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          carbs_g_target?: number | null;
          created_at?: string;
          display_name?: string | null;
          fat_g_target?: number | null;
          height_cm?: number | null;
          id?: string;
          is_admin?: boolean;
          kcal_target?: number | null;
          protein_g_target?: number | null;
          revenuecat_app_user_id?: string | null;
          sex?: Database['public']['Enums']['sex_enum'] | null;
          subscription_expires_at?: string | null;
          subscription_product_id?: string | null;
          subscription_status?: Database['public']['Enums']['subscription_status_enum'];
          subscription_tier?: Database['public']['Enums']['subscription_tier_enum'];
          subscription_updated_at?: string | null;
          subscription_will_renew?: boolean;
          updated_at?: string;
          weight_goal?: Database['public']['Enums']['weight_goal_enum'] | null;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      program_workouts: {
        Row: {
          day_of_week: number;
          program_id: string;
          week: number;
          workout_id: string;
        };
        Insert: {
          day_of_week: number;
          program_id: string;
          week: number;
          workout_id: string;
        };
        Update: {
          day_of_week?: number;
          program_id?: string;
          week?: number;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'program_workouts_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_workouts_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
        ];
      };
      programs: {
        Row: {
          cover_path: string | null;
          created_at: string;
          description: string | null;
          difficulty: number;
          id: string;
          min_tier: Database['public']['Enums']['subscription_tier_enum'];
          sessions_per_week: number;
          slug: string;
          title: string;
          updated_at: string;
          weeks: number;
        };
        Insert: {
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          difficulty: number;
          id?: string;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          sessions_per_week: number;
          slug: string;
          title: string;
          updated_at?: string;
          weeks: number;
        };
        Update: {
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          difficulty?: number;
          id?: string;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          sessions_per_week?: number;
          slug?: string;
          title?: string;
          updated_at?: string;
          weeks?: number;
        };
        Relationships: [];
      };
      subscription_events: {
        Row: {
          app_user_id: string;
          entitlement_id: string | null;
          event_id: string;
          event_type: string;
          expires_at: string | null;
          id: string;
          processed_at: string;
          product_id: string | null;
          raw_payload: Json;
        };
        Insert: {
          app_user_id: string;
          entitlement_id?: string | null;
          event_id: string;
          event_type: string;
          expires_at?: string | null;
          id?: string;
          processed_at?: string;
          product_id?: string | null;
          raw_payload: Json;
        };
        Update: {
          app_user_id?: string;
          entitlement_id?: string | null;
          event_id?: string;
          event_type?: string;
          expires_at?: string | null;
          id?: string;
          processed_at?: string;
          product_id?: string | null;
          raw_payload?: Json;
        };
        Relationships: [];
      };
      workout_exercises: {
        Row: {
          exercise_id: string;
          notes: string | null;
          position: number;
          reps: string;
          rest_seconds: number;
          sets: number;
          workout_id: string;
        };
        Insert: {
          exercise_id: string;
          notes?: string | null;
          position: number;
          reps: string;
          rest_seconds: number;
          sets: number;
          workout_id: string;
        };
        Update: {
          exercise_id?: string;
          notes?: string | null;
          position?: number;
          reps?: string;
          rest_seconds?: number;
          sets?: number;
          workout_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_exercises_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
        ];
      };
      workouts: {
        Row: {
          category: Database['public']['Enums']['workout_category_enum'];
          cover_path: string | null;
          created_at: string;
          description: string | null;
          difficulty: number;
          duration_minutes: number;
          id: string;
          min_tier: Database['public']['Enums']['subscription_tier_enum'];
          search_tsv: unknown;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          category: Database['public']['Enums']['workout_category_enum'];
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          difficulty: number;
          duration_minutes: number;
          id?: string;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          search_tsv?: unknown;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: Database['public']['Enums']['workout_category_enum'];
          cover_path?: string | null;
          created_at?: string;
          description?: string | null;
          difficulty?: number;
          duration_minutes?: number;
          id?: string;
          min_tier?: Database['public']['Enums']['subscription_tier_enum'];
          search_tsv?: unknown;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_exercise_gif_url: { Args: { exercise_slug: string }; Returns: string };
      get_exercise_video_url: {
        Args: { exercise_slug: string };
        Returns: string;
      };
      has_pro_max_access: { Args: never; Returns: boolean };
      is_admin: { Args: never; Returns: boolean };
      refresh_my_subscription_tier: {
        Args: never;
        Returns: Database['public']['Enums']['subscription_tier_enum'];
      };
      search_content: {
        Args: { q: string };
        Returns: {
          cover_path: string;
          id: string;
          kind: string;
          min_tier: Database['public']['Enums']['subscription_tier_enum'];
          rank: number;
          slug: string;
          subtitle: string;
          title: string;
        }[];
      };
    };
    Enums: {
      activity_level_enum: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
      meal_type_enum: 'breakfast' | 'lunch' | 'dinner' | 'snack';
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
      sex_enum: 'male' | 'female';
      subscription_status_enum:
        | 'active'
        | 'in_grace_period'
        | 'in_billing_retry'
        | 'paused'
        | 'expired'
        | 'cancelled'
        | 'unknown';
      subscription_tier_enum: 'free' | 'basic' | 'pro' | 'pro_max';
      weight_goal_enum: 'lose' | 'maintain' | 'gain';
      workout_category_enum: 'upper' | 'lower' | 'full_body' | 'cardio' | 'core';
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
      activity_level_enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      meal_type_enum: ['breakfast', 'lunch', 'dinner', 'snack'],
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
      ],
      sex_enum: ['male', 'female'],
      subscription_status_enum: [
        'active',
        'in_grace_period',
        'in_billing_retry',
        'paused',
        'expired',
        'cancelled',
        'unknown',
      ],
      subscription_tier_enum: ['free', 'basic', 'pro', 'pro_max'],
      weight_goal_enum: ['lose', 'maintain', 'gain'],
      workout_category_enum: ['upper', 'lower', 'full_body', 'cardio', 'core'],
    },
  },
} as const;
