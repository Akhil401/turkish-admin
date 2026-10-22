import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore
import webpush from 'npm:web-push@3.6.7';

// Called by a Database Webhook (Dashboard -> Database -> Webhooks) on messages / orders.
// The webhook must send the HTTP header `x-webhook-secret` = edge-function secret
// WEBHOOK_SECRET. The row is re-read with the service role; only table + id are trusted.

const encoder = new TextEncoder();

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

// Constant-time comparison: hash both values (fixed length) and compare every byte.
async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) {
    diff |= va[i] ^ vb[i];
  }
  return diff === 0;
}

async function checkWebhookSecret(req: Request): Promise<Response | null> {
  const expected = Deno.env.get('WEBHOOK_SECRET');
  if (!expected) {
    console.error('WEBHOOK_SECRET is not set - rejecting request. Set it with: supabase secrets set WEBHOOK_SECRET=<value>');
    return jsonResponse({ error: 'Server misconfigured' }, 500);
  }
  const provided = req.headers.get('x-webhook-secret') ?? '';
  if (!provided || !(await safeEqual(provided, expected))) {
    console.warn('Rejected request with a missing or invalid x-webhook-secret header');
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }
  return null;
}

serve(async (req) => {
  const denied = await checkWebhookSecret(req);
  if (denied) return denied;

  try {
    const payload = await req.json();
    const table = payload?.table;
    const recordId = payload?.record?.id;
    console.log('Webhook received:', table, recordId);

    if (!recordId || (table !== 'messages' && table !== 'orders')) {
      return new Response('No record in payload', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let title = '';
    let body = '';
    let url = 'https://turkish-admin.pages.dev/';
    let targetUserIds: string[] = [];

    if (table === 'messages') {
      const { data: message } = await supabase
        .from('messages')
        .select('id, sender_id, receiver_id, content')
        .eq('id', recordId)
        .maybeSingle();
      if (!message?.receiver_id) {
        return new Response('Message not found', { status: 200 });
      }
      const text = (message.content || '').trim();
      title = '💬 New Message';
      body = (text.length > 180 ? `${text.slice(0, 180)}…` : text) || 'You have a new message.';
      url = `https://turkish-admin.pages.dev/chat?userId=${encodeURIComponent(message.sender_id)}`;
      targetUserIds = [message.receiver_id];
    } else {
      const { data: order } = await supabase
        .from('orders')
        .select('id, total, status')
        .eq('id', recordId)
        .maybeSingle();
      if (!order) {
        return new Response('Order not found', { status: 200 });
      }
      const total = Number(order.total ?? 0).toFixed(2);
      const awaiting = order.status === 'pending_payment' ? ' (awaiting card payment)' : '';
      title = '🍕 New Order Received!';
      body = `Order #${String(order.id).slice(-6).toUpperCase()} - Total: €${total}${awaiting}`;
      url = 'https://turkish-admin.pages.dev/orders';

      // For orders, notify the admins that have a push subscription
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');
      targetUserIds = (admins || []).map((a) => a.id);
    }

    if (targetUserIds.length === 0) {
      return new Response('No target user found for notification', { status: 200 });
    }

    // Look up the push subscriptions
    const { data: subs, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id, endpoint, p256dh, auth')
      .in('user_id', targetUserIds);

    if (subError || !subs || subs.length === 0) {
      console.log('No push subscription found for users:', targetUserIds);
      return new Response('No push subscription found', { status: 200 });
    }

    // Configure VAPID
    webpush.setVapidDetails(
      'mailto:admin@turkishkelleci.com',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    );

    const notificationPayload = JSON.stringify({ title, body, url });

    let sent = 0;
    for (const sub of subs) {
      if (!sub.endpoint) continue;
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          notificationPayload
        );
        sent++;
      } catch (pushError) {
        console.error('Push failed for user', sub.user_id, pushError);
      }
    }

    console.log(`✅ ${sent} push notification(s) sent for ${table}`);
    return jsonResponse({ success: true, sent }, 200);
  } catch (error) {
    console.error('Error in notify-admin function:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
