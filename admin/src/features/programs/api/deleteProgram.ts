import { supabase } from '@/lib/supabase';
import { logAdminAction } from '@/lib/audit';
import type { Program } from '@/types/content';

export async function deleteProgram(id: string): Promise<void> {
  const { data: before, error: beforeErr } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single();
  if (beforeErr) throw beforeErr;

  const { error } = await supabase.from('programs').delete().eq('id', id);
  if (error) throw error;

  await logAdminAction('delete', 'program', id, before as Program, null);
}
