import { supabase } from '@/lib/supabase';

export type ContentEntity = 'exercise' | 'workout' | 'program' | 'blog_post' | 'food';
export type ContentAction = 'create' | 'update' | 'delete' | 'restore';

export async function logAdminAction(
  action: ContentAction,
  entity: ContentEntity,
  entityId: string,
  before: unknown,
  after: unknown,
  note?: string,
): Promise<void> {
  const { error } = await supabase.rpc('admin_log_content_action', {
    p_action: `${entity}.${action}`,
    p_entity_type: entity,
    p_entity_id: entityId,
    p_before: (before ?? null) as never,
    p_after: (after ?? null) as never,
    ...(note !== undefined ? { p_note: note } : {}),
  });
  if (error) throw error;
}
