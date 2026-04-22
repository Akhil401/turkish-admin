import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    // Supabase DB webhook sends { type, table, record, old_record }
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

    // Create a Supabase admin client to look up the receiver's OneSignal token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: tokenData, error: tokenError } = await supabase
      .from('one_signal_tokens')
      .select('player_id')
      .eq('user_id', receiverId)
      .single();

    if (tokenError || !tokenData?.player_id) {
      console.log('No OneSignal token found for receiver:', receiverId, tokenError);
      return new Response('No token found for receiver', { status: 200 });
    }

    console.log('Sending push to player_id:', tokenData.player_id);

    // Send push notification via OneSignal REST API
    const oneSignalResponse = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Deno.env.get('ONESIGNAL_REST_KEY')}`,
      },
      body: JSON.stringify({
        app_id: Deno.env.get('ONESIGNAL_APP_ID'),
        include_player_ids: [tokenData.player_id],
        headings: { en: '💬 New Message' },
        contents: { en: content },
        url: `https://turkish-admin.pages.dev/chat?userId=${senderId}`,
        // Show notification even if browser tab is open
        web_push_topic: `chat-${senderId}`,
      }),
    });

    const result = await oneSignalResponse.json();
    console.log('OneSignal API response:', JSON.stringify(result));

    return new Response(JSON.stringify(result), {
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
