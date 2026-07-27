import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// @ts-ignore
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log('Webhook payload received:', JSON.stringify(payload));

    const record = payload.record;
    const table = payload.table;

    if (!record) {
      return new Response('No record in payload', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    let title = '';
    let body = '';
    let url = 'https://turkish-admin.pages.dev/';
    let targetUserId = record.receiver_id;

    if (table === 'messages') {
      title = '💬 New Message';
      body = record.content || 'You have a new message.';
      url = `https://turkish-admin.pages.dev/chat?userId=${record.sender_id}`;
    } else if (table === 'orders') {
      title = '🍕 New Order Received!';
      body = `Order #${record.id.slice(-6).toUpperCase()} - Total: €${record.total}`;
      url = 'https://turkish-admin.pages.dev/orders';
      
      // For orders, we find the first available push subscription (admin)
      if (!targetUserId) {
        const { data: adminSub } = await supabase
          .from('push_subscriptions')
          .select('user_id')
          .limit(1)
          .single();
        targetUserId = adminSub?.user_id;
      }
    }

    if (!targetUserId) {
      return new Response('No target user found for notification', { status: 200 });
    }

    // Look up the push subscription
    const { data: subData, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', targetUserId)
      .single();

    if (subError || !subData?.endpoint) {
      console.log('No push subscription found for user:', targetUserId);
      return new Response('No push subscription found', { status: 200 });
    }

    // Configure VAPID
    webpush.setVapidDetails(
      'mailto:admin@turkishkelleci.com',
      Deno.env.get('VAPID_PUBLIC_KEY')!,
      Deno.env.get('VAPID_PRIVATE_KEY')!
    );

    const pushSubscription = {
      endpoint: subData.endpoint,
      keys: {
        p256dh: subData.p256dh,
        auth: subData.auth,
      },
    };

    const notificationPayload = JSON.stringify({ title, body, url });

    await webpush.sendNotification(pushSubscription, notificationPayload);

    console.log(`✅ Push notification sent successfully for ${table}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in notify-admin function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
