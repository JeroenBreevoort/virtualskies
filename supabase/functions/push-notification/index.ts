// @ts-ignore
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE'
  table: string
  record: {
    device_id: string
    callsign: string
    completed_at: string
  }
  schema: 'public'
  old_record: null | {
    completed_at: string | null
  }
}

serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    
    // Only process completion updates
    if (payload.type !== 'UPDATE' || 
        !payload.record.completed_at || 
        payload.old_record?.completed_at === payload.record.completed_at) {
      return new Response('Not a completion update', { status: 200 })
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the push token for this device
    const { data: tokenData } = await supabase
      .from('push_tokens')
      .select('expo_push_token')
      .eq('device_id', payload.record.device_id)
      .single()

    if (!tokenData?.expo_push_token) {
      return new Response('No push token found', { status: 200 })
    }

    // Send push notification via Expo's push service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Authorization': `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`,
      },
      body: JSON.stringify({
        to: tokenData.expo_push_token,
        title: 'Flight Completed',
        body: `Flight ${payload.record.callsign} has been completed`,
        data: { screen: 'settings' },
      }),
    })

    const result = await response.json()

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}) 