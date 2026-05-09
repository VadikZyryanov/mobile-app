import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RC_WEBHOOK_SECRET = Deno.env.get('RC_WEBHOOK_SECRET')!;

type SubscriptionTier = 'free' | 'basic' | 'pro' | 'pro_max';
type SubscriptionStatus =
  | 'active'
  | 'in_grace_period'
  | 'in_billing_retry'
  | 'paused'
  | 'expired'
  | 'cancelled'
  | 'unknown';

const ENTITLEMENT_TO_TIER: Record<string, SubscriptionTier> = {
  basic: 'basic',
  pro: 'pro',
  pro_max: 'pro_max',
};

interface RCEvent {
  id: string;
  type: string;
  app_user_id: string;
  product_id?: string;
  entitlement_id?: string;
  expiration_at_ms?: number;
  grace_period_expiration_at_ms?: number;
}

interface RCPayload {
  event: RCEvent;
}

function mapEventToProfile(event: RCEvent): {
  tier?: SubscriptionTier;
  status: SubscriptionStatus;
  willRenew: boolean;
  expiresAt?: string | null;
} {
  const expiresAt = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null;

  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
    case 'PRODUCT_CHANGE':
    case 'UNCANCELLATION': {
      const tier = event.entitlement_id ? ENTITLEMENT_TO_TIER[event.entitlement_id] : undefined;
      return { tier, status: 'active', willRenew: true, expiresAt };
    }
    case 'CANCELLATION':
      return { status: 'cancelled', willRenew: false, expiresAt };
    case 'EXPIRATION':
      return { tier: 'free', status: 'expired', willRenew: false, expiresAt: null };
    case 'BILLING_ISSUE': {
      const grace = event.grace_period_expiration_at_ms
        ? new Date(event.grace_period_expiration_at_ms).toISOString()
        : null;
      return {
        status: grace ? 'in_grace_period' : 'in_billing_retry',
        willRenew: false,
        expiresAt: grace,
      };
    }
    case 'PAUSE':
      return { status: 'paused', willRenew: false, expiresAt };
    default:
      return { status: 'unknown', willRenew: false };
  }
}

Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  if (authHeader !== `Bearer ${RC_WEBHOOK_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let payload: RCPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  const event = payload.event;

  if (event.type === 'TEST') {
    return new Response('OK', { status: 200 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error: insertError } = await supabase.from('subscription_events').insert({
    event_id: event.id,
    event_type: event.type,
    app_user_id: event.app_user_id,
    product_id: event.product_id ?? null,
    entitlement_id: event.entitlement_id ?? null,
    expires_at: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : null,
    raw_payload: payload as unknown as Record<string, unknown>,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      return new Response('OK (duplicate)', { status: 200 });
    }
    console.error('[webhook] insert error:', insertError);
    return new Response('Internal Error', { status: 500 });
  }

  const { tier, status, willRenew, expiresAt } = mapEventToProfile(event);

  const profileUpdate: Record<string, unknown> = {
    subscription_status: status,
    subscription_will_renew: willRenew,
    subscription_expires_at: expiresAt !== undefined ? expiresAt : null,
    subscription_updated_at: new Date().toISOString(),
    revenuecat_app_user_id: event.app_user_id,
  };

  if (event.product_id) profileUpdate.subscription_product_id = event.product_id;
  if (tier) profileUpdate.subscription_tier = tier;

  const { error: updateError } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', event.app_user_id);

  if (updateError) {
    console.error('[webhook] profile update error:', updateError);
    return new Response('Internal Error', { status: 500 });
  }

  return new Response('OK', { status: 200 });
});
