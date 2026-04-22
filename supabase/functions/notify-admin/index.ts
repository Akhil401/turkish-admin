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
    if (!record) {
      return new Response('No record in payload', { status: 200 });
    }

    const receiverId = record.receiver_id;
    const senderId = record.sender_id;
    const content = record.content || 'You have a new message.';

    if (!receiverId) {
      return new Response('No receiver_id', { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Look up the receiver's push subscription
    const { data: subData, error: subError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', receiverId)
      .single();

    if (subError || !subData?.endpoint) {
      console.log('No push subscription found for receiver:', receiverId, subError);
      return new Response('No push subscription for receiver', { status: 200 });
    }

    console.log('Sending push to endpoint:', subData.endpoint);

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

    const notificationPayload = JSON.stringify({
      title: '💬 New Message',
      body: content,
      url: `https://turkish-admin.pages.dev/chat?userId=${senderId}`,
    });

    await webpush.sendNotification(pushSubscription, notificationPayload);

    console.log('✅ Push notification sent successfully');
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
