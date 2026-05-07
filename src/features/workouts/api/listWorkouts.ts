import { supabase } from '@/lib/supabase';
import type { Workout, WorkoutCategory } from '../types';

export async function listWorkouts(category?: WorkoutCategory): Promise<Workout[]> {
  const builder = supabase.from('workouts').select('*');
  const query = category ? builder.eq('category', category) : builder;
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
